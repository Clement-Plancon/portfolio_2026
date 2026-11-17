// Single-administrator authentication, verified only on the server.
//
// - The password is checked against an Argon2id hash (ADMIN_PASSWORD_HASH); it is never stored in clear.
// - A successful login creates a random session id, stored (hashed) in a shared key-value store, and a
//   signed cookie (HttpOnly, Secure, SameSite=Strict, __Host- prefix) that JavaScript cannot read.
// - Every request re-checks the signature, the absolute and idle expiry, and that the session still exists
//   in the store: logging out deletes it, so a copied cookie stops working at once.
// - The signing key is derived from ADMIN_SESSION_SECRET *and* the password hash: rotating the secret or
//   changing the password invalidates every session.
// - Login attempts are counted in the same shared store (per client and globally), with conditional
//   writes, so the limit holds across serverless instances.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { argon2Verify } from 'hash-wasm';
import { HttpError } from './http';

/* ---------- Shared store ---------- */

/** Key-value store shared by every function instance (Netlify Blobs in production). */
export interface KV {
  get<T>(key: string): Promise<{ value: T; etag: string } | null>;
  /** Conditional write: returns false when the condition fails (concurrent write). */
  set(key: string, value: unknown, cond?: { onlyIfMatch?: string; onlyIfNew?: boolean }): Promise<boolean>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/** In-memory store for tests and local development only. */
export class MemoryKV implements KV {
  private map = new Map<string, { value: string; etag: string }>();
  private n = 0;
  async get<T>(key: string) {
    const e = this.map.get(key);
    return e ? { value: JSON.parse(e.value) as T, etag: e.etag } : null;
  }
  async set(key: string, value: unknown, cond: { onlyIfMatch?: string; onlyIfNew?: boolean } = {}) {
    const cur = this.map.get(key);
    if (cond.onlyIfNew && cur) return false;
    if (cond.onlyIfMatch !== undefined && cur?.etag !== cond.onlyIfMatch) return false;
    this.map.set(key, { value: JSON.stringify(value), etag: `e${++this.n}` });
    return true;
  }
  async delete(key: string) {
    this.map.delete(key);
  }
  async list(prefix: string) {
    return [...this.map.keys()].filter((k) => k.startsWith(prefix));
  }
}

/* ---------- Configuration ---------- */

export const COOKIE = '__Host-cms_session';
export const POLICY = {
  absoluteMs: 8 * 3600_000, // a session never lasts more than 8 hours
  idleMs: 2 * 3600_000, // nor survives 2 hours without activity
  touchMs: 5 * 60_000, // activity is recorded at most every 5 minutes
  perClient: { max: 5, windowMs: 15 * 60_000, baseLockMs: 15 * 60_000, maxLockMs: 24 * 3600_000 },
  global: { max: 30, windowMs: 3600_000, lockMs: 15 * 60_000 },
};
/** Weakest Argon2id parameters accepted (OWASP minimum). `npm run admin:setup` uses m=64 MiB, t=3. */
const MIN_ARGON = { m: 19456, t: 2 };

export interface AuthConfig {
  passwordHash: string;
  sessionSecret: Buffer;
}

/** Reads the configuration. Returns a reason (never a secret) when it is missing or unusable. */
export function parseAuthConfig(env: Record<string, string | undefined>): { config: AuthConfig } | { error: string } {
  const hash = env.ADMIN_PASSWORD_HASH?.trim();
  const secret = env.ADMIN_SESSION_SECRET?.trim();
  if (!hash || !secret) return { error: 'ADMIN_PASSWORD_HASH or ADMIN_SESSION_SECRET is missing' };
  const m = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$[A-Za-z0-9+/]{16,}\$[A-Za-z0-9+/]{32,}$/.exec(hash);
  if (!m) return { error: 'ADMIN_PASSWORD_HASH is not an Argon2id hash (run npm run admin:setup)' };
  if (Number(m[1]) < MIN_ARGON.m || Number(m[2]) < MIN_ARGON.t) return { error: 'ADMIN_PASSWORD_HASH uses parameters that are too weak' };
  if (!/^[A-Za-z0-9_-]{43,}$/.test(secret)) return { error: 'ADMIN_SESSION_SECRET must be at least 32 random bytes in base64url' };
  return { config: { passwordHash: hash, sessionSecret: Buffer.from(secret, 'base64url') } };
}

/* ---------- Helpers ---------- */

const b64 = (b: Buffer) => b.toString('base64url');
const sha256 = (s: string) => createHash('sha256').update(s).digest('base64url');
const sameBytes = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function readCookie(req: Request, name: string): string | null {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookie(value: string, maxAgeSeconds: number): string {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}
export const clearedCookie = () => sessionCookie('', 0);

/* ---------- CSRF ---------- */

/**
 * Sensitive requests must come from the site itself: same Origin (or one of the site's own Netlify URLs),
 * no cross-site fetch metadata, and the X-CMS-Request header (which a cross-site form cannot send and
 * which forces a CORS preflight that this API never grants). The cookie is also SameSite=Strict.
 */
export function checkSameOrigin(req: Request, extraOrigins: string[] = []) {
  const origin = req.headers.get('origin');
  const allowed = new Set([new URL(req.url).origin, ...extraOrigins.filter(Boolean).map((u) => new URL(u).origin)]);
  if (!origin || !allowed.has(origin)) throw new HttpError(403, 'bad_origin', 'Origine de la requête refusée.');
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') throw new HttpError(403, 'bad_origin', 'Origine de la requête refusée.');
  if (req.headers.get('x-cms-request') !== '1') throw new HttpError(403, 'bad_request', 'Requête refusée.');
}

/* ---------- Sessions and login ---------- */

interface SessionRecord {
  createdAt: number;
  lastSeen: number;
}
interface ClientLimit {
  count: number;
  windowStart: number;
  lockedUntil: number;
  locks: number;
  lastLockAt: number;
}
interface GlobalLimit {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

const GENERIC_LOGIN_ERROR = 'Connexion refusée. Vérifiez le mot de passe.';
const TOO_MANY = 'Trop de tentatives. Réessayez plus tard.';

export interface AdminAuthOptions {
  config: AuthConfig;
  kv: KV;
  now?: () => number;
  log?: (msg: string) => void;
}

export class AdminAuth {
  private key: Buffer;
  private now: () => number;
  private log: (msg: string) => void;
  constructor(private opts: AdminAuthOptions) {
    // Changing the password or the secret changes the key: all existing sessions become invalid.
    this.key = createHmac('sha256', opts.config.sessionSecret).update(`cms-session-v1|${opts.config.passwordHash}`).digest();
    this.now = opts.now ?? Date.now;
    this.log = opts.log ?? ((m) => console.error(m));
  }

  private sign(payload: string) {
    return b64(createHmac('sha256', this.key).update(payload).digest());
  }

  /** Records an attempt before checking the password, so parallel guesses are counted too. */
  private async reserveAttempt(clientId: string): Promise<boolean> {
    const now = this.now();
    const { perClient: pc, global: gl } = POLICY;
    const clientKey = `limit/client/${b64(createHmac('sha256', this.key).update(clientId).digest()).slice(0, 32)}`;

    // Read-modify-write with a conditional write, retried on conflict. Returns false to refuse the attempt.
    const bump = async <T extends { lockedUntil: number }>(key: string, update: (cur: T | null) => T): Promise<boolean> => {
      for (let i = 0; i < 4; i++) {
        const cur = await this.opts.kv.get<T>(key);
        if (cur && cur.value.lockedUntil > now) return false;
        const next = update(cur?.value ?? null);
        if (await this.opts.kv.set(key, next, cur ? { onlyIfMatch: cur.etag } : { onlyIfNew: true })) return next.lockedUntil <= now;
      }
      return false; // heavy contention: refuse rather than let attempts through uncounted
    };

    const globalOk = await bump<GlobalLimit>('limit/global', (cur) => {
      const g: GlobalLimit = cur && now - cur.windowStart < gl.windowMs ? { ...cur } : { count: 0, windowStart: now, lockedUntil: 0 };
      g.count++;
      if (g.count > gl.max) {
        g.lockedUntil = now + gl.lockMs;
        g.count = 0;
        g.windowStart = now;
        this.log('[auth] global login limit reached: logins paused');
      }
      return g;
    });
    if (!globalOk) return false;

    return bump<ClientLimit>(clientKey, (cur) => {
      const c: ClientLimit = cur ? { ...cur } : { count: 0, windowStart: now, lockedUntil: 0, locks: 0, lastLockAt: 0 };
      if (now - c.windowStart >= pc.windowMs) {
        c.count = 0;
        c.windowStart = now;
      }
      if (now - c.lastLockAt > pc.maxLockMs) c.locks = 0;
      c.count++;
      if (c.count > pc.max) {
        // Each new lock doubles: 15 min, 30 min, 1 h… up to 24 h.
        c.lockedUntil = now + Math.min(pc.baseLockMs * 2 ** c.locks, pc.maxLockMs);
        c.locks++;
        c.lastLockAt = now;
        c.count = 0;
        c.windowStart = now;
        this.log('[auth] login attempts limited for one client');
      }
      return c;
    });
  }

  private async clearClient(clientId: string) {
    await this.opts.kv.delete(`limit/client/${b64(createHmac('sha256', this.key).update(clientId).digest()).slice(0, 32)}`);
  }

  /** Checks the password and opens a session. Returns the Set-Cookie value. */
  async login(password: unknown, clientId: string): Promise<{ cookie: string; expiresAt: number }> {
    if (typeof password !== 'string' || password.length === 0 || password.length > 1024) {
      throw new HttpError(401, 'login_failed', GENERIC_LOGIN_ERROR);
    }
    if (!(await this.reserveAttempt(clientId))) throw new HttpError(429, 'too_many_attempts', TOO_MANY);
    let ok = false;
    try {
      ok = await argon2Verify({ password, hash: this.opts.config.passwordHash });
    } catch {
      ok = false;
    }
    if (!ok) throw new HttpError(401, 'login_failed', GENERIC_LOGIN_ERROR);
    await this.clearClient(clientId);

    const now = this.now();
    const sid = b64(randomBytes(32));
    const record: SessionRecord = { createdAt: now, lastSeen: now };
    await this.opts.kv.set(`session/${sha256(sid)}`, record);
    const payload = `v1.${sid}.${now}`;
    return { cookie: sessionCookie(`${payload}.${this.sign(payload)}`, Math.floor(POLICY.absoluteMs / 1000)), expiresAt: now + POLICY.absoluteMs };
  }

  /** Returns the session if the cookie is authentic, unexpired and not revoked; throws 401 otherwise. */
  async verify(req: Request): Promise<{ id: string; expiresAt: number }> {
    const fail = () => new HttpError(401, 'unauthenticated', 'Session absente ou expirée. Reconnectez-vous.');
    const raw = readCookie(req, COOKIE);
    const m = raw && /^v1\.([A-Za-z0-9_-]{43})\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(raw);
    if (!m) throw fail();
    const [, sid, iatRaw, sig] = m;
    if (!sameBytes(sig, this.sign(`v1.${sid}.${iatRaw}`))) throw fail();
    const now = this.now();
    const iat = Number(iatRaw);
    if (iat > now + 60_000 || now - iat > POLICY.absoluteMs) throw fail();
    const key = `session/${sha256(sid)}`;
    const rec = await this.opts.kv.get<SessionRecord>(key);
    if (!rec) throw fail(); // logged out or revoked
    if (now - rec.value.lastSeen > POLICY.idleMs) {
      await this.opts.kv.delete(key);
      throw fail();
    }
    if (now - rec.value.lastSeen > POLICY.touchMs) {
      await this.opts.kv.set(key, { ...rec.value, lastSeen: now }, { onlyIfMatch: rec.etag });
    }
    return { id: key, expiresAt: Math.min(iat + POLICY.absoluteMs, now + POLICY.idleMs) };
  }

  /** Ends the session carried by the request (if any). */
  async logout(req: Request) {
    try {
      const s = await this.verify(req);
      await this.opts.kv.delete(s.id);
    } catch {
      /* already invalid: nothing to revoke */
    }
  }

  /** Revokes every open session (all devices). */
  async logoutAll() {
    await Promise.all((await this.opts.kv.list('session/')).map((k) => this.opts.kv.delete(k)));
  }
}

// Administrator authentication: login, sessions, revocation, rate limiting, CSRF, configuration.
// Uses the real handler, real Argon2id hashing and an in-memory version of the shared store.
import { beforeEach, describe, expect, it } from 'vitest';
import { checkPassword, generateSecret, hashPassword } from '../../scripts/admin-setup.mjs';
import { createHandler } from '../../src/server/handler';
import { AdminAuth, COOKIE, type MemoryKV, POLICY, parseAuthConfig } from '../../src/server/session';
import { cookiePair, TEST_PASSWORD, TEST_SECRET, testAuth, testHash } from '../helpers/admin-auth';
import { testCms } from '../helpers/cms';

const ORIGIN = 'https://clementplancon.fr';
let now: number;
let kv: MemoryKV;
let auth: AdminAuth;
let gh: ReturnType<typeof testCms>;
let handle: ReturnType<typeof createHandler>;

const request = (method: string, path: string, opts: { body?: unknown; cookie?: string; headers?: Record<string, string>; ip?: string } = {}) =>
  handle(
    new Request(`${ORIGIN}/api/admin${path}`, {
      method,
      headers: {
        ...(opts.cookie ? { cookie: opts.cookie } : {}),
        ...(method !== 'GET' ? { origin: ORIGIN, 'x-cms-request': '1', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' } : {}),
        ...opts.headers,
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
    { ip: opts.ip ?? '203.0.113.7' },
  );
const login = async (password = TEST_PASSWORD, ip?: string) => {
  const res = await request('POST', '/auth/login', { body: { password }, ip });
  return { res, cookie: cookiePair(res.headers.get('set-cookie')) };
};

beforeEach(async () => {
  now = Date.UTC(2026, 10, 17, 10);
  ({ kv, auth } = await testAuth({ now: () => now }));
  gh = testCms();
  handle = createHandler({ cms: gh.cms, auth, log: () => {} });
});

describe('login', () => {
  it('1. correct password: opens a session in a protected cookie', async () => {
    const { res, cookie } = await login();
    expect(res.status).toBe(200);
    const set = res.headers.get('set-cookie')!;
    expect(set).toMatch(new RegExp(`^${COOKIE}=v1\\.`));
    for (const attr of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', `Max-Age=${POLICY.absoluteMs / 1000}`]) expect(set).toContain(attr);
    expect(set).not.toMatch(/Domain=/i);
    expect(res.headers.get('cache-control')).toBe('no-store');
    // Nothing secret in the body: the token only travels in the HttpOnly cookie.
    const body = await res.json();
    expect(Object.keys(body)).toEqual(['expiresAt']);
    expect((await request('GET', '/session', { cookie })).status).toBe(200);
  });

  it('2. wrong password: generic 401, no cookie', async () => {
    const { res } = await login('correct horse battery stapler');
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
    const body = await res.json();
    expect(body.error.message).toBe('Connexion refusée. Vérifiez le mot de passe.');
    for (const bad of [{}, { password: '' }, { password: 123 }, { password: 'x'.repeat(2000) }]) {
      const r = await request('POST', '/auth/login', { body: bad });
      expect(r.status, JSON.stringify(bad).slice(0, 30)).toBe(401);
    }
  });

  it('8. repeated attempts: the client is locked out, even with the right password, and the lock doubles', async () => {
    for (let i = 0; i < POLICY.perClient.max; i++) expect((await login('mauvais mot de passe')).res.status).toBe(401);
    const locked = await login();
    expect(locked.res.status).toBe(429);
    expect((await locked.res.json()).error.message).toBe('Trop de tentatives. Réessayez plus tard.');
    // Another client is not affected.
    expect((await login(TEST_PASSWORD, '198.51.100.1')).res.status).toBe(200);
    // After the lock, attempts resume; a second lock lasts twice as long.
    now += POLICY.perClient.baseLockMs + 1;
    for (let i = 0; i < POLICY.perClient.max; i++) await login('mauvais mot de passe');
    expect((await login()).res.status).toBe(429);
    now += POLICY.perClient.baseLockMs + 1;
    expect((await login()).res.status).toBe(429);
    now += POLICY.perClient.baseLockMs;
    expect((await login()).res.status).toBe(200);
  });

  it('8. counts parallel guesses: a burst cannot get more than the allowed attempts checked', async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => login('mauvais mot de passe')));
    const checked = results.filter((r) => r.res.status === 401).length;
    expect(checked).toBeLessThanOrEqual(POLICY.perClient.max);
    expect(results.filter((r) => r.res.status === 429).length).toBeGreaterThanOrEqual(20 - POLICY.perClient.max);
  });

  it('8. limits attempts from many addresses (distributed guessing) globally', async () => {
    for (let i = 0; i < POLICY.global.max; i++) await login('mauvais', `10.0.0.${i}`);
    expect((await login(TEST_PASSWORD, '10.0.1.1')).res.status).toBe(429);
    now += POLICY.global.lockMs + 1;
    expect((await login(TEST_PASSWORD, '10.0.1.1')).res.status).toBe(200);
  });

  it('a successful login clears the client counter', async () => {
    for (let i = 0; i < POLICY.perClient.max - 1; i++) await login('mauvais');
    expect((await login()).res.status).toBe(200);
    for (let i = 0; i < POLICY.perClient.max - 1; i++) await login('mauvais');
    expect((await login()).res.status).toBe(200);
  });
});

describe('sessions', () => {
  it('3. every API route refuses requests without a session (401)', async () => {
    for (const [m, p] of [
      ['GET', '/session'],
      ['GET', '/content'],
      ['GET', '/status'],
      ['GET', '/media/file?ref=x.webp'],
      ['POST', '/save'],
      ['POST', '/media'],
      ['POST', '/media/delete'],
      ['POST', '/publish'],
      ['POST', '/discard'],
      ['POST', '/auth/logout-all'],
    ]) {
      expect((await request(m, p, { body: m === 'POST' ? {} : undefined })).status, `${m} ${p}`).toBe(401);
    }
  });

  it('4. a forged or altered cookie is refused', async () => {
    const { cookie } = await login();
    const value = cookie.slice(COOKIE.length + 1);
    const [v, sid, iat, sig] = value.split('.');
    const forged = [
      `${v}.${sid}.${iat}.${'A'.repeat(43)}`, // wrong signature
      `${v}.${sid}.${Number(iat) + 3_600_000}.${sig}`, // extended date, old signature
      `${v}.${`${sid[0] === 'B' ? 'C' : 'B'}${sid.slice(1)}`}.${iat}.${sig}`, // other session id
      'admin=true',
      '',
    ];
    for (const f of forged) {
      const r = await request('GET', '/content', { cookie: `${COOKIE}=${f}` });
      expect(r.status, f).toBe(401);
    }
    // A cookie signed with another secret (another site, an old secret) is refused too.
    const other = await testAuth({ kv, secret: generateSecret(), now: () => now });
    const s2 = await other.auth.login(TEST_PASSWORD, 'x');
    expect((await request('GET', '/content', { cookie: cookiePair(s2.cookie) })).status).toBe(401);
  });

  it('5. sessions expire: after 2 hours idle, and after 8 hours in any case', async () => {
    let { cookie } = await login();
    now += POLICY.idleMs + 1;
    expect((await request('GET', '/session', { cookie })).status).toBe(401);

    ({ cookie } = await login());
    const start = now;
    // Active every hour: still valid until the 8-hour limit…
    while (now + POLICY.idleMs / 2 < start + POLICY.absoluteMs) {
      now += POLICY.idleMs / 2;
      expect((await request('GET', '/session', { cookie })).status).toBe(200);
    }
    // …then refused, although the last activity is recent.
    now = start + POLICY.absoluteMs + 1;
    const r = await request('GET', '/session', { cookie });
    expect(r.status).toBe(401);
    expect(r.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('6. logout revokes the session on the server, not just in the browser', async () => {
    const { cookie } = await login();
    const out = await request('POST', '/auth/logout', { cookie, body: {} });
    expect(out.status).toBe(200);
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0');
    // The same cookie, replayed (copied before logout), no longer works.
    expect((await request('GET', '/content', { cookie })).status).toBe(401);
    expect(await kv.list('session/')).toEqual([]);
  });

  it('7. revocation: "close every session" ends all of them', async () => {
    const a = await login();
    const b = await login();
    expect((await request('POST', '/auth/logout-all', { cookie: a.cookie, body: {} })).status).toBe(200);
    expect((await request('GET', '/session', { cookie: a.cookie })).status).toBe(401);
    expect((await request('GET', '/session', { cookie: b.cookie })).status).toBe(401);
  });

  it('7. rotation: a new session secret or a new password invalidates existing sessions', async () => {
    const { cookie } = await login();
    const rotatedSecret = createHandler({ cms: gh.cms, auth: (await testAuth({ kv, secret: generateSecret() })).auth, log: () => {} });
    expect((await rotatedSecret(new Request(`${ORIGIN}/api/admin/session`, { headers: { cookie } }))).status).toBe(401);
    const parsed = parseAuthConfig({ ADMIN_PASSWORD_HASH: await testHash('un tout autre mot de passe'), ADMIN_SESSION_SECRET: TEST_SECRET });
    if ('error' in parsed) throw new Error(parsed.error);
    const newPassword = createHandler({ cms: gh.cms, auth: new AdminAuth({ config: parsed.config, kv, log: () => {} }), log: () => {} });
    expect((await newPassword(new Request(`${ORIGIN}/api/admin/session`, { headers: { cookie } }))).status).toBe(401);
  });
});

describe('CSRF', () => {
  it('9. refuses cross-site requests, with or without a session', async () => {
    const { cookie } = await login();
    const attempts: Record<string, string>[] = [
      { origin: 'https://evil.example' },
      { origin: 'null' },
      { 'sec-fetch-site': 'cross-site' },
      { 'sec-fetch-site': 'same-site', origin: ORIGIN },
      { 'x-cms-request': '' },
    ];
    for (const headers of attempts) {
      for (const path of ['/discard', '/publish', '/auth/login', '/auth/logout', '/auth/logout-all']) {
        const r = await request('POST', path, { cookie, headers, body: path === '/auth/login' ? { password: TEST_PASSWORD } : {} });
        expect(r.status, `${path} ${JSON.stringify(headers)}`).toBe(403);
      }
    }
    // Without an Origin header at all.
    const noOrigin = await handle(new Request(`${ORIGIN}/api/admin/discard`, { method: 'POST', headers: { cookie, 'x-cms-request': '1' }, body: '{}' }));
    expect(noOrigin.status).toBe(403);
    // The session is still valid: nothing was done.
    expect((await request('GET', '/session', { cookie })).status).toBe(200);
  });

  it("accepts the site's own Netlify addresses as origins", async () => {
    handle = createHandler({ cms: gh.cms, auth, siteOrigins: ['https://main--site.netlify.app'], log: () => {} });
    const r = await request('POST', '/auth/login', { body: { password: TEST_PASSWORD }, headers: { origin: 'https://main--site.netlify.app' } });
    expect(r.status).toBe(200);
  });
});

describe('content after login', () => {
  it('10. saves a draft and publishes it', async () => {
    const { cookie } = await login();
    const content = await (await request('GET', '/content', { cookie })).json();
    const p = content.collections.project.find((x: { id: string }) => x.id === 'safeping');
    const saved = await request('POST', '/save', {
      cookie,
      body: { message: 'Résumé SafePing', changes: [{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: 'Résumé modifié.' }, baseSha: p.sha }] },
    });
    expect(saved.status).toBe(200);
    expect(await gh.read('draft', 'src/content/projects/safeping.json')).toContain('Résumé modifié.');
    expect(await gh.read('published', 'src/content/projects/safeping.json')).not.toContain('Résumé modifié.');
    expect((await request('POST', '/publish', { cookie, body: {} })).status).toBe(200);
    expect(await gh.read('published', 'src/content/projects/safeping.json')).toContain('Résumé modifié.');
  });
});

describe('configuration', () => {
  it('11. without valid secrets, everything is refused (503), login included', async () => {
    handle = createHandler({ cms: gh.cms, auth: null, log: () => {} });
    expect((await request('POST', '/auth/login', { body: { password: TEST_PASSWORD } })).status).toBe(503);
    expect((await request('GET', '/session')).status).toBe(503);
    expect((await request('GET', '/content')).status).toBe(503);
  });

  it('11. rejects missing, malformed or weak values', async () => {
    const hash = await testHash();
    const cases: Record<string, string | undefined>[] = [
      {},
      { ADMIN_PASSWORD_HASH: hash },
      { ADMIN_SESSION_SECRET: TEST_SECRET },
      { ADMIN_PASSWORD_HASH: TEST_PASSWORD, ADMIN_SESSION_SECRET: TEST_SECRET }, // a password, not a hash
      { ADMIN_PASSWORD_HASH: hash.replace('argon2id', 'argon2i'), ADMIN_SESSION_SECRET: TEST_SECRET },
      { ADMIN_PASSWORD_HASH: hash.replace('m=19456,t=2', 'm=1024,t=1'), ADMIN_SESSION_SECRET: TEST_SECRET },
      { ADMIN_PASSWORD_HASH: hash, ADMIN_SESSION_SECRET: 'trop-court' },
    ];
    for (const env of cases) {
      const r = parseAuthConfig(env);
      expect('error' in r, JSON.stringify(Object.keys(env))).toBe(true);
      // The reason never contains the values themselves.
      if ('error' in r) for (const v of Object.values(env)) if (v) expect(r.error).not.toContain(v);
    }
    expect('config' in parseAuthConfig({ ADMIN_PASSWORD_HASH: ` ${hash}\n`, ADMIN_SESSION_SECRET: TEST_SECRET })).toBe(true);
  });
});

describe('npm run admin:setup', () => {
  it('produces values the server accepts, with strong Argon2id parameters', async () => {
    const hash = await hashPassword('Le chat de Bercy mange 3 pommes!');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    const secret = generateSecret();
    expect(Buffer.from(secret, 'base64url')).toHaveLength(32);
    const r = parseAuthConfig({ ADMIN_PASSWORD_HASH: hash, ADMIN_SESSION_SECRET: secret });
    if ('error' in r) throw new Error(r.error);
    const a = new AdminAuth({ config: r.config, kv, log: () => {} });
    await expect(a.login('Le chat de Bercy mange 3 pommes!', 'x')).resolves.toHaveProperty('cookie');
    // Two hashes of the same password differ (random salt).
    expect(await hashPassword('Le chat de Bercy mange 3 pommes!')).not.toBe(hash);
  });

  it('refuses weak passwords', () => {
    for (const weak of ['Clement2024!', 'motdepasse-clement-1234', 'azertyuiopqsdf', 'aaaaaaaaaaaaaaaaaa', 'Portfolio2026!!']) {
      expect(checkPassword(weak), weak).not.toEqual([]);
    }
    for (const ok of ['correct horse battery staple', 'tR7#kq9!Lm2@xZ', 'Le chat de Bercy mange 3 pommes!']) expect(checkPassword(ok), ok).toEqual([]);
  });
});

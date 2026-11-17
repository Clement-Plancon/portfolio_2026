// Real authentication for tests: an Argon2id hash of a known password and an in-memory shared store.
// Cheaper Argon2id parameters (the minimum the server accepts) keep the suites fast.
import { randomBytes } from 'node:crypto';
import { argon2id } from 'hash-wasm';
import { AdminAuth, type AuthConfig, MemoryKV, parseAuthConfig } from '../../src/server/session';

export const TEST_PASSWORD = 'correct horse battery staple';
export const TEST_SECRET = randomBytes(32).toString('base64url');

let cached: string | null = null;
export async function testHash(password = TEST_PASSWORD) {
  if (password === TEST_PASSWORD && cached) return cached;
  const h = await argon2id({ password, salt: randomBytes(16), memorySize: 19456, iterations: 2, parallelism: 1, hashLength: 32, outputType: 'encoded' });
  if (password === TEST_PASSWORD) cached = h;
  return h;
}

export async function testConfig(password = TEST_PASSWORD, secret = TEST_SECRET): Promise<AuthConfig> {
  const r = parseAuthConfig({ ADMIN_PASSWORD_HASH: await testHash(password), ADMIN_SESSION_SECRET: secret });
  if ('error' in r) throw new Error(r.error);
  return r.config;
}

export async function testAuth(opts: { kv?: MemoryKV; now?: () => number; secret?: string } = {}) {
  const kv = opts.kv ?? new MemoryKV();
  return { kv, auth: new AdminAuth({ config: await testConfig(TEST_PASSWORD, opts.secret), kv, now: opts.now, log: () => {} }) };
}

/** "name=value" from a Set-Cookie header. */
export const cookiePair = (setCookie: string | null) => setCookie?.split(';')[0] ?? '';

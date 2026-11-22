// Incident of 22 November 2026: every Blobs operation of the admin failed with BlobsInternalError after the
// function had been running for hours. These tests run the REAL @netlify/blobs SDK against a stand-in of
// the Blobs edge (tests/helpers/fake-blobs.ts) that, like Netlify, hands each invocation a context with
// its own token. They cover: function instances reused across many invocations (the cause found), long
// running sessions, outages and recovery, refused credentials, missing configuration, conditional writes,
// writes that are never reported as done without confirmation, and logs without secrets.
import { getStore } from '@netlify/blobs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStore, netlifyDocStore, netlifyFileStore } from '../../src/server/blob-store';
import { ContentStore, MEDIA_GRACE_MS } from '../../src/server/content-store';
import { createHandler, STORAGE_MESSAGE } from '../../src/server/handler';
import { AdminAuth, POLICY } from '../../src/server/session';
import { correlationId, redact, StorageError } from '../../src/server/storage-error';
import { cookiePair, TEST_PASSWORD, testConfig } from '../helpers/admin-auth';
import { FakeBlobsEdge } from '../helpers/fake-blobs';

const ORIGIN = 'https://clementplancon.fr';
let edge: FakeBlobsEdge;
let logs: string[];

beforeEach(() => {
  edge = new FakeBlobsEdge();
  logs = [];
  vi.stubGlobal('fetch', edge.fetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
  edge.clearContext();
});

/**
 * One function instance, built ONCE like src/server/runtime.ts does (module-level cache), then called
 * for many invocations. `invoke()` gives each request a fresh Blobs context, as Netlify does.
 */
async function instance(now: () => number = Date.now) {
  edge.invoke();
  const cms = new ContentStore({ docs: netlifyDocStore('cms'), files: netlifyFileStore('cms-media'), log: (m) => logs.push(m) });
  const auth = new AdminAuth({ config: await testConfig(), kv: netlifyDocStore('admin-auth'), now, log: (m) => logs.push(m) });
  const handle = createHandler({ cms, auth, log: (m) => logs.push(m) });
  let cookie = '';
  const call = async (method: string, path: string, body?: unknown, { fresh = true, headers = {} as Record<string, string> } = {}) => {
    if (fresh) edge.invoke();
    const mutation = method !== 'GET';
    const res = await handle(
      new Request(`${ORIGIN}/api/admin${path}`, {
        method,
        headers: { cookie, ...(mutation ? { origin: ORIGIN, 'x-cms-request': '1', 'content-type': 'application/json' } : {}), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    const json = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
    return { status: res.status, body: json, res };
  };
  const login = async () => {
    const r = await call('POST', '/auth/login', { password: TEST_PASSWORD });
    expect(r.status).toBe(200);
    cookie = cookiePair(r.res.headers.get('set-cookie'));
  };
  return { cms, auth, call, login, setCookie: (c: string) => (cookie = c) };
}

const editSummary = async (call: Awaited<ReturnType<typeof instance>>['call'], summary: string) => {
  const c = await call('GET', '/content');
  const p = c.body.collections.project.find((e: { id: string }) => e.id === 'bercy-vert');
  return call('POST', '/save', { message: 'test', changes: [{ op: 'put', type: 'project', id: 'bercy-vert', data: { ...p.data, summary }, baseSha: p.sha }] });
};

describe('the cause: a Blobs client kept between invocations', () => {
  it('reproduces the incident: a store opened once keeps the token of its first invocation', async () => {
    edge.invoke();
    const store = getStore({ name: 'cms', consistency: 'strong' }); // what runtime.ts used to cache, through ContentStore
    await store.setJSON('k', { a: 1 });
    edge.invoke(); // a later invocation: Netlify gives a new token, the old one no longer works
    const err = await store.get('k', { type: 'json' }).catch((e) => e);
    expect(err.name).toBe('BlobsInternalError');
    expect(err.status).toBe(401);
    // and the error the admin received was a bare 500 « BlobsInternalError »
  });

  it('the stores used by the server open the store again for every operation, with the current context', async () => {
    edge.invoke();
    const docs = netlifyDocStore('cms'); // created once, as in runtime.ts
    for (let i = 0; i < 25; i++) {
      edge.invoke(); // every previous token expires
      expect(await docs.set(`k${i}`, { i })).toBe(true);
      expect((await docs.get<{ i: number }>(`k${i}`))?.value.i).toBe(i);
    }
    // each request carried the token of its own invocation
    const tokens = new Set(edge.requests.map((r) => r.token));
    expect(tokens.size).toBeGreaterThanOrEqual(25);
  });

  it('a whole admin instance (content, sessions) stays usable across many invocations', async () => {
    const { call, login } = await instance();
    await login();
    for (let i = 0; i < 12; i++) {
      expect((await call('GET', '/session')).status).toBe(200);
      expect((await call('GET', '/status')).status).toBe(200);
      expect((await editSummary(call, `Résumé ${i}`)).status).toBe(200);
    }
    expect((await call('POST', '/publish')).status).toBe(200);
    expect(edge.json<{ entries: Record<string, { summary: string }> }>('cms', 'published')?.entries['src/content/projects/bercy-vert.json'].summary).toBe('Résumé 11');
  });
});

describe('long running instance', () => {
  it('works for a whole working day (requests every 4 minutes, a new token each time), then the session ends normally', async () => {
    let t = Date.parse('2026-11-21T21:01:00Z');
    const { call, login } = await instance(() => t);
    await login();
    const start = t;
    let lastOk = 0;
    // 7 h 56 of activity: below the absolute limit of the session (8 h)
    while (t - start + 4 * 60_000 < POLICY.absoluteMs) {
      t += 4 * 60_000;
      const r = await call('GET', '/session');
      expect(r.status).toBe(200);
      lastOk = t;
    }
    expect(lastOk - start).toBeGreaterThan(7.5 * 3600_000);
    expect((await editSummary(call, 'Après huit heures')).status).toBe(200);
    // the 8-hour limit then applies as designed: a 401, not a storage error
    t = start + POLICY.absoluteMs + 1;
    expect((await call('GET', '/session')).status).toBe(401);
    expect(logs.filter((l) => l.includes('storage_error'))).toEqual([]);
  });
});

describe('storage outage', () => {
  it('a save during an outage is refused with a 503 the admin can act on, nothing is changed, and it works again after', async () => {
    const { call, login } = await instance();
    await login();
    const before = edge.json('cms', 'draft');
    edge.failWith = 503;
    const read = await call('GET', '/content');
    expect(read.status).toBe(503);
    const s = await call('POST', '/save', { message: 'x', changes: [{ op: 'put', type: 'project', id: 'bercy-vert', data: {}, baseSha: 'x' }] });
    expect(s.status).toBe(503);
    expect(s.body.error.code).toBe('storage_unavailable');
    expect(s.body.error.message).toContain(STORAGE_MESSAGE);
    expect(s.body.error.ref).toMatch(/^[A-Z0-9]{10,}$/);
    expect(s.res.headers.get('x-request-ref')).toBe(s.body.error.ref);
    expect(s.res.headers.get('set-cookie')).toBeNull(); // the session is kept
    edge.failWith = null;
    expect(edge.json('cms', 'draft')).toEqual(before);
    expect((await editSummary(call, 'après la panne')).status).toBe(200);
  });

  it('a short outage is absorbed by the retries of the SDK', async () => {
    const { call, login } = await instance();
    await login();
    edge.failNext = 2;
    expect((await call('GET', '/status')).status).toBe(200);
  });

  it('refused credentials give a 503, never « session expirée » nor « mot de passe incorrect », and keep the session', async () => {
    const { call, login } = await instance();
    await login();
    edge.failWith = 401;
    const s = await call('GET', '/session');
    expect(s.status).toBe(503);
    expect(s.body.error.code).toBe('storage_unavailable');
    expect(s.res.headers.get('set-cookie')).toBeNull();
    const l = await call('POST', '/auth/login', { password: TEST_PASSWORD });
    expect(l.status).toBe(503);
    expect(l.res.headers.get('set-cookie')).toBeNull();
    edge.failWith = null;
    expect((await call('GET', '/session')).status).toBe(200);
  });

  it('a missing Blobs configuration is a 503 too, logged as a configuration problem', async () => {
    const { call, login } = await instance();
    await login();
    edge.clearContext();
    const s = await call('GET', '/status', undefined, { fresh: false });
    expect(s.status).toBe(503);
    expect(logs.join('\n')).toContain('"kind":"config"');
  });

  it('logs the error type, the status, the operation and a correlation id, without any token', async () => {
    const { call, login } = await instance();
    await login();
    edge.failWith = 401;
    const s = await call('GET', '/status', undefined, { headers: { 'x-nf-request-id': '01M80CSB4KPCDXCJK9TBM6WYKZ' } });
    expect(s.body.error.ref).toBe('01M80CSB4KPCDXCJK9TBM6WYKZ'); // Netlify's id, to find the request in its logs
    const line = logs.find((l) => l.includes('storage_error'))!;
    const fields = JSON.parse(line.slice(line.indexOf('{')));
    expect(fields).toMatchObject({ event: 'storage_error', ref: '01M80CSB4KPCDXCJK9TBM6WYKZ', route: 'GET /status', kind: 'auth', type: 'BlobsInternalError', status: 401, store: 'admin-auth' });
    expect(fields.blobsRequestId).toMatch(/^01FAKE/);
    for (const t of edge.valid) expect(line).not.toContain(t);
    expect(line).not.toMatch(/tok\d+-x{20}/);
  });
});

describe('writes are confirmed', () => {
  it('two instances saving the same entry: one wins, the other gets a conflict, nothing is lost silently', async () => {
    const a = await instance();
    const b = await instance();
    await a.login();
    await b.login();
    const ca = await a.call('GET', '/content');
    const cb = await b.call('GET', '/content');
    const pa = ca.body.collections.project.find((e: { id: string }) => e.id === 'bercy-vert');
    const pb = cb.body.collections.project.find((e: { id: string }) => e.id === 'bercy-vert');
    const save = (x: typeof a, p: typeof pa, summary: string) => x.call('POST', '/save', { message: 'x', changes: [{ op: 'put', type: 'project', id: 'bercy-vert', data: { ...p.data, summary }, baseSha: p.sha }] });
    const r1 = await save(a, pa, 'A');
    const r2 = await save(b, pb, 'B');
    expect([r1.status, r2.status]).toEqual([200, 409]);
    expect(edge.json<{ entries: Record<string, { summary: string }> }>('cms', 'draft')?.entries['src/content/projects/bercy-vert.json'].summary).toBe('A');
  });

  it('a conditional write without a known version is refused, never turned into an overwrite', async () => {
    edge.invoke();
    const docs = netlifyDocStore('cms');
    await docs.set('k', { v: 1 });
    expect(await docs.set('k', { v: 2 }, { onlyIfMatch: '' })).toBe(false);
    expect(await docs.set('k', { v: 2 }, { onlyIfMatch: '"stale"' })).toBe(false);
    expect((await docs.get<{ v: number }>('k'))?.value.v).toBe(1);
  });

  it('a session is only handed out once it is stored', async () => {
    const kv = new MemoryStore();
    const set = kv.set.bind(kv);
    kv.set = async (key, value, cond) => (key.startsWith('session/') ? false : set(key, value, cond)); // the session write is not confirmed
    const auth = new AdminAuth({ config: await testConfig(), kv, log: () => {} });
    const err = await auth.login(TEST_PASSWORD, 'ip').catch((e) => e);
    expect(err).toBeInstanceOf(StorageError);
  });

  it('a publication whose copy of the previous version is not confirmed does not happen', async () => {
    const docs = new MemoryStore();
    const files = new MemoryStore();
    const cms = new ContentStore({ docs, files, log: () => {} });
    const p = await cms.readAll();
    const proj = p.collections.project[0] as { id: string; sha: string; data: Record<string, unknown> };
    await cms.save([{ op: 'put', type: 'project', id: proj.id, data: { ...proj.data, summary: 'nouveau' }, baseSha: proj.sha }]);
    const before = (await docs.get('published'))!.etag;
    const set = docs.set.bind(docs);
    docs.set = async (key, value, cond) => (key.startsWith('history/') ? false : set(key, value, cond));
    await expect(cms.publish()).rejects.toBeInstanceOf(StorageError);
    expect((await docs.get('published'))!.etag).toBe(before);
  });

  it('a logout that the storage cannot confirm is reported as such (the browser forgets the cookie anyway)', async () => {
    const { call, login } = await instance();
    await login();
    edge.failWith = 503;
    const r = await call('POST', '/auth/logout');
    expect(r.status).toBe(503);
    expect(r.res.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});

describe('media clean-up', () => {
  it('never removes a recent file, even unreferenced (an upload may be in progress in another tab)', async () => {
    const docs = new MemoryStore();
    const files = new MemoryStore();
    let t = Date.now();
    files.clock = () => t;
    const cms = new ContentStore({ docs, files, log: () => {} });
    await cms.readAll();
    await files.putFile('a'.repeat(64), new Uint8Array([1]), 'image/webp'); // unreferenced, just written
    t -= 2 * MEDIA_GRACE_MS;
    await files.putFile('b'.repeat(64), new Uint8Array([2]), 'image/webp'); // unreferenced, old
    const p = await cms.readAll();
    const proj = p.collections.project[0] as { id: string; sha: string; data: Record<string, unknown> };
    await cms.save([{ op: 'put', type: 'project', id: proj.id, data: { ...proj.data, summary: 'x' }, baseSha: proj.sha }]);
    await cms.publish(); // runs the clean-up
    expect(await files.getFile('a'.repeat(64))).not.toBeNull();
    expect(await files.getFile('b'.repeat(64))).toBeNull();
  });
});

describe('redaction and correlation', () => {
  it('removes tokens, JWTs, signed URLs, hashes and long secrets from technical messages', () => {
    const m = redact(
      'GET https://uncached.blobs.test/site/site:cms/draft?signature=abc123&exp=1 failed: Bearer tok1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl $argon2id$v=19$m=19456,t=2,p=1$abc$def secret-value-123',
      ['secret-value-123'],
    );
    expect(m).not.toContain('signature=');
    expect(m).not.toContain('tok1-x');
    expect(m).not.toContain('eyJ');
    expect(m).not.toContain('argon2id$v');
    expect(m).not.toContain('secret-value-123');
    expect(m).toContain('https://uncached.blobs.test/site/site:cms/draft');
  });
  it('keeps what helps: status codes and Netlify request ids', () => {
    const e = new StorageError('get', 'cms', { name: 'BlobsInternalError', status: 401, message: 'Netlify Blobs has generated an internal error (401 status code, ID: 01M80CRZF56VSFQ422V069XV4W)' });
    expect(e).toMatchObject({ kind: 'auth', status: 401, causeName: 'BlobsInternalError', blobsRequestId: '01M80CRZF56VSFQ422V069XV4W' });
    expect(new StorageError('get', 'cms', { name: 'BlobsInternalError', status: 502, message: '' }).kind).toBe('unavailable');
    expect(new StorageError('get', 'cms', { name: 'MissingBlobsEnvironmentError', message: '' }).kind).toBe('config');
    expect(new StorageError('get', 'cms', new TypeError('fetch failed')).kind).toBe('unavailable');
  });
  it('uses Netlify’s request id when there is one, else a random id', () => {
    expect(correlationId(new Request('https://x.test', { headers: { 'x-nf-request-id': '01M80CSB4KPCDXCJK9TBM6WYKZ' } }))).toBe('01M80CSB4KPCDXCJK9TBM6WYKZ');
    expect(correlationId(new Request('https://x.test', { headers: { 'x-nf-request-id': '<script>' } }))).toMatch(/^[A-Z0-9]{20}$/);
    expect(correlationId()).not.toBe(correlationId());
  });
});

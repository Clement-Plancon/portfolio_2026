// A stand-in for the Netlify Blobs edge, speaking the HTTP protocol the real @netlify/blobs SDK uses
// (paths /<site>/<store>/<key>, ETag, If-Match / If-None-Match, metadata header, listings). Like Netlify,
// it gives each invocation of the function a context with its own token, and it can expire tokens,
// fail like an outage (5xx), or refuse credentials (401): the server code runs unchanged against it.
import { Buffer } from 'node:buffer';

type Blob_ = { body: Uint8Array; etag: string; meta: string | null };

export class FakeBlobsEdge {
  readonly siteID = 'site-test';
  /** Tokens currently accepted. */
  readonly valid = new Set<string>();
  /** Every request received, with the token it carried. */
  readonly requests: { method: string; path: string; token: string }[] = [];
  /** When set, every request gets this status (an outage: 503, a refusal: 401…). */
  failWith: number | null = null;
  /** Fail only the next N requests (then recover by itself). */
  failNext = 0;
  private stores = new Map<string, Map<string, Blob_>>();
  private n = 0;
  private tokens = 0;

  /**
   * A new invocation of the function: Netlify sets a fresh Blobs context with a new token. By default the
   * previous tokens stop working, as an expired token would.
   */
  invoke({ expirePrevious = true } = {}): string {
    const token = `tok${++this.tokens}-${'x'.repeat(48)}`;
    if (expirePrevious) this.valid.clear();
    this.valid.add(token);
    const ctx = { siteID: this.siteID, token, edgeURL: 'https://edge.blobs.test', uncachedEdgeURL: 'https://uncached.blobs.test', deployID: 'deploy-test' };
    (globalThis as { netlifyBlobsContext?: string }).netlifyBlobsContext = Buffer.from(JSON.stringify(ctx)).toString('base64');
    return token;
  }

  /** No Blobs context at all (a misconfigured environment). */
  clearContext() {
    delete (globalThis as { netlifyBlobsContext?: string }).netlifyBlobsContext;
    delete process.env.NETLIFY_BLOBS_CONTEXT;
  }

  keys(store: string) {
    return [...(this.stores.get(`site:${store}`)?.keys() ?? [])].sort();
  }
  json<T>(store: string, key: string): T | undefined {
    const b = this.stores.get(`site:${store}`)?.get(key);
    return b ? (JSON.parse(Buffer.from(b.body).toString('utf8')) as T) : undefined;
  }

  fetch = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    const token = (headers.get('authorization') ?? '').replace(/^Bearer /, '');
    this.requests.push({ method, path: url.pathname, token });
    const nf = { 'x-nf-request-id': `01FAKE${String(this.requests.length).padStart(20, '0')}` };

    if (this.failNext > 0) {
      this.failNext--;
      return new Response('upstream error', { status: 503, headers: nf });
    }
    if (this.failWith) return new Response(this.failWith === 401 ? 'unauthorized' : 'error', { status: this.failWith, headers: nf });
    if (!this.valid.has(token)) return new Response('token expired', { status: 401, headers: nf });

    const [, site, store, ...rest] = decodeURIComponent(url.pathname).split('/');
    if (site !== this.siteID || !store) return new Response('not found', { status: 404, headers: nf });
    const key = rest.join('/');
    const bucket = this.stores.get(store) ?? new Map<string, Blob_>();
    this.stores.set(store, bucket);

    if (!key) {
      // listing
      const prefix = url.searchParams.get('prefix') ?? '';
      const blobs = [...bucket.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, b]) => ({ key: k, etag: b.etag, size: b.body.length, last_modified: new Date().toISOString() }));
      return Response.json({ blobs, directories: [] }, { headers: nf });
    }
    const cur = bucket.get(key);
    const metaOut = (b: Blob_): Record<string, string> => (b.meta ? { 'x-amz-meta-user': b.meta } : {});
    if (method === 'GET' || method === 'HEAD') {
      if (!cur) return new Response(null, { status: 404, headers: nf });
      return new Response(method === 'HEAD' ? null : (cur.body as BodyInit), { status: 200, headers: { ...nf, etag: cur.etag, ...metaOut(cur) } });
    }
    if (method === 'DELETE') {
      bucket.delete(key);
      return new Response(null, { status: 204, headers: nf });
    }
    if (method === 'PUT') {
      const ifMatch = headers.get('if-match');
      const ifNone = headers.get('if-none-match');
      if ((ifMatch && cur?.etag !== ifMatch) || (ifNone === '*' && cur)) return new Response('precondition failed', { status: 412, headers: nf });
      const body = init.body instanceof Blob ? new Uint8Array(await init.body.arrayBuffer()) : new Uint8Array(Buffer.from(String(init.body ?? '')));
      const b = { body, etag: `"v${++this.n}"`, meta: headers.get('x-amz-meta-user') };
      bucket.set(key, b);
      return new Response(null, { status: 200, headers: { ...nf, etag: b.etag } });
    }
    return new Response('method', { status: 405, headers: nf });
  };
}

// A small storage interface over Netlify Blobs, with an in-memory version for tests.
// JSON documents carry an ETag so writes can be conditional (no lost update between instances).
import { getStore } from '@netlify/blobs';
import { StorageError } from './storage-error';

export type WriteCondition = { onlyIfMatch?: string; onlyIfNew?: boolean };

export interface DocStore {
  get<T>(key: string): Promise<{ value: T; etag: string } | null>;
  /** Returns false when the condition fails (another write happened first). */
  set(key: string, value: unknown, cond?: WriteCondition): Promise<boolean>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export interface FileStore {
  getFile(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;
  /** Writes a file only if the key is new (keys are content hashes: same key, same bytes). */
  putFile(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  /** When a file was written (ms), if known: files written before this field existed return null. */
  uploadedAt(key: string): Promise<number | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/* ---------- In memory (tests, local scripts) ---------- */

export class MemoryStore implements DocStore, FileStore {
  private docs = new Map<string, { value: string; etag: string }>();
  private files = new Map<string, { bytes: Uint8Array; contentType: string; at: number }>();
  /** Clock of the file timestamps (tests of the clean-up). */
  clock: () => number = Date.now;
  private n = 0;
  /** Number of conditional writes refused, for tests of concurrent writes. */
  conflicts = 0;

  async get<T>(key: string) {
    const e = this.docs.get(key);
    return e ? { value: JSON.parse(e.value) as T, etag: e.etag } : null;
  }
  async set(key: string, value: unknown, cond: WriteCondition = {}) {
    const cur = this.docs.get(key);
    if ((cond.onlyIfNew && cur) || (cond.onlyIfMatch !== undefined && cur?.etag !== cond.onlyIfMatch)) {
      this.conflicts++;
      return false;
    }
    this.docs.set(key, { value: JSON.stringify(value), etag: `"e${++this.n}"` });
    return true;
  }
  async delete(key: string) {
    this.docs.delete(key);
    this.files.delete(key);
  }
  async list(prefix: string) {
    return [...this.docs.keys(), ...this.files.keys()].filter((k) => k.startsWith(prefix)).sort();
  }
  async getFile(key: string) {
    const f = this.files.get(key);
    return f ? { bytes: f.bytes, contentType: f.contentType } : null;
  }
  async putFile(key: string, bytes: Uint8Array, contentType: string) {
    if (!this.files.has(key)) this.files.set(key, { bytes, contentType, at: this.clock() });
  }
  async uploadedAt(key: string) {
    return this.files.get(key)?.at ?? null;
  }
}

/* ---------- Netlify Blobs ---------- */

/**
 * How a store is opened. `getStore()` reads the Blobs context (site ID, token, edge URLs) from the
 * environment ONCE, when it is called, and keeps it in its client. Netlify gives that context to each
 * invocation of the function, with a token that is only meant for that invocation; a client kept
 * between invocations (a warm instance can live for hours) would go on using an old token. So a store
 * is opened again for every operation: it costs no request, only the reading of the current context.
 */
export type StoreOpener = (name: string) => ReturnType<typeof getStore>;
const openStrong: StoreOpener = (name) => getStore({ name, consistency: 'strong' });

/** Runs one Blobs operation; any failure becomes a StorageError (status, kind, redacted message). */
export async function guard<T>(op: string, store: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw e instanceof StorageError ? e : new StorageError(op, store, e);
  }
}

/** Site-wide store with strong consistency: a write is visible to the next read, from any instance. */
export function netlifyDocStore(name: string, open: StoreOpener = openStrong): DocStore {
  return {
    get<T>(key: string) {
      return guard('get', name, async () => {
        const store = open(name);
        const r = await store.getWithMetadata(key, { type: 'json' });
        if (!r) return null;
        // The ETag drives the conditional writes. Netlify returns it with the blob; if a server does not
        // (the local emulator), read it from the listing rather than writing unconditionally.
        const etag = r.etag ?? (await store.list({ prefix: key })).blobs.find((b) => b.key === key)?.etag ?? '';
        return { value: r.data as T, etag };
      });
    },
    set(key, value, cond) {
      return guard('set', name, async () => {
        const store = open(name);
        if (cond?.onlyIfMatch !== undefined) {
          // Without a known version, refuse: an unconditional write could overwrite someone else's.
          if (!cond.onlyIfMatch) return false;
          return (await store.setJSON(key, value, { onlyIfMatch: cond.onlyIfMatch })).modified;
        }
        return (await store.setJSON(key, value, cond?.onlyIfNew ? { onlyIfNew: true } : {})).modified;
      });
    },
    delete: (key) => guard('delete', name, () => open(name).delete(key)),
    list: (prefix) => guard('list', name, async () => (await open(name).list({ prefix })).blobs.map((b) => b.key)),
  };
}

export function netlifyFileStore(name: string, open: StoreOpener = openStrong): FileStore {
  return {
    getFile: (key) =>
      guard('getFile', name, async () => {
        const r = await open(name).getWithMetadata(key, { type: 'arrayBuffer' });
        if (!r) return null;
        return { bytes: new Uint8Array(r.data), contentType: String(r.metadata.contentType ?? 'application/octet-stream') };
      }),
    putFile: (key, bytes, contentType) =>
      guard('putFile', name, async () => {
        // onlyIfNew: the key is the hash of the bytes, an existing file is already the right one.
        await open(name).set(key, new Blob([bytes as BlobPart]), { onlyIfNew: true, metadata: { contentType, uploadedAt: Date.now() } });
      }),
    uploadedAt: (key) =>
      guard('uploadedAt', name, async () => {
        const m = await open(name).getMetadata(key);
        const t = Number(m?.metadata?.uploadedAt);
        return Number.isFinite(t) && t > 0 ? t : null;
      }),
    delete: (key) => guard('delete', name, () => open(name).delete(key)),
    list: (prefix) => guard('list', name, async () => (await open(name).list({ prefix })).blobs.map((b) => b.key)),
  };
}

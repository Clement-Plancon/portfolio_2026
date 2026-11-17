// A small storage interface over Netlify Blobs, with an in-memory version for tests.
// JSON documents carry an ETag so writes can be conditional (no lost update between instances).
import { getStore } from '@netlify/blobs';

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
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/* ---------- In memory (tests, local scripts) ---------- */

export class MemoryStore implements DocStore, FileStore {
  private docs = new Map<string, { value: string; etag: string }>();
  private files = new Map<string, { bytes: Uint8Array; contentType: string }>();
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
    return this.files.get(key) ?? null;
  }
  async putFile(key: string, bytes: Uint8Array, contentType: string) {
    if (!this.files.has(key)) this.files.set(key, { bytes, contentType });
  }
}

/* ---------- Netlify Blobs ---------- */

/** Site-wide store with strong consistency: a write is visible to the next read, from any instance. */
export function netlifyDocStore(name: string): DocStore {
  const store = getStore({ name, consistency: 'strong' });
  return {
    async get<T>(key: string) {
      const r = await store.getWithMetadata(key, { type: 'json' });
      if (!r) return null;
      // The ETag drives the conditional writes. Netlify returns it with the blob; if a server does not
      // (the local emulator), read it from the listing rather than writing unconditionally.
      const etag = r.etag ?? (await store.list({ prefix: key })).blobs.find((b) => b.key === key)?.etag ?? '';
      return { value: r.data as T, etag };
    },
    async set(key, value, cond) {
      if (cond?.onlyIfMatch !== undefined) {
        // Without a known version, refuse: an unconditional write could overwrite someone else's.
        if (!cond.onlyIfMatch) return false;
        return (await store.setJSON(key, value, { onlyIfMatch: cond.onlyIfMatch })).modified;
      }
      return (await store.setJSON(key, value, cond?.onlyIfNew ? { onlyIfNew: true } : {})).modified;
    },
    delete: (key) => store.delete(key),
    async list(prefix) {
      return (await store.list({ prefix })).blobs.map((b) => b.key);
    },
  };
}

export function netlifyFileStore(name: string): FileStore {
  const store = getStore({ name, consistency: 'strong' });
  return {
    async getFile(key) {
      const r = await store.getWithMetadata(key, { type: 'arrayBuffer' });
      if (!r) return null;
      return { bytes: new Uint8Array(r.data), contentType: String(r.metadata.contentType ?? 'application/octet-stream') };
    },
    async putFile(key, bytes, contentType) {
      await store.set(key, new Blob([bytes as BlobPart]), { onlyIfNew: true, metadata: { contentType } });
    },
    delete: (key) => store.delete(key),
    async list(prefix) {
      return (await store.list({ prefix })).blobs.map((b) => b.key);
    },
  };
}

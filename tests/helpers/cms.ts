// The content store on an in-memory Netlify Blobs stand-in, initialised from the repository content.
import { MemoryStore } from '../../src/server/blob-store';
import { ContentStore, type SeedLoader } from '../../src/server/content-store';
import type { Snapshot } from '../../src/lib/snapshot';

export function testCms(opts: { now?: () => string; seed?: SeedLoader } = {}) {
  // Two stores, as in production: JSON documents ("cms") and media files ("cms-media").
  const store = new MemoryStore();
  const files = new MemoryStore();
  const cms = new ContentStore({ docs: store, files, now: opts.now, seed: opts.seed, log: () => {} });
  const snap = async (which: 'draft' | 'published') => (await store.get<Snapshot>(which))?.value;
  return {
    store,
    files,
    cms,
    snap,
    /** JSON text of an entry in the draft or the published content (undefined when absent). */
    async read(which: 'draft' | 'published', path: string) {
      const s = await snap(which);
      const v = s?.entries[path];
      return v === undefined ? undefined : JSON.stringify(v, null, 2);
    },
    async hasMedia(which: 'draft' | 'published', ref: string) {
      return !!(await snap(which))?.media[ref];
    },
  };
}

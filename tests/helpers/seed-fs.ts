// The same initial content as src/lib/seed.ts, read with node:fs, for code running outside Vite
// (Playwright's test process). src/lib/seed.ts itself is covered by the unit tests.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import type { SeedLoader } from '../../src/server/content-store';
import { SNAPSHOT_FORMAT, validateSnapshot } from '../../src/lib/snapshot';

export const fsSeed: SeedLoader = async () => {
  const entries: Record<string, unknown> = {};
  for (const f of ['profile', 'skills', 'seo', 'media']) entries[`src/content/${f}.json`] = JSON.parse(readFileSync(`src/content/${f}.json`, 'utf8'));
  for (const dir of ['projects', 'experiences']) {
    for (const f of readdirSync(`src/content/${dir}`)) entries[`src/content/${dir}/${f}`] = JSON.parse(readFileSync(`src/content/${dir}/${f}`, 'utf8'));
  }
  const files = readdirSync('src/assets/media').map((name) => {
    const bytes = new Uint8Array(readFileSync(`src/assets/media/${name}`));
    return { ref: `media/${name}`, bytes, sha: createHash('sha256').update(bytes).digest('hex'), size: bytes.byteLength, contentType: 'image/webp' };
  });
  const media = Object.fromEntries(files.map((f) => [f.ref, { sha: f.sha, size: f.size, contentType: f.contentType }]));
  return { snapshot: validateSnapshot({ format: SNAPSHOT_FORMAT, rev: 1, updatedAt: new Date().toISOString(), entries, media }), files };
};

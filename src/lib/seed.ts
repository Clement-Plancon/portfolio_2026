// The content versioned in src/content (and its media), as a snapshot. It is used ONCE: to initialise
// Netlify Blobs when the store is empty. After that, Blobs is the source of truth and a redeploy never
// writes this seed again (see ContentStore.ensureInitialised).
import { createHash } from 'node:crypto';
import { contentPath } from './content-types';
import { type MediaFile, SNAPSHOT_FORMAT, type Snapshot, validateSnapshot } from './snapshot';

const json = {
  ...import.meta.glob('../content/*.json', { eager: true, import: 'default' }),
  ...import.meta.glob('../content/projects/*.json', { eager: true, import: 'default' }),
  ...import.meta.glob('../content/experiences/*.json', { eager: true, import: 'default' }),
} as Record<string, unknown>;

// Media bytes are bundled as data URLs (the site has a handful of small images).
const images = import.meta.glob('../assets/media/*.{webp,png,jpg,jpeg,avif}', { eager: true, query: '?inline', import: 'default' }) as Record<string, string>;
const pdfs = import.meta.glob('../../public/files/*.pdf', { eager: true, query: '?inline', import: 'default' }) as Record<string, string>;

const TYPES: Record<string, string> = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif', pdf: 'application/pdf' };

export interface SeedFile extends MediaFile {
  ref: string;
  bytes: Uint8Array;
}

function decode(dataUrl: string): Uint8Array {
  const i = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, i);
  const body = dataUrl.slice(i + 1);
  return meta.endsWith(';base64') ? new Uint8Array(Buffer.from(body, 'base64')) : new TextEncoder().encode(decodeURIComponent(body));
}

export function seedFiles(): SeedFile[] {
  const out: SeedFile[] = [];
  for (const [path, url] of [...Object.entries(images), ...Object.entries(pdfs)]) {
    const name = path.split('/').pop()!;
    const ext = name.split('.').pop()!.toLowerCase();
    const bytes = decode(url);
    out.push({
      ref: path.includes('/public/files/') ? `files/${name}` : `media/${name}`,
      bytes,
      sha: createHash('sha256').update(bytes).digest('hex'),
      size: bytes.byteLength,
      contentType: TYPES[ext] ?? 'application/octet-stream',
    });
  }
  return out;
}

/** The repository content as a validated snapshot (rev 1). */
export function seedSnapshot(now = new Date().toISOString()): Snapshot {
  const entries: Record<string, unknown> = {};
  for (const [path, data] of Object.entries(json)) {
    // '../content/projects/x.json' -> 'src/content/projects/x.json'
    entries[`src/${path.replace(/^\.\.\//, '')}`] = data;
  }
  if (!(contentPath('media') in entries)) entries[contentPath('media')] = { items: [] };
  const media: Record<string, MediaFile> = {};
  for (const f of seedFiles()) media[f.ref] = { sha: f.sha, size: f.size, contentType: f.contentType };
  return validateSnapshot({ format: SNAPSHOT_FORMAT, rev: 1, updatedAt: now, entries, media });
}


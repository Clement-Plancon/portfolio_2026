// Editorial content in Netlify Blobs: no GitHub, no draft branch, no rebuild.
//
// Store "cms" (JSON, strong consistency):
//   published         Snapshot shown to visitors
//   draft             Snapshot edited in the admin (absent until the first save; pending = differs from published)
//   history/<rev>     previous published snapshots (the last HISTORY_KEEP), for recovery
//   backups/<date>-…  automatic copies made before the first initialisation and before every restore
// Store "cms-media" (files): bytes keyed by their SHA-256. A key never changes meaning, so a published
//   page can keep serving the old bytes while the draft already points to a replacement.
//
// Every write is a conditional write on the document's ETag, retried on conflict after re-checking:
// two admin tabs (or two function instances) can never silently overwrite each other's changes.
// Publishing is ONE write of the whole published snapshot: there is no partial publication.
import { createHash } from 'node:crypto';
import { CONTENT_TYPES, type ContentType, contentPath, isContentType, parseContentPath } from '../lib/content-types';
import { type MediaManifest, mediaManifestSchema } from '../lib/schemas';
import type { SeedFile } from '../lib/seed';
import { SNAPSHOT_FORMAT, type Snapshot, validateSnapshot } from '../lib/snapshot';
import type { DocStore, FileStore } from './blob-store';
import { HttpError } from './http';
import { StorageError } from './storage-error';

export type SaveChange =
  | { op: 'put'; type: ContentType; id?: string; data: unknown; baseSha: string | null }
  | { op: 'delete'; type: ContentType; id?: string; baseSha: string };

export const HISTORY_KEEP = 20;
/** A media file younger than this is never removed by the clean-up, referenced or not: it may belong to an
 *  upload in progress in another tab (bytes are written before the draft that points to them). */
export const MEDIA_GRACE_MS = 24 * 3600_000;
const MAX_RETRIES = 6;
const BACKUP_FORMAT = 'clementplancon-cms-backup';

/** Fingerprint of one entry, sent to the admin and returned with each save to detect concurrent edits. */
export const entrySha = (data: unknown) => createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 40);
export const fileSha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** True when two snapshots have different content or media (their revision numbers aside). */
export const differs = (a: Snapshot, b: Snapshot) =>
  entrySha({ e: a.entries, m: a.media }) !== entrySha({ e: b.entries, m: b.media });

const conflict = () => new HttpError(409, 'conflict', "Ce contenu a été modifié ailleurs depuis son ouverture. Rechargez-le avant d'enregistrer.");
const busy = () => new HttpError(503, 'busy', 'Trop de modifications simultanées. Réessayez dans un instant.');
/** An unconditional write that the store did not confirm: never report it as done. */
const unconfirmed = (store: string, key: string) => new StorageError('set', store, { name: 'UnconfirmedWrite', message: `write of ${key.split('/')[0]} not confirmed` });

export type SeedLoader = () => Promise<{ snapshot: Snapshot; files: SeedFile[] }>;

/** The repository content (bundled at build time by Vite), loaded only when Blobs is empty. */
const bundledSeed: SeedLoader = async () => {
  const m = await import('../lib/seed');
  return { snapshot: m.seedSnapshot(), files: m.seedFiles() };
};

export interface ContentStoreOptions {
  docs: DocStore;
  files: FileStore;
  /** Where the initial content comes from (default: src/content bundled with the site). */
  seed?: SeedLoader;
  now?: () => string;
  log?: (m: string) => void;
}

export class ContentStore {
  private now: () => string;
  private log: (m: string) => void;
  constructor(private o: ContentStoreOptions) {
    this.now = o.now ?? (() => new Date().toISOString());
    this.log = o.log ?? ((m) => console.error(m));
  }

  /* ---------- Initialisation ---------- */

  /**
   * Writes the repository content to Blobs if, and only if, nothing is published yet. Idempotent:
   * `onlyIfNew` makes a redeploy or two concurrent first visits harmless — existing data is never replaced.
   */
  async ensureInitialised(): Promise<{ initialised: boolean }> {
    if (await this.o.docs.get('published')) return { initialised: false };
    const loaded = await (this.o.seed ?? bundledSeed)();
    const seed: Snapshot = { ...loaded.snapshot, rev: 1, updatedAt: this.now() };
    for (const f of loaded.files) await this.o.files.putFile(f.sha, f.bytes, f.contentType);
    // A copy of what is about to become the first published content.
    await this.o.docs.set(`backups/${this.now().replace(/[:.]/g, '-')}-initialisation`, seed, { onlyIfNew: true });
    const created = await this.o.docs.set('published', seed, { onlyIfNew: true });
    if (created) this.log('[cms] content initialised from the repository');
    return { initialised: created };
  }

  /** The published snapshot (initialising the store on first use). */
  async published(): Promise<Snapshot> {
    let p = await this.o.docs.get<Snapshot>('published');
    if (!p) {
      await this.ensureInitialised();
      p = await this.o.docs.get<Snapshot>('published');
    }
    if (!p) throw new HttpError(500, 'not_initialised', "Le contenu n'a pas pu être initialisé.");
    return validateSnapshot(p.value);
  }

  /** The draft if there is one, otherwise the published content. `isDraft`: it has unpublished changes. */
  async working(): Promise<{ snap: Snapshot; isDraft: boolean }> {
    const published = await this.published();
    const d = await this.o.docs.get<Snapshot>('draft');
    if (d) return { snap: validateSnapshot(d.value), isDraft: differs(d.value, published) };
    return { snap: published, isDraft: false };
  }

  /**
   * Read-modify-write of the draft with a conditional write. `change` may throw (validation, conflict)
   * and is re-run on fresh data if another write landed in between.
   */
  private async updateDraft(change: (s: Snapshot) => Snapshot | Promise<Snapshot>): Promise<Snapshot> {
    for (let i = 0; i < MAX_RETRIES; i++) {
      const cur = await this.o.docs.get<Snapshot>('draft');
      const base = cur ? cur.value : await this.published();
      const next = await change(structuredClone(base));
      const out: Snapshot = { ...next, format: SNAPSHOT_FORMAT, rev: base.rev + 1, updatedAt: this.now() };
      const ok = await this.o.docs.set('draft', out, cur ? { onlyIfMatch: cur.etag } : { onlyIfNew: true });
      if (ok) return out;
    }
    throw busy();
  }

  /* ---------- Reading (admin) ---------- */

  async readAll() {
    const { snap, isDraft } = await this.working();
    const collections: Record<string, unknown[]> = { project: [], experience: [] };
    const singletons: Record<string, unknown> = {};
    for (const [path, data] of Object.entries(snap.entries)) {
      const info = parseContentPath(path)!;
      const entry = { ...info, path, sha: entrySha(data), data };
      if (CONTENT_TYPES[info.type].kind === 'collection') collections[info.type].push(entry);
      else singletons[info.type] = entry;
    }
    const mediaFiles = Object.entries(snap.media).map(([ref, f]) => ({ ref, sha: f.sha, size: f.size }));
    return {
      ref: { branch: isDraft ? 'brouillon' : 'publié', sha: String(snap.rev), isDraft, date: snap.updatedAt },
      collections,
      singletons,
      mediaFiles,
    };
  }

  /* ---------- Content ---------- */

  async save(changes: SaveChange[]) {
    const now = this.now();
    const prepared = changes.map((c) => {
      if (!isContentType(c.type)) throw new HttpError(400, 'invalid_type', 'Type de contenu inconnu.');
      let path: string;
      try {
        path = contentPath(c.type, c.id);
      } catch {
        throw new HttpError(400, 'invalid_id', 'Identifiant invalide (lettres minuscules, chiffres et tirets).');
      }
      if (c.op === 'delete') {
        if (CONTENT_TYPES[c.type].kind === 'singleton') throw new HttpError(400, 'forbidden', 'Ce contenu ne peut pas être supprimé.');
        return { path, baseSha: c.baseSha, data: null as unknown };
      }
      const input = c.type === 'media' ? c.data : { ...(c.data as object), updatedAt: now };
      const r = CONTENT_TYPES[c.type].schema.safeParse(input);
      if (!r.success) {
        throw new HttpError(422, 'validation', 'Certains champs sont invalides.', r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
      }
      return { path, baseSha: c.baseSha, data: r.data as unknown };
    });
    const seen = new Set<string>();
    for (const p of prepared) {
      if (seen.has(p.path)) throw new HttpError(400, 'duplicate', 'Le même contenu apparaît deux fois.');
      seen.add(p.path);
    }

    const snap = await this.updateDraft((s) => {
      for (const p of prepared) {
        const current = p.path in s.entries ? entrySha(s.entries[p.path]) : null;
        if (p.baseSha !== current) {
          if (p.baseSha === null) throw new HttpError(409, 'exists', 'Un contenu avec cet identifiant existe déjà.');
          throw conflict();
        }
      }
      for (const p of prepared) {
        if (p.data === null) delete s.entries[p.path];
        else s.entries[p.path] = p.data;
      }
      return s;
    });
    const files: Record<string, string | null> = {};
    for (const p of prepared) files[p.path] = p.data === null ? null : entrySha(snap.entries[p.path]);
    return { commit: String(snap.rev), files };
  }

  /* ---------- Media ---------- */

  private manifestOf(s: Snapshot): MediaManifest {
    return mediaManifestSchema.parse(s.entries[contentPath('media')] ?? { items: [] });
  }

  async uploadMedia(file: { ref: string; bytes: Uint8Array; contentType: string; alt: string; width?: number; height?: number; replace: boolean }) {
    const sha = fileSha(file.bytes);
    // Bytes first (content-addressed, harmless if the draft update then fails), then the draft.
    await this.o.files.putFile(sha, file.bytes, file.contentType);
    const manifestPath = contentPath('media');
    const snap = await this.updateDraft((s) => {
      const exists = file.ref in s.media;
      if (file.replace && !exists) throw new HttpError(404, 'not_found', 'Le média à remplacer est introuvable.');
      if (!file.replace && exists) throw new HttpError(409, 'exists', 'Un média porte déjà ce nom.');
      if (file.replace && s.media[file.ref].contentType !== file.contentType) {
        throw new HttpError(400, 'bad_type', 'Le fichier de remplacement doit avoir le même format.');
      }
      s.media[file.ref] = { sha, size: file.bytes.byteLength, contentType: file.contentType };
      const manifest = this.manifestOf(s);
      const previous = manifest.items.find((i) => i.file === file.ref);
      const items = manifest.items.filter((i) => i.file !== file.ref);
      items.push({
        ...previous,
        file: file.ref,
        alt: file.alt || previous?.alt || '',
        size: file.bytes.byteLength,
        uploadedAt: this.now(),
        ...(file.width && { width: file.width }),
        ...(file.height && { height: file.height }),
      });
      items.sort((a, b) => a.file.localeCompare(b.file));
      s.entries[manifestPath] = mediaManifestSchema.parse({ items });
      return s;
    });
    return { commit: String(snap.rev), files: { [manifestPath]: entrySha(snap.entries[manifestPath]) } };
  }

  async deleteMedia(ref: string) {
    const manifestPath = contentPath('media');
    const snap = await this.updateDraft((s) => {
      if (!(ref in s.media)) throw new HttpError(404, 'not_found', 'Média introuvable.');
      // Refuse to delete a file still referenced by content: the page would show a broken image.
      const usedBy = Object.entries(s.entries)
        .filter(([path, data]) => path !== manifestPath && JSON.stringify(data).includes(`"${ref}"`))
        .map(([path]) => path.replace('src/content/', ''));
      if (usedBy.length) {
        throw new HttpError(409, 'in_use', 'Ce média est encore utilisé. Retirez-le de ces contenus avant de le supprimer.', usedBy.map((u) => ({ path: u, message: 'utilise ce média' })));
      }
      delete s.media[ref];
      s.entries[manifestPath] = { items: this.manifestOf(s).items.filter((i) => i.file !== ref) };
      return s;
    });
    return { commit: String(snap.rev), files: { [manifestPath]: entrySha(snap.entries[manifestPath]) } };
  }

  /** Bytes of a media file of the draft (admin) or of the published content (visitors). */
  async readMedia(ref: string, from: 'working' | 'published' = 'working') {
    const snap = from === 'published' ? await this.published() : (await this.working()).snap;
    const f = snap.media[ref];
    if (!f) throw new HttpError(404, 'not_found', 'Média introuvable.');
    const file = await this.o.files.getFile(f.sha);
    if (!file) throw new HttpError(404, 'not_found', 'Fichier du média introuvable.');
    return { bytes: file.bytes, contentType: f.contentType, sha: f.sha };
  }

  /* ---------- Publication ---------- */

  /** What the draft changes compared to the published content. */
  async status() {
    const published = await this.published();
    const d = await this.o.docs.get<Snapshot>('draft');
    const files: { path: string; status: string; type?: ContentType; id?: string }[] = [];
    if (d) {
      const draft = d.value;
      const paths = new Set([...Object.keys(published.entries), ...Object.keys(draft.entries)]);
      for (const path of [...paths].sort()) {
        const a = published.entries[path];
        const b = draft.entries[path];
        const status = a === undefined ? 'added' : b === undefined ? 'removed' : entrySha(a) !== entrySha(b) ? 'modified' : null;
        if (status) files.push({ path, status, ...(parseContentPath(path) ?? {}) });
      }
      const refs = new Set([...Object.keys(published.media), ...Object.keys(draft.media)]);
      for (const ref of [...refs].sort()) {
        const a = published.media[ref]?.sha;
        const b = draft.media[ref]?.sha;
        if (a !== b) files.push({ path: ref, status: !a ? 'added' : !b ? 'removed' : 'modified' });
      }
    }
    const publishedState = { state: 'success', url: null, description: 'Contenu publié', updatedAt: published.updatedAt };
    return {
      production: { sha: String(published.rev), deploy: publishedState },
      draft: d && files.length ? { sha: String(d.value.rev), ahead: files.length, behind: 0, files, commits: [], deploy: null } : null,
    };
  }

  /**
   * Makes the draft the published content, in a single conditional write. If the published content or
   * the draft changed during the operation, nothing is published and the caller gets a 409.
   */
  async publish() {
    await this.published(); // initialises the store if needed
    const d = await this.o.docs.get<Snapshot>('draft');
    const p = await this.o.docs.get<Snapshot>('published');
    if (!p) throw new HttpError(500, 'not_initialised', "Le contenu n'est pas initialisé.");
    if (!d || !differs(d.value, validateSnapshot(p.value))) throw new HttpError(400, 'nothing', 'Aucune modification à publier.');
    let next: Snapshot;
    try {
      next = validateSnapshot({ ...d.value, format: SNAPSHOT_FORMAT, rev: Math.max(d.value.rev, p.value.rev) + 1, updatedAt: this.now() });
    } catch (e) {
      throw new HttpError(422, 'validation', `Publication refusée : ${(e as Error).message}`);
    }
    for (const f of Object.values(next.media)) {
      if (!(await this.o.files.getFile(f.sha))) throw new HttpError(409, 'missing_file', 'Un fichier de la médiathèque est introuvable : publication annulée.');
    }
    // Keep the version being replaced (recovery), then switch atomically. No copy, no publication.
    if (!(await this.o.docs.set(`history/${String(p.value.rev).padStart(8, '0')}`, p.value))) throw unconfirmed('cms', 'history');
    if (!(await this.o.docs.set('published', next, { onlyIfMatch: p.etag }))) {
      throw new HttpError(409, 'conflict', 'Une autre publication vient d’avoir lieu. Rechargez puis publiez à nouveau.');
    }
    // The draft now equals the published content; if it changed meanwhile, the new edits stay pending.
    await this.o.docs.set('draft', next, { onlyIfMatch: d.etag });
    await this.cleanup();
    return { published: true, sha: String(next.rev) };
  }

  /** Drops unpublished changes. */
  async discard() {
    const d = await this.o.docs.get<Snapshot>('draft');
    if (d) {
      const p = await this.published();
      if (!(await this.o.docs.set('draft', { ...p, rev: Math.max(p.rev, d.value.rev) + 1, updatedAt: this.now() }, { onlyIfMatch: d.etag }))) throw conflict();
    }
    return { discarded: true };
  }

  /** Prunes old history and media files that no kept snapshot references. Best effort. */
  private async cleanup() {
    try {
      const history = await this.o.docs.list('history/');
      for (const key of history.slice(0, Math.max(0, history.length - HISTORY_KEEP))) await this.o.docs.delete(key);
      const used = new Set<string>();
      const keep = ['published', 'draft', ...(await this.o.docs.list('history/')), ...(await this.o.docs.list('backups/'))];
      for (const key of keep) {
        const s = await this.o.docs.get<Snapshot>(key);
        for (const f of Object.values(s?.value.media ?? {})) used.add(f.sha);
      }
      const now = Date.now();
      for (const key of await this.o.files.list('')) {
        if (used.has(key)) continue;
        // A file without a date was written before dates were recorded: it is old enough.
        const at = await this.o.files.uploadedAt(key);
        if (at !== null && now - at < MEDIA_GRACE_MS) continue;
        await this.o.files.delete(key);
      }
    } catch (e) {
      const err = e instanceof StorageError ? e : new StorageError('cleanup', 'cms', e);
      this.log(`[cms] cleanup skipped: ${err.causeName} ${err.status ?? ''} ${err.message}`);
    }
  }

  /* ---------- Backup and restore ---------- */

  /** The working content (draft or published) as a downloadable document; optionally with the media bytes. */
  async exportBackup({ withFiles = false } = {}) {
    const { snap, isDraft } = await this.working();
    const files: Record<string, string> = {};
    if (withFiles) {
      for (const f of Object.values(snap.media)) {
        const file = await this.o.files.getFile(f.sha);
        if (file) files[f.sha] = Buffer.from(file.bytes).toString('base64');
      }
    }
    return { format: BACKUP_FORMAT, version: 1, exportedAt: this.now(), source: isDraft ? 'draft' : 'published', snapshot: snap, ...(withFiles && { files }) };
  }

  /**
   * Replaces the DRAFT with a backup (the site changes only when you publish). Everything is validated
   * first; the current draft is copied to backups/ beforehand. `expectedRev` protects against restoring
   * over changes made since the admin loaded the page.
   */
  async restoreBackup(raw: unknown, expectedRev: string | undefined) {
    const b = raw as { format?: unknown; version?: unknown; snapshot?: Snapshot; files?: Record<string, string> };
    if (!b || b.format !== BACKUP_FORMAT || b.version !== 1 || !b.snapshot || typeof b.snapshot !== 'object') {
      throw new HttpError(400, 'bad_backup', "Ce fichier n'est pas une sauvegarde de cette administration.");
    }
    let snap: Snapshot;
    try {
      snap = validateSnapshot({ ...b.snapshot, format: SNAPSHOT_FORMAT, media: b.snapshot.media ?? {}, entries: b.snapshot.entries ?? {} });
      for (const [ref, f] of Object.entries(snap.media)) {
        if (!/^(media|files)\//.test(ref) || !/^[0-9a-f]{64}$/.test(f.sha)) throw new Error(`Média invalide : ${ref}`);
      }
    } catch (e) {
      throw new HttpError(422, 'validation', `Sauvegarde refusée : ${(e as Error).message}`);
    }
    // Files carried by the backup are checked against their hash before being stored.
    for (const [sha, b64] of Object.entries(b.files ?? {})) {
      const bytes = new Uint8Array(Buffer.from(b64, 'base64'));
      if (fileSha(bytes) !== sha) throw new HttpError(422, 'validation', 'Sauvegarde refusée : un fichier est corrompu.');
      const type = Object.values(snap.media).find((f) => f.sha === sha)?.contentType;
      if (type) await this.o.files.putFile(sha, bytes, type);
    }
    const missing: string[] = [];
    for (const [ref, f] of Object.entries(snap.media)) if (!(await this.o.files.getFile(f.sha))) missing.push(ref);
    if (missing.length) {
      throw new HttpError(422, 'missing_files', 'Sauvegarde refusée : des fichiers de médias manquent (utilisez une sauvegarde « avec les fichiers »).', missing.map((m) => ({ path: m, message: 'fichier absent' })));
    }

    const { snap: current } = await this.working();
    if (expectedRev !== undefined && expectedRev !== String(current.rev)) {
      throw new HttpError(409, 'conflict', 'Le contenu a changé depuis le chargement de la page. Rechargez avant de restaurer.');
    }
    // The copy of the current content must exist before anything is replaced.
    if (!(await this.o.docs.set(`backups/${this.now().replace(/[:.]/g, '-')}-avant-restauration`, current))) throw unconfirmed('cms', 'backups');
    const restored = await this.updateDraft(() => ({ ...snap }));
    return { restored: true, rev: String(restored.rev), projects: Object.keys(restored.entries).filter((p) => p.includes('/projects/')).length, media: Object.keys(restored.media).length };
  }
}

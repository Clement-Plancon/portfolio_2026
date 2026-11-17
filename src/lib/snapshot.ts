// The editorial content of the site as one document ("snapshot"), stored in Netlify Blobs.
// Two snapshots exist: the published one (what visitors see) and the draft (what the admin edits).
// Entries are keyed by their historical path (src/content/projects/x.json…) so ids and the admin API
// stay the same as when content lived in Git.
import { CONTENT_TYPES, type ContentType, contentPath, parseContentPath } from './content-types';
import {
  type Experience,
  type MediaManifest,
  mediaManifestSchema,
  type Profile,
  type Project,
  type SeoSettings,
  type Skills,
} from './schemas';

export const SNAPSHOT_FORMAT = 1;

/** A media file: its bytes live in the media store under `sha` (SHA-256, so a key always means the same bytes). */
export interface MediaFile {
  sha: string;
  size: number;
  contentType: string;
}

export interface Snapshot {
  format: typeof SNAPSHOT_FORMAT;
  /** Increases on every change; shown in the admin and used to detect stale restores. */
  rev: number;
  updatedAt: string;
  /** Path -> validated JSON content. */
  entries: Record<string, unknown>;
  /** Media reference ("media/x.webp", "files/cv.pdf") -> file. */
  media: Record<string, MediaFile>;
}

export type ProjectEntry = Project & { id: string };
export type ExperienceEntry = Experience & { id: string };

export interface SiteData {
  profile: Profile;
  skills: Skills;
  seo: SeoSettings;
  projects: ProjectEntry[];
  experiences: ExperienceEntry[];
  /** Media manifest entries (alt text, dimensions), by reference. */
  manifest: Map<string, MediaManifest['items'][number]>;
  media: Record<string, MediaFile>;
}

const byOrder = (a: { order: number; id: string }, b: { order: number; id: string }) => a.order - b.order || a.id.localeCompare(b.id);

/** Validates every entry of a snapshot. Throws with the first invalid path. */
export function validateSnapshot(s: Snapshot): Snapshot {
  const entries: Record<string, unknown> = {};
  for (const [path, data] of Object.entries(s.entries)) {
    const info = parseContentPath(path);
    if (!info) throw new Error(`Chemin de contenu inconnu : ${path}`);
    const r = CONTENT_TYPES[info.type].schema.safeParse(data);
    if (!r.success) throw new Error(`Contenu invalide (${path}) : ${r.error.issues[0]?.message ?? 'erreur'}`);
    entries[path] = r.data;
  }
  for (const t of ['profile', 'skills', 'seo'] as ContentType[]) {
    if (!(contentPath(t) in entries)) throw new Error(`Contenu manquant : ${contentPath(t)}`);
  }
  return { ...s, entries };
}

/**
 * What the one-page renders. `includeHidden` is only for the admin preview: visitors never get hidden
 * projects or experiences.
 */
export function toSiteData(s: Snapshot, { includeHidden = false } = {}): SiteData {
  const projects: ProjectEntry[] = [];
  const experiences: ExperienceEntry[] = [];
  for (const [path, data] of Object.entries(s.entries)) {
    const info = parseContentPath(path);
    if (info?.type === 'project') projects.push({ id: info.id!, ...(data as Project) });
    if (info?.type === 'experience') experiences.push({ id: info.id!, ...(data as Experience) });
  }
  const visible = <T extends { visible: boolean }>(x: T) => includeHidden || x.visible;
  const manifest = mediaManifestSchema.parse(s.entries[contentPath('media')] ?? { items: [] });
  return {
    profile: s.entries[contentPath('profile')] as Profile,
    skills: s.entries[contentPath('skills')] as Skills,
    seo: s.entries[contentPath('seo')] as SeoSettings,
    projects: projects.filter(visible).sort(byOrder),
    experiences: experiences.filter(visible).sort(byOrder),
    manifest: new Map(manifest.items.map((i) => [i.file, i])),
    media: s.media,
  };
}

/** Public URL of a media file. The version parameter changes with the bytes, so the URL can be cached for good. */
export function mediaUrl(ref: string, media: Record<string, MediaFile>): string | undefined {
  const f = media[ref];
  if (!f) return undefined;
  return `/${ref}?v=${f.sha.slice(0, 12)}`;
}

/** Text fields use blank lines between paragraphs. */
export function paragraphs(text?: string): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Where each kind of content lives in the repository, and which schema validates it.
// Used by the admin API to turn "save project bercy-vert" into a file path.
import type { z } from 'zod';
import {
  articleSchema,
  experienceSchema,
  mediaManifestSchema,
  profileSchema,
  projectSchema,
  seoSettingsSchema,
  skillsSchema,
  slugSchema,
} from './schemas';

export const CONTENT_ROOT = 'src/content';

type CollectionType = { kind: 'collection'; dir: string; schema: z.ZodType };
type SingletonType = { kind: 'singleton'; file: string; schema: z.ZodType };

export const CONTENT_TYPES = {
  project: { kind: 'collection', dir: `${CONTENT_ROOT}/projects`, schema: projectSchema },
  experience: { kind: 'collection', dir: `${CONTENT_ROOT}/experiences`, schema: experienceSchema },
  article: { kind: 'collection', dir: `${CONTENT_ROOT}/articles`, schema: articleSchema },
  profile: { kind: 'singleton', file: `${CONTENT_ROOT}/profile.json`, schema: profileSchema },
  skills: { kind: 'singleton', file: `${CONTENT_ROOT}/skills.json`, schema: skillsSchema },
  seo: { kind: 'singleton', file: `${CONTENT_ROOT}/seo.json`, schema: seoSettingsSchema },
  media: { kind: 'singleton', file: `${CONTENT_ROOT}/media.json`, schema: mediaManifestSchema },
} as const satisfies Record<string, CollectionType | SingletonType>;

export type ContentType = keyof typeof CONTENT_TYPES;

export function isContentType(t: unknown): t is ContentType {
  return typeof t === 'string' && Object.hasOwn(CONTENT_TYPES, t);
}

/** Repository path of a content entry. Throws on an invalid id. */
export function contentPath(type: ContentType, id?: string): string {
  const def = CONTENT_TYPES[type];
  if (def.kind === 'singleton') return def.file;
  return `${def.dir}/${slugSchema.parse(id)}.json`;
}

/** Reverse of contentPath, for files read from the repository. */
export function parseContentPath(path: string): { type: ContentType; id?: string } | null {
  for (const [type, def] of Object.entries(CONTENT_TYPES) as [ContentType, CollectionType | SingletonType][]) {
    if (def.kind === 'singleton' && def.file === path) return { type };
    if (def.kind === 'collection' && path.startsWith(`${def.dir}/`) && path.endsWith('.json')) {
      const id = path.slice(def.dir.length + 1, -5);
      if (slugSchema.safeParse(id).success) return { type, id };
    }
  }
  return null;
}

export const MEDIA_IMAGE_DIR = 'src/assets/media';
export const MEDIA_FILE_DIR = 'public/files';

/** "media/x.webp" -> "src/assets/media/x.webp", "files/cv.pdf" -> "public/files/cv.pdf". */
export function mediaRepoPath(ref: string): string {
  if (ref.startsWith('media/')) return `${MEDIA_IMAGE_DIR}/${ref.slice(6)}`;
  if (ref.startsWith('files/')) return `${MEDIA_FILE_DIR}/${ref.slice(6)}`;
  throw new Error('Invalid media reference');
}

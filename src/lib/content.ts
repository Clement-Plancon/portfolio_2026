// Build-time access to content files. Every file is validated: an invalid file fails the build,
// so a broken edit never reaches production.
import {
  type Article,
  articleSchema,
  type Experience,
  experienceSchema,
  type Profile,
  profileSchema,
  type Project,
  projectSchema,
  type SeoSettings,
  seoSettingsSchema,
  type Skills,
  skillsSchema,
} from './schemas';
import type { z } from 'zod';
import profileRaw from '../content/profile.json';
import skillsRaw from '../content/skills.json';
import seoRaw from '../content/seo.json';

/** Drafts and hidden items are shown on branch deploys (CMS preview) and in dev, never in production. */
export const SHOW_DRAFTS = process.env.CONTEXT
  ? process.env.CONTEXT !== 'production'
  : import.meta.env.DEV;

function parse<S extends z.ZodType>(schema: S, data: unknown, file: string): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(`Contenu invalide dans ${file} :\n${r.error.message}`);
  return r.data;
}

function collection<S extends z.ZodType>(files: Record<string, unknown>, schema: S) {
  return Object.entries(files).map(([path, mod]) => {
    const id = path.split('/').pop()!.replace(/\.json$/, '');
    const data = (mod as { default: unknown }).default;
    return { id, ...(parse(schema, data, path) as object) };
  });
}

export type ProjectEntry = Project & { id: string };
export type ExperienceEntry = Experience & { id: string };
export type ArticleEntry = Article & { id: string };

const byOrder = (a: { order: number; id: string }, b: { order: number; id: string }) =>
  a.order - b.order || a.id.localeCompare(b.id);

export function getProfile(): Profile {
  return parse(profileSchema, profileRaw, 'profile.json');
}
export function getSkills(): Skills {
  return parse(skillsSchema, skillsRaw, 'skills.json');
}
export function getSeo(): SeoSettings {
  return parse(seoSettingsSchema, seoRaw, 'seo.json');
}

export function getProjects(): ProjectEntry[] {
  const all = collection(
    import.meta.glob('../content/projects/*.json', { eager: true }),
    projectSchema,
  ) as ProjectEntry[];
  return all.filter((p) => SHOW_DRAFTS || p.visible).sort(byOrder);
}

export function getExperiences(): ExperienceEntry[] {
  const all = collection(
    import.meta.glob('../content/experiences/*.json', { eager: true }),
    experienceSchema,
  ) as ExperienceEntry[];
  return all.filter((e) => SHOW_DRAFTS || e.visible).sort(byOrder);
}

export function getArticles(): ArticleEntry[] {
  const all = collection(
    import.meta.glob('../content/articles/*.json', { eager: true }),
    articleSchema,
  ) as ArticleEntry[];
  return all
    .filter((a) => SHOW_DRAFTS || a.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

/** Text fields use blank lines between paragraphs. */
export function paragraphs(text?: string): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

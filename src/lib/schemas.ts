// Content schemas, shared by the Astro build (validation of content files)
// and the admin API (validation before anything is committed).
import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(1, 'Identifiant requis')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement');

/** Only http(s) and mailto links are allowed anywhere in content. */
export const urlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try {
      const u = new URL(v);
      return ['https:', 'http:', 'mailto:'].includes(u.protocol);
    } catch {
      return false;
    }
  }, 'Lien invalide (http, https ou mailto)');

export const MEDIA_IMAGE_RE = /^media\/[a-z0-9]+(?:-[a-z0-9]+)*\.(webp|png|jpe?g|avif)$/;
export const MEDIA_FILE_RE = /^files\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;

export const imageRefSchema = z.string().regex(MEDIA_IMAGE_RE, 'Image de la médiathèque attendue');

/** "2023" or "2023-04". */
export const yearMonthSchema = z
  .string()
  .regex(/^(19|20)\d{2}(-(0[1-9]|1[0-2]))?$/, 'Format AAAA ou AAAA-MM');

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => text(max).optional();
const list = (max: number, itemMax = 200) => z.array(text(itemMax).min(1)).max(max).default([]);

export const imageSchema = z.object({
  src: imageRefSchema,
  alt: text(300),
  caption: optText(300),
});

export const linkSchema = z.object({
  label: text(80).min(1, 'Libellé requis'),
  url: urlSchema,
});

export const seoSchema = z
  .object({
    title: optText(70),
    description: optText(170),
    ogImage: imageRefSchema.optional(),
    noindex: z.boolean().optional(),
  })
  .default({});

/** Toning of the project's cyanotype print (src/lib/photogram.ts). Names kept from earlier designs so content stays valid. */
export const COVER_COLORS = ['vermillon', 'sapin', 'ardoise', 'ocre', 'prune', 'sable'] as const;

/** Objects laid on the print in the project's photogram (src/lib/photogram.ts): a presentation visual, never a screenshot. */
export const PICTOGRAMS = ['feuille', 'jauge', 'dossier', 'radar', 'alerte', 'graphique', 'code', 'mobile', 'equipe'] as const;

export const projectSchema = z.object({
  title: text(120).min(1, 'Titre requis'),
  summary: text(320).min(1, 'Résumé requis'),
  kind: optText(80),
  pictogram: z.enum(PICTOGRAMS).optional(),
  category: z.enum(['pro', 'perso']),
  organisation: optText(120),
  period: z
    .object({ start: yearMonthSchema, end: yearMonthSchema.optional() })
    .optional(),
  status: z.enum(['termine', 'en-cours']).optional(),
  role: optText(1500),
  context: optText(4000),
  problem: optText(4000),
  approach: optText(4000),
  contributions: list(20, 300),
  results: list(20, 300),
  technologies: list(30, 60),
  links: z.array(linkSchema).max(10).default([]),
  cover: z
    .object({ color: z.enum(COVER_COLORS).default('sapin'), image: imageSchema.optional() })
    .default({ color: 'sapin' }),
  gallery: z.array(imageSchema).max(24).default([]),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).max(9999).default(0),
  seo: seoSchema,
  updatedAt: z.iso.datetime().optional(),
});

export const experienceSchema = z
  .object({
    role: text(160).min(1, 'Intitulé requis'),
    organisation: text(160).min(1, 'Organisation requise'),
    parentOrganisation: optText(160),
    url: urlSchema.optional(),
    location: optText(120),
    start: yearMonthSchema,
    end: yearMonthSchema.optional(),
    summary: optText(1500),
    responsibilities: list(20, 300),
    skills: list(30, 60),
    visible: z.boolean().default(true),
    order: z.number().int().min(0).max(9999).default(0),
    updatedAt: z.iso.datetime().optional(),
  })
  .refine((e) => !e.end || e.end >= e.start, { message: 'La date de fin précède le début', path: ['end'] });

export const articleSchema = z.object({
  title: text(160).min(1, 'Titre requis'),
  excerpt: text(320).min(1, 'Chapeau requis'),
  body: z.string().max(100_000).default(''),
  cover: imageSchema.optional(),
  tags: list(10, 40),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.iso.date().optional(),
  seo: seoSchema,
  updatedAt: z.iso.datetime().optional(),
});

export const profileSchema = z.object({
  name: text(80).min(1),
  jobTitle: text(120).min(1),
  headline: text(200).min(1),
  /** Home page statement; *word* is set in italic. Falls back to the headline. */
  statement: optText(90),
  intro: text(600).min(1),
  bio: text(6000).min(1),
  location: text(120).min(1),
  email: z.email(),
  socials: z.array(linkSchema).max(10).default([]),
  cv: z.union([z.string().regex(MEDIA_FILE_RE), urlSchema]).optional(),
  photo: imageSchema.optional(),
  principles: z
    .array(z.object({ title: text(120).min(1), text: text(600).min(1) }))
    .max(8)
    .default([]),
  updatedAt: z.iso.datetime().optional(),
});

export const skillsSchema = z.object({
  groups: z
    .array(z.object({ name: text(80).min(1), description: optText(300), items: list(30, 60) }))
    .max(12),
  updatedAt: z.iso.datetime().optional(),
});

export const SEO_PAGES = ['home', 'projects', 'experience', 'about', 'articles', 'contact'] as const;

export const seoSettingsSchema = z.object({
  siteName: text(80).min(1),
  defaultDescription: text(170).min(1),
  defaultOgImage: imageRefSchema.optional(),
  pages: z.object(
    Object.fromEntries(SEO_PAGES.map((p) => [p, seoSchema])) as Record<
      (typeof SEO_PAGES)[number],
      typeof seoSchema
    >,
  ),
  updatedAt: z.iso.datetime().optional(),
});

export const mediaManifestSchema = z.object({
  items: z
    .array(
      z.object({
        file: z.union([imageRefSchema, z.string().regex(MEDIA_FILE_RE)]),
        alt: text(300).default(''),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        size: z.number().int().nonnegative().optional(),
        uploadedAt: z.iso.datetime().optional(),
      }),
    )
    .default([]),
});

export type Project = z.infer<typeof projectSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
export type MediaManifest = z.infer<typeof mediaManifestSchema>;
export type ImageRef = z.infer<typeof imageSchema>;

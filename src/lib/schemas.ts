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
export const MEDIA_VIDEO_RE = /^media\/[a-z0-9]+(?:-[a-z0-9]+)*\.(mp4|webm)$/;
export const MEDIA_FILE_RE = /^files\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;

export const imageRefSchema = z.string().regex(MEDIA_IMAGE_RE, 'Image de la médiathèque attendue');
export const videoRefSchema = z.string().regex(MEDIA_VIDEO_RE, 'Vidéo de la médiathèque attendue');

/** A link target in the site's settings: a section of the page (#projets) or an address. */
export const hrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^#[a-z0-9-]+$/.test(v) || urlSchema.safeParse(v).success, 'Section (#projets) ou lien http, https, mailto');

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

/** Colour of the project's poster (src/lib/poster.ts). Names kept from earlier designs so content stays valid. */
export const COVER_COLORS = ['vermillon', 'sapin', 'ardoise', 'ocre', 'prune', 'sable', 'nuit', 'menthe', 'rose', 'bleu-france'] as const;
/** Compositions of a poster without image (src/lib/poster.ts). */
export const POSTER_LAYOUTS = ['numeral', 'titre', 'grille', 'initiale', 'bandes', 'soleil', 'technos', 'dsfr'] as const;
/** Side of the poster on the page; « auto » alternates. */
export const COVER_VARIANTS = ['auto', 'texte-gauche', 'texte-droite', 'empile'] as const;
/** Motifs of an earlier design: still accepted so that published content stays valid, no longer shown. */
export const MOTIFS = ['feuille', 'courbe', 'arbre', 'spirale', 'onde', 'barres', 'noeud'] as const;

export const projectSchema = z.object({
  title: text(120).min(1, 'Titre requis'),
  summary: text(320).min(1, 'Résumé requis'),
  kind: optText(80),
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
    .object({
      color: z.enum(COVER_COLORS).default('sapin'),
      image: imageSchema.optional(),
      /** Composition of the poster when the project has no image or video; empty: chosen automatically. */
      poster: z.enum(POSTER_LAYOUTS).optional(),
      /** Earlier design (kept for compatibility, unused). */
      motif: z.enum(MOTIFS).optional(),
      /** A short video instead of (or with) the image: muted, looped. The image, if any, is its poster. */
      video: z.object({ src: videoRefSchema, alt: text(300) }).optional(),
      /** Which side the poster takes on the page; "auto" alternates. */
      variant: z.enum(COVER_VARIANTS).optional(),
    })
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
    /** Shown as a chapter of the path (with the current positions), the others in the full list. */
    featured: z.boolean().default(false),
    visible: z.boolean().default(true),
    order: z.number().int().min(0).max(9999).default(0),
    updatedAt: z.iso.datetime().optional(),
  })
  .refine((e) => !e.end || e.end >= e.start, { message: 'La date de fin précède le début', path: ['end'] });

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

/* ---------- The site: everything on the page that is not a project, a position or a skill ----------
   Every field is optional: content published before this block existed renders exactly as before
   (defaults in src/lib/site.ts). */
export const SECTION_IDS = ['projets', 'parcours', 'competences', 'a-propos', 'contact'] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export const AMBIANCES = ['braise', 'nuit', 'foret'] as const;

const buttonSchema = z.object({ label: text(40).min(1, 'Libellé requis'), href: hrefSchema });

export const siteSchema = z.object({
  hero: z
    .object({
      /** Small line above the name; default: the city and the current organisation. */
      kicker: optText(140),
      /** Name and role shown; default: those of the profile. */
      title: optText(80),
      role: optText(120),
      /** Presentation sentence; default: the profile's headline. */
      lead: optText(320),
      primary: buttonSchema.optional(),
      secondary: buttonSchema.optional(),
      /** An image or a short video shown in the introduction, as the first poster of the pile. */
      media: z.object({ src: z.union([imageRefSchema, videoRefSchema]), alt: text(300) }).optional(),
      hint: optText(120),
    })
    .default({}),
  /** The sections of the page, in order (the introduction always comes first). */
  sections: z
    .array(
      z.object({
        id: z.enum(SECTION_IDS),
        visible: z.boolean().default(true),
        /** Name in the navigation. */
        label: optText(30),
        /** Title of the section on the page. */
        title: optText(90),
        /** A sentence under the title. */
        intro: optText(400),
      }),
    )
    .max(SECTION_IDS.length)
    .optional(),
  projects: z
    .object({
      /** "mis-en-avant": the projects marked so (all of them if none is); "tous": every visible project, in order. */
      selection: z.enum(['tous', 'mis-en-avant']).default('mis-en-avant'),
      /** Most projects shown in large; the other visible projects are in the strip « Autres réalisations ». */
      max: z.number().int().min(1).max(24).default(4),
      othersTitle: optText(80),
    })
    .default({ selection: 'mis-en-avant', max: 4 }),
  journey: z
    .object({
      /** Positions told in full (current and highlighted first); the others in a list that opens. */
      chapters: z.number().int().min(1).max(8).default(3),
    })
    .default({ chapters: 3 }),
  about: z.object({ showPrinciples: z.boolean().default(true), principlesTitle: optText(80) }).default({ showPrinciples: true }),
  contact: z.object({ lead: optText(300), copyLabel: optText(40) }).default({}),
  appearance: z
    .object({
      ambiance: z.enum(AMBIANCES).default('braise'),
      /** Ambiance = colour of the introduction (cobalt, ink, green). "auto": posters that move (drag, tilt,
          titles that stretch); "svg": the same page, still. Values kept from earlier designs. */
      scene: z.enum(['auto', 'svg']).default('auto'),
    })
    .default({ ambiance: 'braise', scene: 'auto' }),
  updatedAt: z.iso.datetime().optional(),
});
export type Site = z.infer<typeof siteSchema>;

/** The public site is a single page. */
export const SEO_PAGES = ['home'] as const;

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
        file: z.union([imageRefSchema, videoRefSchema, z.string().regex(MEDIA_FILE_RE)]),
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
export type Profile = z.infer<typeof profileSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
export type MediaManifest = z.infer<typeof mediaManifestSchema>;
export type ImageRef = z.infer<typeof imageSchema>;

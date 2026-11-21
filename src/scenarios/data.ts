// TEST DATA ONLY — content scenarios used to check that the design holds whatever the content.
// Built in memory from the repository's seed and fictitious entries; never written to src/content or to
// Netlify Blobs. This module is only part of a build when CONTENT_SCENARIOS=1 (astro.config.mjs), i.e.
// for the browser tests: production builds contain neither the route nor this data.
import { seedSnapshot } from '../lib/seed';
import { experienceSchema, projectSchema, siteSchema } from '../lib/schemas';
import { type ExperienceEntry, type ProjectEntry, type SiteData, toSiteData } from '../lib/snapshot';

/** Test media: name → dimensions (files in tests/fixtures/scenarios/media). */
export const FIXTURE_MEDIA: Record<string, { width: number; height: number; type: string }> = {
  'media/paysage.webp': { width: 1600, height: 1000, type: 'image/webp' },
  'media/portrait.webp': { width: 900, height: 1400, type: 'image/webp' },
  'media/carre.webp': { width: 1000, height: 1000, type: 'image/webp' },
  'media/panorama.webp': { width: 2400, height: 800, type: 'image/webp' },
  'media/video-paysage.mp4': { width: 640, height: 360, type: 'video/mp4' },
  'media/video-portrait.mp4': { width: 360, height: 640, type: 'video/mp4' },
};

const COLORS = ['vermillon', 'sapin', 'ardoise', 'ocre', 'prune', 'sable'] as const;
const LOREM =
  "Projet de démonstration pour les tests de mise en page : il n'existe pas. Le texte est volontairement long, avec des accents (é, è, ê, à, ç, œ) et plusieurs phrases, pour vérifier que la composition reste juste quand une description dépasse ce que l'on attend.";

const project = (id: string, n: number, extra: Partial<Record<string, unknown>> = {}): ProjectEntry => ({
  id,
  ...projectSchema.parse({
    title: `Projet de test ${n}`,
    summary: `Réalisation fictive n° ${n}, utilisée uniquement par les tests de mise en page.`,
    kind: 'Application web · Test',
    category: n % 2 ? 'pro' : 'perso',
    organisation: n % 2 ? 'Organisation fictive' : undefined,
    period: { start: String(2015 + (n % 10)) },
    contributions: ['Première contribution fictive', 'Deuxième contribution fictive'],
    technologies: ['TypeScript', 'PostgreSQL'],
    cover: { color: COLORS[n % COLORS.length] },
    visible: true,
    order: n,
    ...extra,
  }),
});

const experience = (id: string, n: number, extra: Partial<Record<string, unknown>> = {}): ExperienceEntry => ({
  id,
  ...experienceSchema.parse({
    role: `Poste de test ${n}`,
    organisation: `Organisation fictive ${n}`,
    start: String(2010 + n),
    end: String(2011 + n),
    summary: `Expérience fictive n° ${n}, pour les tests de mise en page.`,
    responsibilities: ['Responsabilité fictive'],
    visible: true,
    order: n,
    ...extra,
  }),
});

const img = (src: string) => ({ src, alt: `Image de test (${src.split('/')[1]})` });

export const SCENARIOS: Record<string, { label: string; build: (base: SiteData) => SiteData }> = {
  a: {
    label: 'A — minimal : 1 projet, 1 expérience, aucun média',
    build: (b) => ({
      ...b,
      projects: [project('test-seul', 1, { summary: 'Un seul projet, sans image ni lien.' })],
      experiences: [experience('test-poste', 1, { end: undefined })],
      profile: { ...b.profile, principles: [], photo: undefined },
    }),
  },
  b: {
    label: 'B — normal : 4 projets, 3 expériences, images de formats différents',
    build: (b) => ({
      ...b,
      projects: [
        project('test-paysage', 1, { cover: { color: 'sapin', image: img('media/paysage.webp') }, links: [{ label: 'Voir le site', url: 'https://example.com/' }] }),
        project('test-portrait', 2, { cover: { color: 'prune', image: img('media/portrait.webp') } }),
        project('test-carre', 3, { cover: { color: 'ocre', image: img('media/carre.webp') } }),
        project('test-sans-image', 4, { cover: { color: 'ardoise' } }),
      ],
      experiences: [experience('t1', 1, { end: undefined }), experience('t2', 2), experience('t3', 3)],
    }),
  },
  c: {
    label: 'C — enrichi : 12 projets (5 mis en avant), 8 expériences, textes longs, vidéos',
    build: (b) => ({
      ...b,
      site: siteSchema.parse({ projects: { selection: 'mis-en-avant', max: 6 }, journey: { chapters: 3 } }),
      projects: Array.from({ length: 12 }, (_, i) => {
        const media = [
          { image: img('media/paysage.webp') },
          { image: img('media/portrait.webp') },
          { video: { src: 'media/video-paysage.mp4', alt: 'Vidéo de test, paysage' } },
          { video: { src: 'media/video-portrait.mp4', alt: 'Vidéo de test, portrait' }, image: img('media/portrait.webp') },
          { image: img('media/panorama.webp') },
          {},
        ][i % 6];
        return project(`test-${i + 1}`, i + 1, {
          featured: [0, 2, 3, 6, 9].includes(i),
          summary: LOREM,
          context: `${LOREM}\n\n${LOREM}`,
          technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'Python', 'Redis', 'Terraform', 'Grafana'],
          cover: { color: COLORS[i % 6], ...media },
          gallery: i === 0 ? [img('media/portrait.webp'), img('media/panorama.webp'), img('media/carre.webp')] : [],
          links: i % 3 ? [] : [{ label: 'Voir le site', url: 'https://example.com/' }, { label: 'Code source', url: 'https://example.com/code' }],
        });
      }),
      experiences: Array.from({ length: 8 }, (_, i) =>
        experience(`x-${i + 1}`, i + 1, { end: i === 0 ? undefined : String(2012 + i), featured: i === 4, summary: LOREM }),
      ),
    }),
  },
  d: {
    label: 'D — cas limites : titres très longs, accents, sans image ni lien, sections réordonnées et masquées, vidéo en accueil',
    build: (b) => ({
      ...b,
      site: siteSchema.parse({
        hero: {
          kicker: 'Île-de-France — Établissement public à caractère administratif',
          lead: 'Une accroche plus longue que d’habitude, avec des accents — « guillemets », œuvre, ça, être — pour vérifier la composition.',
          media: { src: 'media/video-paysage.mp4', alt: 'Vidéo de test en accueil' },
          primary: { label: 'Voir les réalisations', href: '#projets' },
        },
        sections: [
          { id: 'a-propos', label: 'Démarche', title: 'Ma démarche, en quelques mots' },
          { id: 'projets', label: 'Réalisations', title: 'Réalisations choisies' },
          { id: 'competences', visible: false },
          { id: 'parcours' },
          { id: 'contact', title: 'Écrivez-moi, je réponds à chaque message reçu, même tard.' },
        ],
        projects: { selection: 'mis-en-avant', max: 6, othersTitle: 'Et aussi' },
        appearance: { ambiance: 'nuit' },
      }),
      projects: [
        project('test-titre-long', 1, {
          title: 'Plateforme interministérielle de pilotage et de valorisation des données environnementales territoriales',
          featured: true,
          cover: { color: 'sapin' },
        }),
        project('test-accents', 2, { title: 'Œuvre, écoute & ça — Évaluation', featured: true, summary: 'Évaluer, écouter, accompagner : ça marche à Saint-Étienne comme à Besançon.', cover: { color: 'prune', image: img('media/carre.webp') } }),
        project('test-sans-rien', 3, { featured: true, kind: undefined, organisation: undefined, period: undefined, technologies: [], contributions: [], links: [], cover: { color: 'ocre' } }),
        project('test-masque', 4, { visible: false }),
        project('test-autre', 5, { cover: { color: 'vermillon', image: img('media/panorama.webp') } }),
      ].filter((p) => p.visible),
      experiences: [experience('d1', 1, { end: undefined, role: 'Responsable de la conception et de la mise en œuvre des systèmes d’information géographique', start: '2021-09' })],
      skills: { groups: [] },
    }),
  },
  e: {
    label: 'E — vide : aucun projet, aucune expérience',
    build: (b) => ({ ...b, projects: [], experiences: [], skills: { groups: [] } }),
  },
};

export function scenarioData(name: string): SiteData | undefined {
  const s = SCENARIOS[name];
  if (!s) return undefined;
  const base = toSiteData(seedSnapshot());
  const data = s.build(base);
  return { ...data, manifest: new Map(Object.entries(FIXTURE_MEDIA).map(([file, m]) => [file, { file: file as never, alt: '', width: m.width, height: m.height }])) };
}

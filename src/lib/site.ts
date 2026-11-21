// What the page shows, decided from the content alone: defaults for every setting left empty, the
// sections in their order (empty ones dropped, acts numbered), the projects that get a scene and the
// others, the positions told in full and the others. No component decides any of this on its own.
import type { ExperienceEntry, ProjectEntry, SiteData } from './snapshot';
import { type AMBIANCES, SECTION_IDS, type SectionId, type Site } from './schemas';
import { TINTS } from './tints';

export const SECTION_DEFAULTS: Record<SectionId, { label: string; title: string; act: string }> = {
  projets: { label: 'Projets', title: 'Projets', act: 'Exploration' },
  parcours: { label: 'Parcours', title: 'Parcours', act: 'Expertise' },
  competences: { label: 'Compétences', title: 'Compétences', act: 'Expertise' },
  'a-propos': { label: 'À propos', title: 'À propos', act: 'Approche' },
  contact: { label: 'Contact', title: 'Tirons le fil ensemble.', act: 'Contact' },
};

/** Ambiances: the light of the scene and the accent. */
export const AMBIANCE: Record<(typeof AMBIANCES)[number], { label: string; glow: string; contact: string; accent: string }> = {
  braise: { label: 'Braise — lumière chaude', glow: '#4b2a17', contact: '#5a2e17', accent: '#ff8a5c' },
  nuit: { label: 'Nuit — lumière froide, sans bleu électrique', glow: '#1e2532', contact: '#26303f', accent: '#f2b66b' },
  foret: { label: 'Forêt — lumière verte, sourde', glow: '#1b2d22', contact: '#22382a', accent: '#e9c46a' },
};

export interface ResolvedSection {
  id: SectionId;
  label: string;
  title: string;
  intro?: string;
  /** Number of the act ("02"); the introduction is 01. Skills share the act of the path when they follow it. */
  act: string;
  actName: string;
}

export interface Resolved {
  sections: ResolvedSection[];
  section: (id: SectionId) => ResolvedSection | undefined;
  hero: {
    kicker?: string;
    title: string;
    role: string;
    lead: string;
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
    media?: { src: string; alt: string };
    hint?: string;
  };
  /** Projects with a scene of their own, then the other visible projects (listed more briefly). */
  featured: ProjectEntry[];
  others: ProjectEntry[];
  othersTitle: string;
  /** Positions told in full, then the others. */
  chapters: ExperienceEntry[];
  rest: ExperienceEntry[];
  /** The threads of the scene: at least 3, at most 8, dyed in the colours of the projects shown. */
  threads: string[];
  ambiance: (typeof AMBIANCE)[keyof typeof AMBIANCE];
  site: Site;
}

const FALLBACK_THREADS = [TINTS.sable.thread, TINTS.ardoise.thread, TINTS.ocre.thread, TINTS.vermillon.thread, TINTS.sapin.thread, TINTS.prune.thread];

export function resolveSite(data: SiteData): Resolved {
  const { site, profile, projects, experiences, skills } = data;

  // Sections: the saved order, completed with any section the settings do not mention; contact last.
  const saved = (site.sections ?? []).filter((s, i, all) => all.findIndex((t) => t.id === s.id) === i);
  const order = [...saved, ...SECTION_IDS.filter((id) => !saved.some((s) => s.id === id)).map((id) => ({ id, visible: true }))];
  const contactFirst = order.findIndex((s) => s.id === 'contact');
  if (contactFirst >= 0) order.push(...order.splice(contactFirst, 1));
  const empty: Record<SectionId, boolean> = {
    projets: projects.length === 0,
    parcours: experiences.length === 0,
    competences: skills.groups.length === 0,
    'a-propos': !profile.intro && !profile.bio,
    contact: false,
  };
  const sections: ResolvedSection[] = [];
  let act = 1;
  let prev: SectionId | undefined;
  for (const s of order as { id: SectionId; visible?: boolean; label?: string; title?: string; intro?: string }[]) {
    if (s.visible === false || empty[s.id]) continue;
    const d = SECTION_DEFAULTS[s.id];
    // skills right after the path belong to the same act
    if (!(s.id === 'competences' && prev === 'parcours')) act++;
    sections.push({
      id: s.id,
      label: s.label || d.label,
      title: s.title || d.title,
      intro: s.intro || undefined,
      act: String(act).padStart(2, '0'),
      actName: d.act,
    });
    prev = s.id;
  }

  // Projects: the scenes, then the others.
  const pool = site.projects.selection === 'mis-en-avant' && projects.some((p) => p.featured) ? projects.filter((p) => p.featured) : projects;
  const featured = pool.slice(0, site.projects.max);
  const others = projects.filter((p) => !featured.includes(p));

  // Positions: current and highlighted ones first (in their order), up to the number of chapters.
  const key = (e: ExperienceEntry) => (!e.end ? 0 : e.featured ? 1 : 2);
  const ranked = [...experiences].sort((a, b) => key(a) - key(b) || a.order - b.order);
  const chapters = ranked.slice(0, site.journey.chapters).sort((a, b) => a.order - b.order);
  const rest = experiences.filter((e) => !chapters.includes(e));

  const current = experiences.find((e) => !e.end);
  const threads = featured.map((p) => TINTS[p.cover.color].thread).slice(0, 8);
  for (let i = 0; threads.length < 3; i++) threads.push(FALLBACK_THREADS[i % FALLBACK_THREADS.length]);

  const projectsVisible = sections.some((s) => s.id === 'projets');
  return {
    sections,
    section: (id) => sections.find((s) => s.id === id),
    hero: {
      kicker: site.hero.kicker ?? [profile.location, current?.organisation].filter(Boolean).join(' — '),
      title: site.hero.title || profile.name,
      role: site.hero.role || profile.jobTitle,
      lead: site.hero.lead || profile.headline,
      primary: site.hero.primary ?? (projectsVisible ? { label: 'Explorer les projets', href: '#projets' } : undefined),
      secondary: site.hero.secondary ?? { label: 'Me contacter', href: '#contact' },
      media: site.hero.media,
      hint: site.hero.hint,
    },
    featured,
    others,
    othersTitle: site.projects.othersTitle || 'Autres réalisations',
    chapters,
    rest,
    threads,
    ambiance: AMBIANCE[site.appearance.ambiance],
    site,
  };
}

// What the page shows, decided from the content alone: defaults for every setting left empty, the parts
// of the page in their order (empty ones dropped), the projects shown in large and the others, the
// positions listed first. No component decides any of this on its own.
//
// The page has four parts: the introduction, the projects, « à propos » and the contact. The path
// (parcours) and the skills are told inside « à propos »; they only stand as parts of their own when
// « à propos » is hidden or empty.
import type { ExperienceEntry, ProjectEntry, SiteData } from './snapshot';
import { type AMBIANCES, SECTION_IDS, type SectionId, type Site } from './schemas';
import { INK, PAPER } from './tints';

export const SECTION_DEFAULTS: Record<SectionId, { label: string; title: string }> = {
  projets: { label: 'Projets', title: 'Projets' },
  parcours: { label: 'Parcours', title: 'Parcours' },
  competences: { label: 'Compétences', title: 'Domaines' },
  'a-propos': { label: 'À propos', title: 'À propos' },
  contact: { label: 'Contact', title: 'Travaillons ensemble.' },
};

/** Ambiances: the colour of the introduction (values kept from earlier designs). */
export const AMBIANCE: Record<(typeof AMBIANCES)[number], { label: string; bg: string; ink: string }> = {
  braise: { label: 'Cobalt — bleu franc', bg: '#1f3bd6', ink: PAPER },
  nuit: { label: 'Encre — noir', bg: INK, ink: PAPER },
  foret: { label: 'Vert — vert profond', bg: '#0b7450', ink: PAPER },
};

export interface ResolvedSection {
  id: SectionId;
  label: string;
  title: string;
  intro?: string;
  /** Number in the navigation ("01"). */
  n: string;
  /** Parts told inside this one (« à propos » tells the path and the skills). */
  holds: SectionId[];
}

export interface Resolved {
  /** The parts of the page after the introduction, in order: what the navigation lists. */
  sections: ResolvedSection[];
  section: (id: SectionId) => ResolvedSection | undefined;
  /** Settings of a part, folded or not (its title and sentence). */
  settings: (id: SectionId) => { label: string; title: string; intro?: string };
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
  /** Projects shown in large, then the other visible projects (a strip of small posters). */
  featured: ProjectEntry[];
  others: ProjectEntry[];
  othersTitle: string;
  /** Positions listed first (current and highlighted), then the others. */
  chapters: ExperienceEntry[];
  rest: ExperienceEntry[];
  current?: ExperienceEntry;
  ambiance: (typeof AMBIANCE)[keyof typeof AMBIANCE];
  /** Posters that move (drag, tilt, titles that stretch); off: the same page, still. */
  motion: boolean;
  site: Site;
}

export function resolveSite(data: SiteData): Resolved {
  const { site, profile, projects, experiences, skills } = data;

  // Order: the saved one, completed with any section the settings do not mention; contact last.
  const saved = (site.sections ?? []).filter((s, i, all) => all.findIndex((t) => t.id === s.id) === i);
  const order = [...saved, ...SECTION_IDS.filter((id) => !saved.some((s) => s.id === id)).map((id) => ({ id, visible: true }))];
  const contactAt = order.findIndex((s) => s.id === 'contact');
  if (contactAt >= 0) order.push(...order.splice(contactAt, 1));
  const empty: Record<SectionId, boolean> = {
    projets: projects.length === 0,
    parcours: experiences.length === 0,
    competences: skills.groups.length === 0,
    'a-propos': !profile.intro && !profile.bio,
    contact: false,
  };
  type Saved = { id: SectionId; visible?: boolean; label?: string; title?: string; intro?: string };
  const shown = (order as Saved[]).filter((s) => s.visible !== false && !empty[s.id]);
  const settings = (id: SectionId) => {
    const s = (order as Saved[]).find((t) => t.id === id);
    const d = SECTION_DEFAULTS[id];
    return { label: s?.label || d.label, title: s?.title || d.title, intro: s?.intro || undefined };
  };

  // Folding: the path and the skills go inside « à propos »; without it, the skills inside the path.
  const host: SectionId | undefined = shown.some((s) => s.id === 'a-propos') ? 'a-propos' : shown.some((s) => s.id === 'parcours') ? 'parcours' : undefined;
  const folded = (id: SectionId) => host !== undefined && id !== host && (id === 'competences' || (id === 'parcours' && host === 'a-propos'));
  const sections: ResolvedSection[] = [];
  for (const s of shown) {
    if (folded(s.id)) continue;
    const holds = s.id === host ? shown.filter((t) => folded(t.id)).map((t) => t.id) : [];
    sections.push({ id: s.id, ...settings(s.id), n: String(sections.length + 1).padStart(2, '0'), holds });
  }

  // Projects: the marked ones (all if none is marked) up to the maximum, then the others.
  const pool = site.projects.selection === 'mis-en-avant' && projects.some((p) => p.featured) ? projects.filter((p) => p.featured) : projects;
  const featured = pool.slice(0, site.projects.max);
  const others = projects.filter((p) => !featured.includes(p));

  // Positions: current and highlighted ones first (in their order), up to the number set.
  const key = (e: ExperienceEntry) => (!e.end ? 0 : e.featured ? 1 : 2);
  const ranked = [...experiences].sort((a, b) => key(a) - key(b) || a.order - b.order);
  const chapters = ranked.slice(0, site.journey.chapters).sort((a, b) => a.order - b.order);
  const rest = experiences.filter((e) => !chapters.includes(e));
  const current = experiences.find((e) => !e.end);

  const projectsVisible = sections.some((s) => s.id === 'projets');
  return {
    sections,
    section: (id) => sections.find((s) => s.id === id),
    settings,
    hero: {
      kicker: site.hero.kicker ?? [profile.location, current?.organisation].filter(Boolean).join(' — '),
      title: site.hero.title || profile.name,
      role: site.hero.role || profile.jobTitle,
      lead: site.hero.lead || profile.headline,
      primary: site.hero.primary ?? (projectsVisible ? { label: 'Voir les projets', href: '#projets' } : undefined),
      secondary: site.hero.secondary ?? { label: 'Me contacter', href: '#contact' },
      media: site.hero.media,
      hint: site.hero.hint,
    },
    featured,
    others,
    othersTitle: site.projects.othersTitle || 'Autres réalisations',
    chapters,
    rest,
    current,
    ambiance: AMBIANCE[site.appearance.ambiance],
    motion: site.appearance.scene !== 'svg',
    site,
  };
}

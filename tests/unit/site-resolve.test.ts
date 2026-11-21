// The rules that decide what the page shows (src/lib/site.ts), and the compatibility of content published
// before the « site » block existed. No fixed number of projects or positions anywhere.
import { describe, expect, it } from 'vitest';
import { experienceSchema, projectSchema, siteSchema } from '../../src/lib/schemas';
import { seedSnapshot } from '../../src/lib/seed';
import { resolveSite } from '../../src/lib/site';
import { type SiteData, toSiteData } from '../../src/lib/snapshot';

const base = () => toSiteData(seedSnapshot());
const project = (n: number, extra: Record<string, unknown> = {}) => ({ id: `p-${n}`, ...projectSchema.parse({ title: `P ${n}`, summary: 's', category: 'pro', order: n, ...extra }) });
const experience = (n: number, extra: Record<string, unknown> = {}) => ({ id: `e-${n}`, ...experienceSchema.parse({ role: `R ${n}`, organisation: 'O', start: '2020', end: '2021', order: n, ...extra }) });
const withSite = (d: SiteData, site: unknown): SiteData => ({ ...d, site: siteSchema.parse(site) });

describe('content published before the « site » block', () => {
  it('renders with the defaults: four parts (path and skills inside « à propos »), the projects marked in large', () => {
    const d = base();
    expect(d.site).toEqual(siteSchema.parse({}));
    const r = resolveSite(d);
    expect(r.sections.map((s) => `${s.n} ${s.id}`)).toEqual(['01 projets', '02 a-propos', '03 contact']);
    expect(r.section('a-propos')?.holds).toEqual(['parcours', 'competences']);
    const marked = d.projects.filter((p) => p.featured);
    expect(r.featured.map((p) => p.id)).toEqual((marked.length ? marked : d.projects).slice(0, 4).map((p) => p.id));
    expect(r.featured.length + r.others.length).toBe(d.projects.length);
    expect(r.hero.title).toBe('Clément Plançon');
    expect(r.hero.primary?.href).toBe('#projets');
  });
});

describe('any number of projects', () => {
  it.each([0, 1, 3, 4, 6, 12, 30])('%i projects: at most "max" in large, the rest in the strip', (n) => {
    const d = { ...base(), projects: Array.from({ length: n }, (_, i) => project(i)) };
    const r = resolveSite(d);
    expect(r.featured.length).toBe(Math.min(n, 4));
    expect(r.featured.length + r.others.length).toBe(n);
    expect(r.sections.some((s) => s.id === 'projets')).toBe(n > 0);
    // no project: no button to an empty section
    if (n === 0) expect(r.hero.primary).toBeUndefined();
  });
  it('« mis en avant »: only those in large; none marked: the first ones, until some are; « tous »: in order', () => {
    const projects = Array.from({ length: 8 }, (_, i) => project(i, { featured: i === 2 || i === 5 }));
    const r = resolveSite(withSite({ ...base(), projects }, { projects: { selection: 'mis-en-avant' } }));
    expect(r.featured.map((p) => p.id)).toEqual(['p-2', 'p-5']);
    expect(r.others).toHaveLength(6);
    const none = resolveSite(withSite({ ...base(), projects: projects.map((p) => ({ ...p, featured: false })) }, { projects: { selection: 'mis-en-avant' } }));
    expect(none.featured).toHaveLength(4);
    const all = resolveSite(withSite({ ...base(), projects }, { projects: { selection: 'tous', max: 6 } }));
    expect(all.featured.map((p) => p.id)).toEqual(['p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5']);
  });
});

describe('any number of positions', () => {
  it.each([0, 1, 3, 8, 20])('%i positions: current and highlighted first as chapters, the rest in the list', (n) => {
    const experiences = Array.from({ length: n }, (_, i) => experience(i, i === n - 1 ? { end: undefined } : i === 1 ? { featured: true } : {}));
    const r = resolveSite({ ...base(), experiences });
    expect(r.chapters.length).toBe(Math.min(n, 3));
    expect(r.chapters.length + r.rest.length).toBe(n);
    if (n > 2) {
      expect(r.chapters.some((e) => !e.end)).toBe(true);
      expect(r.chapters.some((e) => e.featured)).toBe(true);
    }
    // the path is told inside « à propos »
    expect(r.section('a-propos')?.holds.includes('parcours')).toBe(n > 0);
  });
});

describe('sections', () => {
  it('follow the saved order, keep contact last, hide the ones switched off or empty, and renumber', () => {
    const d = { ...base(), skills: { groups: [] } };
    const r = resolveSite(
      withSite(d, {
        sections: [
          { id: 'contact', title: 'Écrire' },
          { id: 'a-propos', label: 'Démarche' },
          { id: 'projets' },
          { id: 'parcours', visible: false },
        ],
      }),
    );
    expect(r.sections.map((s) => `${s.n} ${s.id} ${s.label}`)).toEqual(['01 a-propos Démarche', '02 projets Projets', '03 contact Contact']);
    expect(r.section('a-propos')?.holds).toEqual([]);
    expect(r.section('contact')?.title).toBe('Écrire');
  });
  it('without « à propos », the path stands as a part of its own and tells the skills', () => {
    const r = resolveSite(withSite(base(), { sections: [{ id: 'a-propos', visible: false }] }));
    expect(r.sections.map((s) => s.id)).toEqual(['projets', 'parcours', 'contact']);
    expect(r.section('parcours')?.holds).toEqual(['competences']);
  });
  it('without « à propos » nor path, the skills stand alone', () => {
    const r = resolveSite(withSite({ ...base(), experiences: [] }, { sections: [{ id: 'a-propos', visible: false }] }));
    expect(r.sections.map((s) => s.id)).toEqual(['projets', 'competences', 'contact']);
  });
  it('« sobre » keeps the posters still', () => {
    expect(resolveSite(withSite(base(), { appearance: { scene: 'svg' } })).motion).toBe(false);
    expect(resolveSite(base()).motion).toBe(true);
  });
});

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
  it('renders with the defaults: every section, acts numbered, all projects as scenes', () => {
    const d = base();
    expect(d.site).toEqual(siteSchema.parse({}));
    const r = resolveSite(d);
    expect(r.sections.map((s) => `${s.act} ${s.id}`)).toEqual(['02 projets', '03 parcours', '03 competences', '04 a-propos', '05 contact']);
    expect(r.featured.map((p) => p.id)).toEqual(d.projects.map((p) => p.id));
    expect(r.others).toEqual([]);
    expect(r.hero.title).toBe('Clément Plançon');
    expect(r.hero.primary?.href).toBe('#projets');
  });
});

describe('any number of projects', () => {
  it.each([0, 1, 3, 4, 6, 12, 30])('%i projects: at most "max" scenes, the rest listed, threads between 3 and 8', (n) => {
    const d = { ...base(), projects: Array.from({ length: n }, (_, i) => project(i)) };
    const r = resolveSite(d);
    expect(r.featured.length).toBe(Math.min(n, 6));
    expect(r.featured.length + r.others.length).toBe(n);
    expect(r.threads.length).toBeGreaterThanOrEqual(3);
    expect(r.threads.length).toBeLessThanOrEqual(8);
    expect(r.sections.some((s) => s.id === 'projets')).toBe(n > 0);
    // no project: no button to an empty section
    if (n === 0) expect(r.hero.primary).toBeUndefined();
  });
  it('« mis en avant »: only those get a scene; none marked: all of them, until some are', () => {
    const projects = Array.from({ length: 8 }, (_, i) => project(i, { featured: i === 2 || i === 5 }));
    const r = resolveSite(withSite({ ...base(), projects }, { projects: { selection: 'mis-en-avant' } }));
    expect(r.featured.map((p) => p.id)).toEqual(['p-2', 'p-5']);
    expect(r.others).toHaveLength(6);
    const none = resolveSite(withSite({ ...base(), projects: projects.map((p) => ({ ...p, featured: false })) }, { projects: { selection: 'mis-en-avant' } }));
    expect(none.featured).toHaveLength(6);
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
    expect(r.sections.some((s) => s.id === 'parcours')).toBe(n > 0);
  });
});

describe('sections', () => {
  it('follow the saved order, keep contact last, hide the ones switched off or empty, and renumber the acts', () => {
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
    expect(r.sections.map((s) => `${s.act} ${s.id} ${s.label}`)).toEqual(['02 a-propos Démarche', '03 projets Projets', '04 contact Contact']);
    expect(r.section('contact')?.title).toBe('Écrire');
  });
});

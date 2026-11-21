// Rules of the one-page site that a browser test cannot check: Netlify redirects of the former
// pages, the contrast of the project tints, and the grouping of technologies on the plates.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MOTIFS, motif, motifOf, tangle } from '../../src/lib/threads';
import { BACKGROUNDS, TINTS } from '../../src/lib/tints';

const redirects = [...readFileSync('netlify.toml', 'utf8').matchAll(/from = "([^"]+)"\s+to = "([^"]+)"\s+status = (\d+)/g)].map(([, from, to, status]) => ({ from, to, status: Number(status) }));
const target = (path: string) => {
  for (const r of redirects) {
    const pattern = new RegExp(`^${r.from.replace(/[.]/g, '\\.').replace(/:slug/, '(?<slug>[^/]+)').replace(/\*$/, '.*')}$`);
    const m = path.match(pattern);
    if (m) return { to: r.to.replace(':slug', m.groups?.slug ?? ''), status: r.status };
  }
  return null;
};

describe('former pages point to their section of the single page', () => {
  it.each([
    ['/projets/bercy-vert/', '/#projet-bercy-vert'],
    ['/projets/datametre', '/#projet-datametre'],
    ['/projets/', '/#projets'],
    ['/parcours/', '/#parcours'],
    ['/a-propos/', '/#a-propos'],
    ['/contact/', '/#contact'],
    ['/articles/un-article/', '/'],
  ])('%s → %s (301)', (from, to) => {
    expect(target(from)).toEqual({ to, status: 301 });
  });
  it('leaves the admin alone', () => {
    expect(target('/admin/')).toBeNull();
  });
});

describe('project tints', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  it.each(Object.entries(TINTS))('%s reads as text on both themes (WCAG AA)', (_, t) => {
    expect(ratio(t.dark, BACKGROUNDS.dark)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.light, BACKGROUNDS.light)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('threads', () => {
  it('each motif is a regular thread of the requested number of points', () => {
    for (const m of MOTIFS) {
      const pts = motif(m, 200, 1.5);
      expect(pts).toHaveLength(200);
      expect(pts.flat().every(Number.isFinite)).toBe(true);
      // evenly spaced: no step is more than twice the mean step
      const steps = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]));
      const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
      expect(Math.max(...steps)).toBeLessThan(mean * 2);
    }
  });
  it('the published projects keep their motifs; a new project gets the default; a chosen motif wins', () => {
    expect(motifOf('datametre')).toBe('barres');
    expect(motifOf('un-nouveau-projet')).toBe('noeud');
    expect(motifOf('datametre', 'onde')).toBe('onde');
    expect(motifOf('datametre', 'inconnu')).toBe('barres');
  });
  it('the tangle has open ends, left and right', () => {
    const t = tangle(0, 6, 200);
    expect(t[0][0]).toBeLessThan(-2);
    expect(t[199][0]).toBeGreaterThan(2);
  });
});

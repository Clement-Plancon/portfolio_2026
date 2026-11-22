// Rules of the one-page site that a browser test cannot check: Netlify redirects of the former
// pages, the contrast of the project tints, and the grouping of technologies on the plates.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { displaySize, gridCells, lineSize, posterLayout, seed, tilt, titleLines } from '../../src/lib/poster';
import { AMBIANCE } from '../../src/lib/site';
import { INK, PAPER, TINTS } from '../../src/lib/tints';

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

describe('colours', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  it.each(Object.entries(TINTS))('the text of a %s poster reads on it (WCAG AA)', (_, t) => {
    expect(ratio(t.ink, t.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.alt, t.bg)).toBeGreaterThanOrEqual(3);
  });
  it.each(Object.entries(AMBIANCE))('the introduction in %s reads (WCAG AA)', (_, a) => {
    expect(ratio(a.ink, a.bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('ink on paper, ink on vermilion, paper on ink', () => {
    expect(ratio(INK, PAPER)).toBeGreaterThanOrEqual(7);
    expect(ratio(INK, '#ff4b2b')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#b9b7b0', INK)).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#4a4945', PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#c4301a', PAPER)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('posters', () => {
  it('a project with an image or a video is a picture poster, whatever the composition chosen', () => {
    expect(posterLayout('numeral', 0, true)).toBe('media');
  });
  it('the composition chosen wins; an empty or unknown one varies with the position', () => {
    expect(posterLayout('grille', 0, false)).toBe('grille');
    expect([0, 1, 2].map((i) => posterLayout(undefined, i, false))).toEqual(['numeral', 'titre', 'grille']);
    expect(posterLayout('inconnu', 3, false)).toBe('numeral');
  });
  it('the compositions added later are used only when chosen, so « Automatique » keeps its cycle', () => {
    for (const l of ['initiale', 'bandes', 'soleil', 'technos', 'dsfr']) expect(posterLayout(l, 0, false)).toBe(l);
    expect(Array.from({ length: 9 }, (_, i) => posterLayout(undefined, i, false))).not.toContain('dsfr');
    expect(posterLayout('dsfr', 0, true)).toBe('media');
  });
  it('a project keeps its shapes and tilt between renders', () => {
    expect(gridCells('datametre')).toEqual(gridCells('datametre'));
    expect(gridCells('datametre')).toHaveLength(12);
    expect(tilt('datametre')).toBe(tilt('datametre'));
    expect(Math.abs(tilt('x', 6))).toBeLessThanOrEqual(6);
    expect(seed('a')).not.toBe(seed('b'));
  });
  it('a long word gets smaller, never wider than the poster', () => {
    expect(lineSize('SAFEPING')).toBeLessThan(lineSize('BERCY'));
    const longest = 'ANTICONSTITUTIONNELLEMENT';
    expect(lineSize(longest) * longest.length * 0.9).toBeLessThanOrEqual(84.5);
  });
  it('a display title: the longest word fits the width, a long title keeps to about three lines', () => {
    expect(displaySize('Projets', 15, 80)).toBeCloseTo(80 / (7 * 0.86), 1);
    const long = displaySize('Écrivez-moi, je réponds à chaque message reçu, même tard.', 12, 86);
    expect(long).toBeLessThan(6);
  });
  it('a title is set in at most five lines, short words joined', () => {
    expect(titleLines('Saisines de la Cour des comptes')).toEqual(['SAISINES', 'DE LA COUR', 'DES COMPTES']);
    expect(titleLines('un deux trois quatre cinq six sept huit').length).toBeLessThanOrEqual(5);
  });
});

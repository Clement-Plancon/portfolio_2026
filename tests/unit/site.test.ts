// Rules of the one-page site that a browser test cannot check: Netlify redirects of the former
// pages, and the contrast of the project papers.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STOCKS } from '../../src/lib/stocks';

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

describe('project papers', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  it.each(Object.entries(STOCKS))('%s carries body text at WCAG AA contrast', (_, s) => {
    expect(ratio(s.paper, s.ink)).toBeGreaterThanOrEqual(4.5);
  });
});

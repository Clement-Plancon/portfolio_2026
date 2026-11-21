// « Affiches »: every project is shown as a poster composed from its own data (number, title, kind,
// year, technologies) in its colour, with its real image or video when there is one. A few
// compositions, chosen from the content, make a varied set without drawing anything by hand.
import { POSTER_LAYOUTS } from './schemas';

export { POSTER_LAYOUTS };
export type PosterLayout = (typeof POSTER_LAYOUTS)[number] | 'media';

export const POSTER_LABELS: Record<(typeof POSTER_LAYOUTS)[number], string> = {
  numeral: 'Numéro — le numéro du projet en très grand',
  titre: 'Titre — le titre en capitales, sur toute la hauteur',
  grille: 'Grille — des formes géométriques en modules',
};

/** A stable number in [0, 1) from a string, so a project keeps its composition and tilt between renders. */
export function seed(id: string): number {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

/** The composition: the image or video if there is one, else the one chosen, else by position. */
export function posterLayout(chosen: string | undefined, index: number, hasMedia: boolean): PosterLayout {
  if (hasMedia) return 'media';
  if (chosen && (POSTER_LAYOUTS as readonly string[]).includes(chosen)) return chosen as PosterLayout;
  return POSTER_LAYOUTS[index % POSTER_LAYOUTS.length];
}

/**
 * Font size (in % of the poster's width, cqi) of one line of capitals set across the poster, so that
 * any title, short or long, fills the width without overflowing: long words get smaller, never cut.
 * Archivo expanded capitals are about 0.9 em wide on average.
 */
export function lineSize(line: string, max = 34, width = 84): number {
  return Math.round(Math.min(max, width / (Math.max(3, [...line].length) * 0.9)) * 10) / 10;
}

/** A title in lines of capitals for the « titre » layout: short words joined, at most 5 lines. */
export function titleLines(title: string, maxLines = 5): string[] {
  const words = title.toLocaleUpperCase('fr').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  // a short word (de, la, des…) goes with the next one, never alone on a line
  let pending: string[] = [];
  for (const w of words) {
    if ([...w].length <= 3) pending.push(w);
    else {
      lines.push([...pending, w].join(' '));
      pending = [];
    }
  }
  if (pending.length) {
    if (lines.length) lines[lines.length - 1] += ` ${pending.join(' ')}`;
    else lines.push(pending.join(' '));
  }
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')];
}

/** The modules of the « grille » layout: 3 × 4 cells, each a shape, derived from the project's id. */
export const SHAPES = ['disc', 'half-t', 'half-l', 'quarter', 'square', 'empty', 'ring', 'bar'] as const;
export function gridCells(id: string, n = 12): (typeof SHAPES)[number][] {
  const out: (typeof SHAPES)[number][] = [];
  let s = seed(id);
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280 / 233280;
    out.push(SHAPES[Math.floor(s * SHAPES.length)]);
  }
  return out;
}

/** Tilt of a poster in degrees, in [-max, max], stable for a project. */
export const tilt = (id: string, max = 6) => Math.round((seed(`${id}:tilt`) * 2 - 1) * max * 10) / 10;

/**
 * Font size (in vw) of a title in wide capitals across the page, so that its longest word fits the
 * width and the whole title takes about three lines: a short title is huge, a long one smaller, never
 * cut. Archivo at 125 %, 800: capitals ≈ 0.86 em.
 */
export function displaySize(text: string, max: number, width = 88, em = 0.86, lines = 3): number {
  const longest = Math.max(3, ...text.split(/\s+/).map((w) => [...w].length));
  // a long title keeps to about `lines` lines
  const total = [...text].length;
  return Math.round(Math.min(max, width / (longest * em), (lines * width) / (total * em)) * 100) / 100;
}

/**
 * The lines of the « titre » layout, repeated until they fill the poster's height (about 100 % of its
 * width is free between the top and the foot): a typographic poster, never an empty field.
 */
export function titleFill(title: string): { text: string; size: number; echo: boolean }[] {
  const lines = titleLines(title).map((text) => ({ text, size: lineSize(text, 30) }));
  const out: { text: string; size: number; echo: boolean }[] = [];
  let h = 0;
  for (let i = 0; h < 96 && i < 24; i++) {
    const l = lines[i % lines.length];
    if (h + l.size * 0.86 > 104) break;
    out.push({ ...l, echo: i >= lines.length });
    h += l.size * 0.86 + 1;
  }
  return out;
}

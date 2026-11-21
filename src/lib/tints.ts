// Each project has a tint (cover.color in the content): a quiet accent used for its number and the
// lines of its plate (the drawing of its stack). One value per theme, both at WCAG AA contrast
// for text (≥ 4.5:1) on the page background of that theme. The names are kept from earlier designs
// so that published content stays valid.
import type { COVER_COLORS } from './schemas';

export type Tint = (typeof COVER_COLORS)[number];

/** Page backgrounds the tints are checked against (src/styles/global.css). */
export const BACKGROUNDS = { dark: '#12110e', light: '#f2eee5' } as const;

/** `thread`: the dye of the project's thread in the scene (deeper than the text tints, it takes the light). */
export const TINTS: Record<Tint, { label: string; dark: string; light: string; thread: string }> = {
  vermillon: { label: 'Vermillon', dark: '#f08a6c', light: '#a8391d', thread: '#e0532f' },
  sapin: { label: 'Vert sapin', dark: '#8cc4a3', light: '#2c6248', thread: '#3f9a6c' },
  ardoise: { label: 'Ardoise', dark: '#a9b9cf', light: '#44546b', thread: '#6383b3' },
  ocre: { label: 'Ocre', dark: '#e0b25a', light: '#7f5510', thread: '#dea235' },
  prune: { label: 'Prune', dark: '#d79bbb', light: '#7c3559', thread: '#b0507f' },
  sable: { label: 'Sable', dark: '#d8c29a', light: '#71603f', thread: '#d4bd8f' },
};

/** Inline custom properties for an element that carries a project's tint. */
export const tintStyle = (t: Tint) => `--tint-d:${TINTS[t].dark};--tint-l:${TINTS[t].light}`;

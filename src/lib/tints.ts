// Each project has a tint (cover.color in the content): a quiet accent used for its number and the
// lines of its plate (the drawing of its stack). One value per theme, both at WCAG AA contrast
// for text (≥ 4.5:1) on the page background of that theme. The names are kept from earlier designs
// so that published content stays valid.
import type { COVER_COLORS } from './schemas';

export type Tint = (typeof COVER_COLORS)[number];

/** Page backgrounds the tints are checked against (src/styles/global.css). */
export const BACKGROUNDS = { dark: '#12110e', light: '#f2eee5' } as const;

export const TINTS: Record<Tint, { label: string; dark: string; light: string }> = {
  vermillon: { label: 'Vermillon', dark: '#f08a6c', light: '#a8391d' },
  sapin: { label: 'Vert sapin', dark: '#8cc4a3', light: '#2c6248' },
  ardoise: { label: 'Ardoise', dark: '#a9b9cf', light: '#44546b' },
  ocre: { label: 'Ocre', dark: '#e0b25a', light: '#7f5510' },
  prune: { label: 'Prune', dark: '#d79bbb', light: '#7c3559' },
  sable: { label: 'Sable', dark: '#d8c29a', light: '#71603f' },
};

/** Inline custom properties for an element that carries a project's tint. */
export const tintStyle = (t: Tint) => `--tint-d:${TINTS[t].dark};--tint-l:${TINTS[t].light}`;

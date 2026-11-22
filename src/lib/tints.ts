// Each project has a colour (cover.color in the content): the field of its poster, with the ink that
// reads on it (WCAG AA for text, ≥ 4.5:1, tested) and a second colour for its large figures and
// shapes (≥ 3:1, the rule for large text, tested).
// The names are kept from earlier designs so that published content stays valid.
import type { COVER_COLORS } from './schemas';

export type Tint = (typeof COVER_COLORS)[number];

export const PAPER = '#f5f4f0';
export const INK = '#111111';

export const TINTS: Record<Tint, { label: string; bg: string; ink: string; alt: string }> = {
  vermillon: { label: 'Vermillon', bg: '#ff4b2b', ink: INK, alt: PAPER },
  sapin: { label: 'Vert', bg: '#0b7450', ink: PAPER, alt: '#f4b32c' },
  ardoise: { label: 'Bleu ciel', bg: '#9db2ff', ink: INK, alt: '#1f3bd6' },
  ocre: { label: 'Ocre', bg: '#f4b32c', ink: INK, alt: '#1f3bd6' },
  prune: { label: 'Prune', bg: '#8e1f55', ink: PAPER, alt: '#f4b32c' },
  sable: { label: 'Sable', bg: '#eadbc1', ink: INK, alt: '#1f3bd6' },
  nuit: { label: 'Nuit', bg: '#161616', ink: PAPER, alt: '#ff4b2b' },
  menthe: { label: 'Menthe', bg: '#b8f2d4', ink: INK, alt: '#0b6b4a' },
  rose: { label: 'Rose', bg: '#ffa8c8', ink: INK, alt: '#1f3bd6' },
  // The DSFR's « bleu France » (blue-france-sun-113) with its light blue (blue-france-main-525… lightened) for large figures.
  'bleu-france': { label: 'Bleu France', bg: '#000091', ink: '#ffffff', alt: '#8585f6' },
};

/** Inline custom properties for an element in a project's colours. */
export const tintStyle = (t: Tint) => `--p-bg:${TINTS[t].bg};--p-ink:${TINTS[t].ink};--p-alt:${TINTS[t].alt}`;

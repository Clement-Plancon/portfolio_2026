// Paper stocks: each project is printed on its own coloured paper (cover.color in the content).
// Text colours are chosen for WCAG AA contrast at body size (≥ 4.5:1).
import type { COVER_COLORS } from './schemas';

export type Stock = (typeof COVER_COLORS)[number];

export const STOCKS: Record<Stock, { label: string; paper: string; ink: string }> = {
  vermillon: { label: 'Vermillon', paper: '#e8553a', ink: '#15140f' },
  sapin: { label: 'Vert sapin', paper: '#1f4a3b', ink: '#f3f1ec' },
  ardoise: { label: 'Ardoise', paper: '#39424e', ink: '#f3f1ec' },
  ocre: { label: 'Ocre', paper: '#d69a2e', ink: '#15140f' },
  prune: { label: 'Prune', paper: '#56283f', ink: '#f3f1ec' },
  sable: { label: 'Sable', paper: '#e2d4b8', ink: '#15140f' },
};

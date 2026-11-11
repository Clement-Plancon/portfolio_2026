// Line identity of a project: code (badge letters) and colour.
import type { Project } from './schemas';

const SMALL_WORDS = new Set(['de', 'des', 'du', 'la', 'le', 'les', 'et', 'd', 'l', 'a', 'au', 'aux']);

/** "Saisines de la Cour des comptes" -> "SC", "SafePing" -> "SP", "Datametre" -> "DA". */
export function lineCode(p: Pick<Project, 'title' | 'code'>): string {
  if (p.code) return p.code;
  const words = p.title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w && !SMALL_WORDS.has(w.toLowerCase()));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const w = words[0] ?? '?';
  const caps = w.slice(1).match(/[A-Z]/);
  return (w[0] + (caps ? caps[0] : (w[1] ?? ''))).toUpperCase();
}

/** Inline style setting the line colour variables for a project. */
export function lineStyle(color: Project['cover']['color']): string {
  return `--line: var(--line-${color}); --line-text: var(--line-${color}-text);`;
}

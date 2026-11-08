// Markdown -> HTML with no raw HTML and only safe link targets.
// The same function renders articles at build time and the live preview in the admin,
// so what the admin shows is what the site publishes.
import { Marked } from 'marked';

const SAFE_URL = /^(https?:|mailto:|\/|#|\.\/|\.\.\/)/i;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function safeUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  // Strip control chars/whitespace browsers ignore before checking the scheme (e.g. "java\tscript:").
  const probe = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, '');
  return SAFE_URL.test(probe) ? trimmed : null;
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    // Raw HTML blocks and inline HTML are shown as text, never interpreted.
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const url = safeUrl(href);
      if (!url) return inner;
      const external = /^https?:/i.test(url);
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      const rel = external ? ' rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(url)}"${t}${rel}>${inner}</a>`;
    },
    image({ href, title, text }) {
      const url = safeUrl(href);
      if (!url) return escapeHtml(text);
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${t} loading="lazy" decoding="async">`;
    },
  },
});

export function renderMarkdown(md: string): string {
  return marked.parse(md ?? '', { async: false }) as string;
}

/** Rough reading time in minutes (230 words per minute). */
export function readingTime(md: string): number {
  const words = (md ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

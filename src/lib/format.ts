const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** "2023-04" -> "avr. 2023", "2023" -> "2023". */
export function formatYearMonth(v?: string): string {
  if (!v) return '';
  const [y, m] = v.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

/** Period label: "2023", "2023 — 2024", "2024 — aujourd'hui". */
export function formatPeriod(start?: string, end?: string, ongoing = false): string {
  if (!start) return ongoing ? 'En cours' : '';
  const s = formatYearMonth(start);
  if (end) return end === start ? s : `${s} — ${formatYearMonth(end)}`;
  return ongoing ? `${s} — aujourd'hui` : s;
}

export function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text, then sets *word* in italic (the word that "develops"). Safe for set:html. */
export function emphasis(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPES[c]).replace(/\*([^*]+)\*/g, '<em class="develop">$1</em>');
}

/** Same text without the markers, for titles and metadata. */
export function plain(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

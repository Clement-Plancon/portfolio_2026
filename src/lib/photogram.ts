// Cyanotype "prints" for projects, generated at build time as plain SVG.
// A photogram is what you get by laying objects on light-sensitive paper: here the objects are drawn
// shapes chosen per project, so the visual is honest — a presentation image, never a fake screenshot.
import type { COVER_COLORS, PICTOGRAMS } from './schemas';

type Tone = (typeof COVER_COLORS)[number];
type Objects = (typeof PICTOGRAMS)[number];

/** Toning of the print (the stored names come from earlier designs; the labels are what the admin shows). */
export const TONES: Record<Tone, { label: string; deep: string }> = {
  ardoise: { label: 'Bleu de Prusse', deep: '#0f2a68' },
  sapin: { label: 'Bleu-vert', deep: '#0d3a4c' },
  sable: { label: 'Ardoise', deep: '#1c3152' },
  prune: { label: 'Indigo', deep: '#23205a' },
  ocre: { label: 'Virage au thé', deep: '#2e2638' },
  vermillon: { label: 'Virage au vin', deep: '#36203f' },
};

export const PHOTOGRAM_LABELS: Record<Objects, string> = {
  feuille: 'Fougères',
  jauge: 'Règles graduées',
  dossier: 'Enveloppes et trombone',
  radar: 'Loupe et coupures de presse',
  alerte: 'Clé et fil',
  graphique: 'Plaques de verre',
  code: 'Bande perforée',
  mobile: 'Cartes superposées',
  equipe: 'Lentilles',
};

const ORDER: Objects[] = ['feuille', 'dossier', 'jauge', 'radar', 'alerte', 'graphique', 'code', 'mobile', 'equipe'];

/** Small deterministic PRNG: the same project always gets the same print. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str: string): number {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const f1 = (n: number) => Math.round(n * 10) / 10;
const pt = (x: number, y: number) => `${f1(x)} ${f1(y)}`;

/** Translucent paper objects: overlaps get whiter, as on a real print. */
function generate(kind: Objects, r: () => number): string {
  const o: string[] = [];
  const W = '#fff';
  switch (kind) {
    case 'feuille': {
      // Fern fronds: a curving stem with alternate, tapering leaflets (Anna Atkins' cyanotypes of ferns).
      const fronds = [
        { x: 175, len: 440, bend: -0.7, w: 56 },
        { x: 235, len: 370, bend: 0.75, w: 48 },
        { x: 205, len: 190, bend: 0.1, w: 28 },
      ];
      for (const f of fronds) {
        const at = (t: number): [number, number] => [f.x + Math.sin(t * 1.7) * f.bend * 70 + t * t * t * f.bend * 60, 492 - t * f.len];
        const spine = Array.from({ length: 61 }, (_, i) => at(i / 60));
        o.push(`<path d="M${spine.map(([x, y]) => pt(x, y)).join('L')}" stroke="${W}" stroke-width="2.4" fill="none"/>`);
        const n = 34;
        for (let i = 3; i < n; i++) {
          for (const side of [-1, 1]) {
            const t = (i + (side > 0 ? 0.5 : 0)) / n; // alternate leaflets
            const [x, y] = at(t * 0.97);
            const len = (f.w * Math.sin(Math.min(1, (1 - t) * 1.25) * Math.PI * 0.6) + 3) * (0.85 + r() * 0.3);
            const a = (side * (72 - t * 40) + (r() - 0.5) * 10 + f.bend * 12) * (Math.PI / 180);
            const ex = x + Math.sin(a) * len;
            const ey = y - Math.cos(a) * len * 0.75;
            const nx = Math.cos(a) * len * 0.17;
            const ny = Math.sin(a) * len * 0.17;
            o.push(`<path d="M${pt(x, y)}Q${pt((x + ex) / 2 + nx, (y + ey) / 2 + ny)} ${pt(ex, ey)}Q${pt((x + ex) / 2 - nx, (y + ey) / 2 - ny)} ${pt(x, y)}Z" fill="${W}" opacity=".8"/>`);
          }
        }
      }
      break;
    }
    case 'dossier': {
      for (let i = 0; i < 5; i++) {
        const w = 210 + r() * 60;
        const h = 132 + r() * 16;
        const x = 70 + r() * 90;
        const y = 50 + i * 74 + r() * 18;
        const a = -16 + r() * 32;
        o.push(`<g transform="rotate(${f1(a)} ${f1(x + w / 2)} ${f1(y + h / 2)})" opacity=".42"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${W}"/><path d="M${pt(x, y)}L${pt(x + w / 2, y + h * 0.56)}L${pt(x + w, y)}" stroke="#000" stroke-opacity=".28" stroke-width="2" fill="none"/></g>`);
      }
      o.push(`<path d="M300 66v152a27 27 0 0 1-54 0V88a17 17 0 0 1 34 0v122" stroke="${W}" stroke-width="5" fill="none" stroke-linecap="round"/>`);
      o.push(`<path d="M40 470C120 430 90 380 170 360S260 300 360 330" stroke="${W}" stroke-width="2" fill="none" opacity=".8"/>`);
      break;
    }
    case 'jauge': {
      for (let i = 0; i < 4; i++) {
        const y = 92 + i * 96;
        const a = -22 + i * 13 + r() * 6;
        let ticks = '';
        for (let k = 0; k < 36; k++) ticks += `<rect x="${32 + k * 10.6}" y="${y}" width="2" height="${k % 5 ? 11 : 24}" fill="#000" opacity=".4"/>`;
        o.push(`<g transform="rotate(${f1(a)} 200 ${y})" opacity=".55"><rect x="18" y="${y}" width="400" height="48" fill="${W}"/>${ticks}</g>`);
      }
      break;
    }
    case 'radar': {
      for (let i = 0; i < 7; i++) {
        const y = 36 + i * 66 + r() * 10;
        const x = 22 + r() * 50;
        const w = 230 + r() * 110;
        let lines = '';
        for (let l = 0; l < 4; l++) lines += `<rect x="${f1(x + 10)}" y="${f1(y + 8 + l * 9)}" width="${f1(w - 20 - r() * 60)}" height="3" fill="#000" opacity=".22"/>`;
        o.push(`<g transform="rotate(${f1(-5 + r() * 10)} 200 ${f1(y)})" opacity=".4"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="48" fill="${W}"/>${lines}</g>`);
      }
      o.push(`<circle cx="232" cy="214" r="108" fill="${W}" opacity=".2"/><circle cx="232" cy="214" r="108" stroke="${W}" stroke-width="15" fill="none"/>`);
      o.push(`<path d="M310 292l66 104" stroke="${W}" stroke-width="30" stroke-linecap="round"/>`);
      break;
    }
    case 'alerte': {
      o.push(`<circle cx="158" cy="146" r="58" stroke="${W}" stroke-width="7" fill="none"/>`);
      o.push(`<g transform="rotate(32 210 250)"><circle cx="210" cy="190" r="45" fill="${W}"/><circle cx="210" cy="190" r="15" fill="#000" opacity=".55"/><rect x="200" y="230" width="20" height="200" fill="${W}"/><rect x="220" y="360" width="34" height="14" fill="${W}"/><rect x="220" y="392" width="24" height="14" fill="${W}"/></g>`);
      o.push(`<path d="M24 478C120 390 50 300 158 204" stroke="${W}" stroke-width="2" fill="none" opacity=".75"/>`);
      break;
    }
    case 'graphique': {
      for (let i = 0; i < 6; i++) {
        const h = 120 + r() * 260;
        const x = 46 + i * 54;
        o.push(`<rect x="${x}" y="${f1(460 - h)}" width="64" height="${f1(h)}" fill="${W}" opacity=".36" transform="rotate(${f1(-3 + r() * 6)} ${x + 32} 460)"/>`);
      }
      o.push(`<path d="M30 300C110 250 150 330 210 230S330 140 380 90" stroke="${W}" stroke-width="2.5" fill="none"/>`);
      break;
    }
    case 'code': {
      for (let s = 0; s < 3; s++) {
        const y0 = 80 + s * 140;
        const a = -12 + s * 9 + r() * 4;
        let holes = '';
        for (let k = 0; k < 30; k++) {
          for (let row = 0; row < 5; row++) if (r() > 0.5) holes += `<circle cx="${30 + k * 13}" cy="${y0 + 12 + row * 11}" r="3.6" fill="#000" opacity=".5"/>`;
          holes += `<circle cx="${30 + k * 13}" cy="${y0 + 34}" r="1.6" fill="#000" opacity=".5"/>`;
        }
        o.push(`<g transform="rotate(${f1(a)} 200 ${y0})" opacity=".6"><rect x="10" y="${y0}" width="420" height="70" fill="${W}"/>${holes}</g>`);
      }
      break;
    }
    case 'mobile': {
      for (let i = 0; i < 4; i++) {
        const x = 90 + i * 34 + r() * 10;
        const y = 70 + i * 26;
        o.push(`<rect x="${f1(x)}" y="${y}" width="180" height="330" rx="26" fill="${W}" opacity=".3" transform="rotate(${f1(-10 + i * 6)} ${f1(x + 90)} ${y + 165})"/>`);
      }
      o.push(`<ellipse cx="110" cy="430" rx="46" ry="30" fill="${W}" opacity=".6"/>`);
      break;
    }
    case 'equipe': {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        o.push(`<circle cx="${f1(200 + Math.cos(a) * 92)}" cy="${f1(250 + Math.sin(a) * 92)}" r="${f1(74 + r() * 14)}" fill="${W}" opacity=".24"/>`);
      }
      o.push(`<circle cx="200" cy="250" r="48" stroke="${W}" stroke-width="3" fill="none"/>`);
      break;
    }
  }
  return o.join('');
}

/** Hand-brushed emulsion edge as a clip path in objectBoundingBox units (0..1). */
function brushedEdge(r: () => number): string {
  const p: [number, number][] = [];
  const noise = (n: number, amp: number) => {
    // value noise from a few random knots, smooth enough to read as a brush and not as pixels
    const knots = Array.from({ length: n + 1 }, () => r() * 2 - 1);
    return (t: number) => {
      const i = Math.min(n - 1, Math.floor(t * n));
      const u = t * n - i;
      const s = u * u * (3 - 2 * u);
      return (knots[i] * (1 - s) + knots[i + 1] * s) * amp;
    };
  };
  const top = noise(9, 0.01);
  const bottom = noise(9, 0.01);
  const left = noise(12, 0.012);
  const right = noise(12, 0.012);
  const N = 90;
  const fine = () => (r() - 0.5) * 0.004; // fibres of the paper
  // Dry-brush strokes: thin fingers of emulsion poking out of the coating, mostly on the brushed sides.
  const finger = (p: number, amp: number) => (r() < p ? amp * (0.3 + r() * 0.7) : 0);
  for (let i = 0; i <= N; i++) p.push([0.03 + (i / N) * 0.94, 0.03 + top(i / N) + fine() - finger(0.04, 0.012)]);
  for (let i = 1; i <= N; i++) p.push([0.97 + right(i / N) + fine() + finger(0.08, 0.028), 0.03 + (i / N) * 0.94]);
  for (let i = N - 1; i >= 0; i--) p.push([0.03 + (i / N) * 0.94, 0.97 + bottom(i / N) + fine() + finger(0.04, 0.012)]);
  for (let i = N - 1; i > 0; i--) p.push([0.03 + left(i / N) + fine() - finger(0.08, 0.028), 0.03 + (i / N) * 0.94]);
  const c = (v: number) => Math.min(1, Math.max(0, v)).toFixed(3);
  return `M${p.map(([x, y]) => `${c(x)} ${c(y)}`).join('L')}Z`;
}

export interface Photogram {
  /** Inner SVG markup for viewBox 0 0 400 500 (empty when the print shows a real capture). */
  objects: string;
  /** Clip path data (objectBoundingBox units). */
  edge: string;
  tone: string;
  kind: Objects;
}

export function photogram(slug: string, tone: Tone = 'ardoise', kind?: Objects): Photogram {
  const seed = hash(slug);
  const k = kind ?? ORDER[seed % ORDER.length];
  return { objects: generate(k, rng(seed)), edge: brushedEdge(rng(seed ^ 0x9e3779b9)), tone: TONES[tone]?.deep ?? TONES.ardoise.deep, kind: k };
}

// The threads: the visual language of the site. One thread per project, dyed in the project's tint.
// In the introduction they are tangled together (what is complex); scrolling unravels them; each
// project draws its thread into a motif of its own (an abstract sign of its domain, never a picture of
// the application); at the end they gather into one.
//
// This module is shared by the WebGL engine (src/scripts/scene/) and by the server, which draws the
// same shapes as SVG (shown before WebGL starts, and instead of it when WebGL is unavailable or motion
// is reduced). Coordinates are in a unit square ([-1, 1] on x and y, z for depth).

export const MOTIFS = ['feuille', 'courbe', 'arbre', 'spirale', 'onde', 'barres', 'noeud'] as const;
export type Motif = (typeof MOTIFS)[number];

export const MOTIF_LABELS: Record<Motif, string> = {
  feuille: 'Feuille — croissance, écologie',
  courbe: 'Courbe et seuil — indicateurs',
  arbre: 'Arborescence — orienter, trier',
  spirale: 'Spirale — collecter, synthétiser',
  onde: 'Onde — signal, alerte',
  barres: 'Barres — données chiffrées',
  noeud: 'Nœud — motif par défaut',
};

/** Motifs of the projects published before the field existed. Any other project takes `noeud`, until set in the admin. */
const DEFAULTS: Record<string, Motif> = {
  'bercy-vert': 'feuille',
  'referentiel-indicateurs': 'courbe',
  'saisines-cour-des-comptes': 'arbre',
  'veille-strategique': 'spirale',
  safeping: 'onde',
  datametre: 'barres',
};

export function motifOf(id: string, chosen?: string): Motif {
  if (chosen && (MOTIFS as readonly string[]).includes(chosen)) return chosen as Motif;
  return DEFAULTS[id] ?? 'noeud';
}

export type Vec3 = [number, number, number];

/** Resamples a polyline to `n` points evenly spaced along its length (the tube stays regular). */
export function resample(pts: Vec3[], n: number): Vec3[] {
  const d = [0];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    d.push(d[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  const total = d[d.length - 1] || 1;
  const out: Vec3[] = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * total;
    while (j < d.length - 1 && d[j] < t) j++;
    const span = d[j] - d[j - 1] || 1;
    const f = Math.min(1, Math.max(0, (t - d[j - 1]) / span));
    const [a, b] = [pts[j - 1], pts[j]];
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
  }
  return out;
}

/** Rounds the corners of a polyline (Chaikin), so that drawn shapes read as a supple thread. */
function soften(pts: Vec3[], passes = 3): Vec3[] {
  let p = pts;
  for (let s = 0; s < passes; s++) {
    const q: Vec3[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [a, b] = [p[i], p[i + 1]];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25, a[2] * 0.75 + b[2] * 0.25]);
      q.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75, a[2] * 0.25 + b[2] * 0.75]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

const TAU = Math.PI * 2;
const range = (n: number, f: (t: number, i: number) => Vec3): Vec3[] => Array.from({ length: n }, (_, i) => f(i / (n - 1), i));

/** A motif, `n` points, in the unit square. `time` animates the motifs that move (seconds). */
export function motif(kind: Motif, n: number, time = 0): Vec3[] {
  switch (kind) {
    case 'feuille': {
      // The stem rises into the midrib, then the thread runs round the blade, with side veins.
      const stem = range(30, (t) => [0.04 * Math.sin(t * 3), -1 + t * 1.85, 0.08 * t]);
      const blade = range(220, (t) => {
        const a = Math.PI + t * TAU; // from the tip, round the blade, back to the tip
        const y = -0.05 + 0.9 * -Math.cos(a);
        const w = 0.62 * Math.sin(a) * (1 - 0.35 * ((y + 0.95) / 1.8) ** 2);
        return [w + 0.05 * Math.sin(a * 2), y, 0.22 * Math.sin(a * 2 + time * 0.6)];
      });
      const veins: Vec3[] = [];
      for (const [y, s] of [
        [0.45, 1],
        [0.1, -1],
        [-0.25, 1],
      ] as const) {
        veins.push([0, y - 0.18, 0.05], [0.38 * s, y + 0.05, 0.1], [0, y - 0.18, 0.05]);
      }
      return resample(soften([...stem, ...blade.slice(110), ...veins, ...blade.slice(0, 110)], 2), n);
    }
    case 'courbe': {
      // A series with its threshold: the line of the values, then back along the alert level.
      const f = (x: number) => -0.35 + 0.45 * Math.sin(x * 2.3 + 0.6) + 0.22 * Math.sin(x * 6.1 + time * 0.5) + 0.3 * x;
      const series = range(160, (t) => {
        const x = -1 + 2 * t;
        return [x, f(x), 0.15 * Math.sin(t * 5)];
      });
      const threshold = range(60, (t) => [1 - 2 * t, 0.42, -0.12]);
      return resample(soften([...series, [1, 0.42, -0.06], ...threshold], 2), n);
    }
    case 'arbre': {
      // A tree walked depth first: one trunk, branches, leaves; the thread goes out and comes back.
      const P = (x: number, y: number, z = 0): Vec3 => [x, y, z];
      const root = P(-1, 0, 0);
      const fork = P(-0.35, 0, 0.1);
      const path: Vec3[] = [root, fork];
      for (const s of [1, -1]) {
        const mid = P(0.25, 0.5 * s, 0.2 * s);
        path.push(mid);
        for (const l of [0.78, 0.28]) path.push(P(1, l * s, 0.3 * s), mid);
        path.push(fork);
      }
      path.push(P(1, 0, -0.1));
      return resample(soften(path, 3), n);
    }
    case 'spirale': {
      // Many sources gathered towards one point: a spiral closing in, rising towards the viewer.
      const pts = range(400, (t) => {
        const a = t * TAU * 3.6 + time * 0.25;
        const r = 1 - 0.92 * t;
        return [r * Math.cos(a), r * Math.sin(a), 0.6 * t - 0.2];
      });
      return resample(pts, n);
    }
    case 'onde': {
      // A ping: rings around a point, each passing smoothly into the next, the outer one widening.
      const rings = 4;
      const pulse = (time * 0.35) % 1;
      const radius = (k: number) => 0.2 + (k / (rings - 1)) * 0.72 + (k === rings - 1 ? pulse * 0.12 : 0);
      const pts = range(520, (t) => {
        const x = t * rings;
        const k = Math.min(rings - 1, Math.floor(x));
        const local = x - k;
        const a = local * TAU - Math.PI / 2;
        // the last eighth of a ring moves out to the next one
        const m = Math.min(1, Math.max(0, (local - 0.875) / 0.125));
        const e = m * m * (3 - 2 * m);
        const r = radius(k) + (k < rings - 1 ? (radius(k + 1) - radius(k)) * e : 0);
        return [r * Math.cos(a), r * Math.sin(a), 0.1 * Math.sin(a * 3 + k)];
      });
      return resample(pts, n);
    }
    case 'barres': {
      // Bars of a chart, drawn as one line up and down.
      const h = [0.35, 0.7, 0.5, 0.95, 0.6, 0.82, 0.45];
      const w = 2 / h.length;
      const path: Vec3[] = [[-1, -0.85, 0]];
      h.forEach((v, i) => {
        const x0 = -1 + i * w + w * 0.18;
        const x1 = -1 + (i + 1) * w - w * 0.18;
        const top = -0.85 + v * 1.75 * (1 + 0.04 * Math.sin(time * 0.8 + i));
        path.push([x0, -0.85, 0], [x0, top, 0.08], [x1, top, 0.08], [x1, -0.85, 0]);
      });
      path.push([1, -0.85, 0]);
      return resample(soften(path, 1), n);
    }
    default: {
      // Trefoil knot.
      return resample(
        range(300, (t) => {
          const a = t * TAU + time * 0.15;
          return [0.33 * (Math.sin(a) + 2 * Math.sin(2 * a)), 0.33 * (Math.cos(a) - 2 * Math.cos(2 * a)) + 0.15, -0.35 * Math.sin(3 * a)];
        }),
        n,
      );
    }
  }
}

/**
 * The tangle of the introduction: thread `s` of `count` comes in from the left, loops through a loose
 * knot shared with the others (a torus knot of its own, turned in space), and leaves on the right.
 * Open ends: it reads as threads, not as a ball.
 */
export function tangle(s: number, count: number, n: number, time = 0): Vec3[] {
  const PQ = [
    [2, 3],
    [3, 2],
    [2, 3],
    [3, 4],
    [2, 5],
    [3, 2],
    [2, 3],
    [3, 4],
  ][s % 8];
  const [p, q] = PQ;
  const rx = 0.6 + s * 1.13;
  const ry = 0.3 + s * 0.71;
  const [cx, sx, cy, sy] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry)];
  const spin = time * 0.04 * (s % 2 ? 1 : -1);
  const knot = (t: number): Vec3 => {
    const a = t * TAU + spin;
    const r = 0.55 + 0.22 * Math.cos(q * a + s);
    let x = r * Math.cos(p * a);
    let y = r * Math.sin(p * a);
    let z = 0.28 * Math.sin(q * a + s);
    [y, z] = [y * cx - z * sx, y * sx + z * cx];
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    return [x * 1.35, y * 0.78, z];
  };
  const lane = (s - (count - 1) / 2) * 0.13;
  const start = knot(0);
  const end = knot(1);
  const pts: Vec3[] = [];
  // the loose end from the left, eased into the knot
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const e = t * t * (3 - 2 * t);
    const from: Vec3 = [-2.6, lane * 3 + 0.08 * Math.sin(t * 5 + s + time * 0.5), 0];
    pts.push([from[0] + (start[0] - from[0]) * e, from[1] + (start[1] - from[1]) * e, from[2] + (start[2] - from[2]) * e]);
  }
  for (let i = 1; i <= 260; i++) pts.push(knot(i / 260));
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const e = t * t * (3 - 2 * t);
    const to: Vec3 = [2.6, lane * 3 + 0.08 * Math.sin(t * 4 - s + time * 0.5), 0];
    pts.push([end[0] + (to[0] - end[0]) * e, end[1] + (to[1] - end[1]) * e, end[2] + (to[2] - end[2]) * e]);
  }
  return resample(pts, n);
}

/** Thread `s` lying straight, with the others, across the width (a loom): `spread` is the distance between threads. */
export function warp(s: number, count: number, n: number, time = 0, spread = 0.16): Vec3[] {
  const y0 = (s - (count - 1) / 2) * spread;
  return range(n, (t) => {
    const x = -1.6 + 3.2 * t;
    return [x, y0 + 0.05 * Math.sin(t * 7 + s * 1.7 + time * 0.4), 0.08 * Math.sin(t * 4 + s + time * 0.3)];
  });
}

/** The end: thread `s` comes from the left, spread out, and joins the others at the origin, then they go on as one. */
export function gather(s: number, count: number, n: number, time = 0): Vec3[] {
  const y0 = (s - (count - 1) / 2) * 0.34;
  return range(n, (t) => {
    const x = -2 + 3.4 * t;
    const k = Math.min(1, Math.max(0, (x + 2) / 2)); // 0 far left, 1 at the knot
    const e = k * k * (3 - 2 * k);
    const twist = Math.max(0, x) * 6;
    return [x, y0 * (1 - e) + 0.012 * Math.sin(twist + (s * TAU) / count + time), 0.25 * (1 - e) * Math.sin(t * 5 + s) + 0.012 * Math.cos(twist + (s * TAU) / count + time)];
  });
}

/** SVG path data of a 3D polyline seen from the front (z gives a little vertical lift), in a viewBox of -1.1..1.1. */
export function svgPath(pts: Vec3[], scale = 1): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${(p[0] * scale).toFixed(3)} ${(-(p[1] + p[2] * 0.12) * scale).toFixed(3)}`).join('');
}

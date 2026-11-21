// The scene: the threads of the site drawn in WebGL2, behind the HTML. Progressive enhancement only:
// the page is complete without it (the server draws the same threads as SVG), and it switches itself
// off when the device cannot keep up.
//
// How it works
// - Each `[data-scene]` element of the page is a keyframe (introduction, one per project, loom, gathering).
//   Its `[data-stage]` child gives the place and size of the drawing: the threads are attached to the
//   HTML and scroll with it; nothing takes over the scroll.
// - Between two keyframes the threads are blended, point by point, with a delay along the thread: they
//   unravel from one end rather than morphing all at once.
// - Each frame the CPU computes 6 × 200 points (and their frames); the GPU extrudes them into tubes and
//   shades them like silk thread (anisotropic highlight along the fibre, twisted texture).
import { gather, motif, motifOf, tangle, type Vec3, warp } from '../../lib/threads';

const P = 200; // points per thread
const R = 12; // sides of a tube
const FOV = (32 * Math.PI) / 180;
const CAM_Z = 12;

interface Strand {
  color: [number, number, number]; // linear RGB
}

interface Keyframe {
  kind: 'hero' | 'project' | 'warp' | 'gather';
  section: HTMLElement;
  stage: HTMLElement;
  strand: number; // project keyframes: the thread that draws the motif
  motif: string;
  glow: [number, number, number];
}

export interface SceneStats {
  fps: number;
  dpr: number;
  frameMs: number;
  tier: 'full' | 'reduced' | 'off';
  drawCalls: number;
  vertices: number;
}

const hex = (h: string): [number, number, number] => {
  const n = Number.parseInt(h.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const lin = (c: [number, number, number]): [number, number, number] => c.map((v) => v ** 2.2) as [number, number, number];
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const VS = `#version 300 es
precision highp float;
in vec2 aSeg;
uniform sampler2D uPos;
uniform sampler2D uNrm;
uniform int uStrand;
uniform float uRadius;
uniform mat4 uViewProj;
out vec3 vN;
out vec3 vT;
out vec3 vW;
out float vU;
out float vA;
const float P = ${P}.0;
const float R = ${R}.0;
void main() {
  int i = int(aSeg.x);
  vec3 p = texelFetch(uPos, ivec2(i, uStrand), 0).xyz;
  vec3 pn = texelFetch(uPos, ivec2(min(i + 1, ${P - 1}), uStrand), 0).xyz;
  vec3 pp = texelFetch(uPos, ivec2(max(i - 1, 0), uStrand), 0).xyz;
  vec3 T = pn - pp;
  T = length(T) > 1e-5 ? normalize(T) : vec3(1.0, 0.0, 0.0);
  vec3 N = texelFetch(uNrm, ivec2(i, uStrand), 0).xyz;
  vec3 B = cross(T, N);
  float a = aSeg.y / R * 6.2831853;
  vec3 dir = cos(a) * N + sin(a) * B;
  float u = aSeg.x / (P - 1.0);
  float taper = smoothstep(0.0, 0.035, u) * smoothstep(1.0, 0.965, u);
  vec3 w = p + dir * uRadius * (0.25 + 0.75 * taper);
  vN = dir; vT = T; vW = w; vU = u; vA = a;
  gl_Position = uViewProj * vec4(w, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vN;
in vec3 vT;
in vec3 vW;
in float vU;
in float vA;
uniform vec3 uColor;
uniform float uDim;
uniform vec3 uCam;
uniform vec3 uKey;
uniform vec3 uBg;
uniform float uFade;
out vec4 frag;
void main() {
  vec3 N = normalize(vN);
  vec3 T = normalize(vT);
  vec3 V = normalize(uCam - vW);
  vec3 L = normalize(uKey - vW);
  vec3 H = normalize(L + V);
  // twisted cord: fine stripes winding round the thread
  float twist = 0.82 + 0.18 * sin(vU * 900.0 + vA * 2.0);
  vec3 base = uColor * twist;
  float wrap = max(0.0, (dot(N, L) + 0.45) / 1.45);
  // Kajiya-Kay: highlight along the fibre (silk), a white one and a coloured, broader one
  float th = dot(T, H);
  float sTh = sqrt(max(0.0, 1.0 - th * th));
  float spec1 = pow(sTh, 90.0) * 0.55;
  float th2 = dot(T, normalize(H + N * 0.25));
  float spec2 = pow(sqrt(max(0.0, 1.0 - th2 * th2)), 18.0) * 0.35;
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 key = vec3(1.0, 0.93, 0.82);
  vec3 col = base * (0.10 + 1.05 * wrap * key) + spec1 * key + spec2 * base + rim * 0.22 * mix(base, vec3(1.0), 0.4);
  // depth: the back of a knot sinks into the shadow
  float fog = smoothstep(0.6, -2.2, vW.z);
  col = mix(col, uBg, fog * 0.7);
  // the start of a thread can fade into the background (the loose ends behind the text)
  float fade = uFade > 0.0 ? smoothstep(uFade * 0.35, uFade, vU) : 1.0;
  col = mix(uBg, col, uDim * fade);
  frag = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

const BG_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const BG_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform vec2 uRes;
uniform vec2 uGlowPos;
uniform vec3 uGlow;
uniform vec3 uBase;
uniform float uTime;
out vec4 frag;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  float d = length((vUv - uGlowPos) * asp);
  vec3 col = uBase;
  col += uGlow * 0.5 * exp(-d * d * 4.0);
  col += uGlow * 0.08 * exp(-d * 1.6);
  // vignette
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.55 * dot(q, q) * 1.6;
  // grain
  float g = hash(vUv * uRes + fract(uTime) * 100.0) - 0.5;
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col += g * 0.028;
  frag = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  return prog;
}

function perspective(aspect: number): Float32Array {
  const f = 1 / Math.tan(FOV / 2);
  const near = 1;
  const far = 40;
  // projection × view (camera at (0, 0, CAM_Z) looking at the origin)
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far) - m[10] * CAM_Z;
  m[15] = CAM_Z;
  return m;
}

export function startScene(canvas: HTMLCanvasElement, options: { onFirstFrame?: () => void; onGiveUp?: () => void; adaptive?: boolean } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  if (!gl) return null;

  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = innerWidth < 768;
  let maxDpr = Math.min(devicePixelRatio || 1, small ? 1.5 : coarse ? 1.5 : 1.75);
  let dpr = maxDpr;

  const prog = compile(gl, VS, FS);
  const bg = compile(gl, BG_VS, BG_FS);
  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const u = {
    pos: U(prog, 'uPos'),
    nrm: U(prog, 'uNrm'),
    strand: U(prog, 'uStrand'),
    radius: U(prog, 'uRadius'),
    vp: U(prog, 'uViewProj'),
    color: U(prog, 'uColor'),
    dim: U(prog, 'uDim'),
    cam: U(prog, 'uCam'),
    key: U(prog, 'uKey'),
    bg: U(prog, 'uBg'),
    fade: U(prog, 'uFade'),
    res: U(bg, 'uRes'),
    glowPos: U(bg, 'uGlowPos'),
    glow: U(bg, 'uGlow'),
    base: U(bg, 'uBase'),
    time: U(bg, 'uTime'),
  };

  // ---- tube geometry: (point index, side index) pairs, shared by every thread
  const segs = new Float32Array(P * (R + 1) * 2);
  let k = 0;
  for (let i = 0; i < P; i++)
    for (let j = 0; j <= R; j++) {
      segs[k++] = i;
      segs[k++] = j;
    }
  const idx = new Uint16Array((P - 1) * R * 6);
  k = 0;
  for (let i = 0; i < P - 1; i++)
    for (let j = 0; j < R; j++) {
      const a = i * (R + 1) + j;
      const b = a + R + 1;
      idx.set([a, b, a + 1, b, b + 1, a + 1], k);
      k += 6;
    }
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, segs, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aSeg');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

  const quad = gl.createVertexArray()!;
  gl.bindVertexArray(quad);
  const qb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const qloc = gl.getAttribLocation(bg, 'aPos');
  gl.enableVertexAttribArray(qloc);
  gl.vertexAttribPointer(qloc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // ---- data: the threads and the keyframes, read from the page
  const strands: Strand[] = [...document.querySelectorAll<HTMLElement>('[data-thread]')].map((el) => ({ color: lin(hex(el.dataset.thread!)) }));
  const S = Math.max(1, strands.length);
  const keyframes: Keyframe[] = [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((el) => ({
    kind: el.dataset.scene as Keyframe['kind'],
    section: el,
    stage: el.querySelector<HTMLElement>('[data-stage]') ?? el,
    strand: Number(el.dataset.strand ?? -1),
    motif: el.dataset.motif ?? 'noeud',
    glow: lin(hex(el.dataset.glow ?? '#5a3a22')),
  }));

  const tex = (data: Float32Array) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, P, S, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return t;
  };
  const cur = new Float32Array(P * S * 4); // current positions (w unused)
  const tgt = new Float32Array(P * S * 4);
  const nrm = new Float32Array(P * S * 4);
  const push = new Float32Array(P * S * 3); // pointer displacement (spring)
  const tPos = tex(cur);
  const tNrm = tex(nrm);
  const dims = new Float32Array(S).fill(1);
  const radii = new Float32Array(S).fill(0.03);
  const glow: [number, number, number] = [0.08, 0.05, 0.03];
  const glowPos: [number, number] = [0.7, 0.55];

  // ---- the view
  let W = 0;
  let H = 0;
  let vp = perspective(1);
  let worldPerPx = 1;
  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    vp = perspective(W / H);
    worldPerPx = (2 * CAM_Z * Math.tan(FOV / 2)) / H;
  };
  resize();
  addEventListener('resize', resize);

  // A stage element as a place in the world (centre, half size), at z = 0.
  const place = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - W / 2) * worldPerPx, y: -(r.top + r.height / 2 - H / 2) * worldPerPx, s: (Math.min(r.width, r.height) / 2) * worldPerPx, w: (r.width / 2) * worldPerPx, top: r.top, bottom: r.bottom };
  };

  // ---- building a keyframe's threads (into `out`, xyz per point; also radius and dim per thread)
  const write = (out: Float32Array, s: number, pts: Vec3[], ox: number, oy: number, sx: number, sy = sx, sz = sx) => {
    for (let i = 0; i < P; i++) {
      const p = pts[i];
      const o = (s * P + i) * 4;
      out[o] = ox + p[0] * sx;
      out[o + 1] = oy + p[1] * sy;
      out[o + 2] = p[2] * sz;
    }
  };
  const build = (kf: Keyframe, out: Float32Array, rad: Float32Array, dim: Float32Array, time: number) => {
    const at = place(kf.stage);
    if (kf.kind === 'hero') {
      const sc = at.w / 1.45;
      for (let s = 0; s < S; s++) {
        write(out, s, tangle(s, S, P, time), at.x, at.y, sc, sc, sc);
        rad[s] = small ? 0.026 : 0.032;
        dim[s] = 1;
      }
    } else if (kf.kind === 'project') {
      const sc = at.s * 0.8;
      const m = motif(motifOf('', kf.motif), P, time);
      const span = Math.max(at.w * 2.2, (W * worldPerPx) / 1.6);
      for (let s = 0; s < S; s++) {
        if (s === kf.strand) {
          write(out, s, m, at.x, at.y, sc, sc, sc);
          rad[s] = small ? 0.045 : 0.055;
          dim[s] = 1;
        } else {
          // the other threads run straight through the stage, quiet: the loom the motif is drawn from
          write(out, s, warp(s, S, P, time, 0.1), at.x, at.y - at.s * 1.05, span / 1.6, sc, sc);
          rad[s] = small ? 0.009 : 0.012;
          dim[s] = small ? 0.28 : 0.42;
        }
      }
    } else if (kf.kind === 'warp') {
      const span = (W * worldPerPx) / 3.0;
      for (let s = 0; s < S; s++) {
        write(out, s, warp(s, S, P, time, 0.22), at.x, at.y, span, at.s * 0.9, at.s);
        rad[s] = 0.018;
        dim[s] = 0.6;
      }
    } else {
      // The stage is the single thread under the address. The fan opens to its right, in the free
      // space, and the threads join at the end of the address, then run back under it as one.
      const sc = (at.w * 2) / 1.4;
      const room = Math.max(0.6, (W * worldPerPx) / 2 - (at.x + at.w));
      const ls = room / 1.9;
      for (let s = 0; s < S; s++) {
        const pts = gather(s, S, P, time);
        for (let i = 0; i < P; i++) {
          const p = pts[i];
          const o = (s * P + i) * 4;
          const x = p[0] < 0 ? p[0] * ls : p[0] * sc;
          out[o] = at.x + at.w - x;
          out[o + 1] = at.y + p[1] * (p[0] < 0 ? Math.max(ls, 0.5) * 1.1 : sc);
          out[o + 2] = p[2] * 0.6;
        }
        rad[s] = 0.024;
        dim[s] = 0.95;
      }
    }
  };

  // ---- pointer
  const pointer = { x: 0, y: 0, active: 0, target: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX - W / 2) * worldPerPx;
    pointer.y = -(e.clientY - H / 2) * worldPerPx;
    pointer.target = 1;
  };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onMove, { passive: true });
  document.addEventListener('pointerleave', () => (pointer.target = 0));
  addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') pointer.target = 0;
  });

  // ---- parallel transport frames (stable normals along each thread)
  const frames = () => {
    for (let s = 0; s < S; s++) {
      let nx = 0;
      let ny = 0;
      let nz = 1;
      let px = 0;
      let py = 0;
      let pz = 0;
      for (let i = 0; i < P; i++) {
        const o = (s * P + i) * 4;
        const a = (s * P + Math.max(0, i - 1)) * 4;
        const b = (s * P + Math.min(P - 1, i + 1)) * 4;
        let tx = cur[b] - cur[a];
        let ty = cur[b + 1] - cur[a + 1];
        let tz = cur[b + 2] - cur[a + 2];
        const tl = Math.hypot(tx, ty, tz) || 1;
        tx /= tl;
        ty /= tl;
        tz /= tl;
        if (i === 0) {
          // any vector not parallel to the first tangent
          [nx, ny, nz] = Math.abs(tz) < 0.9 ? [0, 0, 1] : [0, 1, 0];
        } else {
          // rotate the previous normal by the change of tangent
          const d = nx * tx + ny * ty + nz * tz;
          nx -= d * tx;
          ny -= d * ty;
          nz -= d * tz;
          void px;
          void py;
          void pz;
        }
        const d0 = nx * tx + ny * ty + nz * tz;
        nx -= d0 * tx;
        ny -= d0 * ty;
        nz -= d0 * tz;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl;
        ny /= nl;
        nz /= nl;
        nrm[o] = nx;
        nrm[o + 1] = ny;
        nrm[o + 2] = nz;
        px = tx;
        py = ty;
        pz = tz;
      }
    }
  };

  // ---- the loop
  const tmpA = new Float32Array(P * S * 4);
  const tmpB = new Float32Array(P * S * 4);
  const radA = new Float32Array(S);
  const radB = new Float32Array(S);
  const dimA = new Float32Array(S);
  const dimB = new Float32Array(S);
  const glowA = [0, 0, 0];
  let last = performance.now();
  const start = last;
  let first = true;
  let running = true;
  let raf = 0;
  const times: number[] = [];
  const stats: SceneStats = { fps: 0, dpr, frameMs: 0, tier: 'full', drawCalls: 0, vertices: S * P * (R + 1) };
  let warmup = 0;
  let fade = 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden || document.documentElement.classList.contains('has-dialog')) return;
    const t0 = performance.now();
    const time = (now - start) / 1000;

    // which two keyframes, and how far between them
    const mid = H / 2;
    const centres = keyframes.map((kf) => {
      const r = kf.section.getBoundingClientRect();
      return r.top + Math.min(r.height, H) / 2 + Math.max(0, r.height - H) * 0.5;
    });
    let a = 0;
    while (a < keyframes.length - 2 && centres[a + 1] <= mid) a++;
    const span = centres[a + 1] - centres[a] || 1;
    const raw = keyframes.length > 1 ? Math.min(1, Math.max(0, (mid - centres[a]) / span)) : 0;
    const f = smooth(0.18, 0.82, raw);
    build(keyframes[a], tmpA, radA, dimA, time);
    if (keyframes.length > 1) build(keyframes[a + 1], tmpB, radB, dimB, time);
    const kfA = keyframes[a];
    const kfB = keyframes[Math.min(a + 1, keyframes.length - 1)];

    // blend, the thread unravelling from its start
    for (let s = 0; s < S; s++) {
      for (let i = 0; i < P; i++) {
        const uu = i / (P - 1);
        const g = smooth(0, 1, f * 1.5 - uu * 0.5);
        const o = (s * P + i) * 4;
        tgt[o] = tmpA[o] + (tmpB[o] - tmpA[o]) * g;
        tgt[o + 1] = tmpA[o + 1] + (tmpB[o + 1] - tmpA[o + 1]) * g;
        tgt[o + 2] = tmpA[o + 2] + (tmpB[o + 2] - tmpA[o + 2]) * g;
      }
      radii[s] = radA[s] + (radB[s] - radA[s]) * f;
      dims[s] = dimA[s] + (dimB[s] - dimA[s]) * f;
    }
    for (let c = 0; c < 3; c++) glowA[c] = kfA.glow[c] + (kfB.glow[c] - kfA.glow[c]) * f;
    const fadeOf = (kf: Keyframe) => (kf.kind === 'hero' ? (small ? 0 : 0.34) : 0);
    fade = fadeOf(kfA) + (fadeOf(kfB) - fadeOf(kfA)) * f;
    const pa = place(kfA.stage);
    const pb = place(kfB.stage);
    const gx = pa.x + (pb.x - pa.x) * f;
    const gy = pa.y + (pb.y - pa.y) * f;
    const tgx = 0.5 + gx / (W * worldPerPx);
    const tgy = 0.5 + gy / (H * worldPerPx);
    const ease = 1 - Math.exp(-dt * 4);
    glowPos[0] += (tgx - glowPos[0]) * ease;
    glowPos[1] += (Math.min(1.1, Math.max(-0.1, tgy)) - glowPos[1]) * ease;
    for (let c = 0; c < 3; c++) glow[c] += (glowA[c] - glow[c]) * ease;

    // The introduction's gesture: under the pointer (or the finger) the threads are combed into
    // parallel lines, readable; away from it they tangle again.
    const heroKf = keyframes[0]?.kind === 'hero' ? keyframes[0] : undefined;
    const heroW = heroKf ? (kfA === heroKf ? 1 - f : kfB === heroKf ? f : 0) : 0;
    // follow the targets (a little lag gives the threads weight), and bend away from the pointer
    pointer.active += (pointer.target - pointer.active) * (1 - Math.exp(-dt * 5));
    const comb = heroW * pointer.active;
    if (comb > 0.01 && heroKf) {
      const h = place(heroKf.stage);
      const bandX = h.w * 0.55;
      const bandY = h.w * 0.9;
      const laneGap = h.w * 0.13;
      for (let s = 0; s < S; s++) {
        const lane = h.y + (s - (S - 1) / 2) * laneGap;
        for (let i = 0; i < P; i++) {
          const o = (s * P + i) * 4;
          const dx = (tgt[o] - pointer.x) / bandX;
          const dy = (tgt[o + 1] - pointer.y) / bandY;
          const w = Math.exp(-dx * dx - dy * dy) * comb;
          if (w < 0.005) continue;
          tgt[o + 1] += (lane - tgt[o + 1]) * w;
          tgt[o + 2] += (0.35 - tgt[o + 2]) * w;
        }
      }
    }
    const repel = 1 - heroW;
    const follow = first ? 1 : 1 - Math.exp(-dt * 9);
    const rad = 1.7;
    for (let s = 0; s < S; s++)
      for (let i = 0; i < P; i++) {
        const o = (s * P + i) * 4;
        const q = (s * P + i) * 3;
        let wx = 0;
        let wy = 0;
        let wz = 0;
        if (pointer.active > 0.01 && repel > 0.01) {
          const dx = tgt[o] - pointer.x;
          const dy = tgt[o + 1] - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < rad) {
            const fall = (1 - d / rad) ** 2 * pointer.active * repel;
            wx = (dx / (d || 1)) * fall * 0.55;
            wy = (dy / (d || 1)) * fall * 0.55;
            wz = fall * 0.9;
          }
        }
        const sp = 1 - Math.exp(-dt * 7);
        push[q] += (wx - push[q]) * sp;
        push[q + 1] += (wy - push[q + 1]) * sp;
        push[q + 2] += (wz - push[q + 2]) * sp;
        cur[o] += (tgt[o] + push[q] - cur[o]) * follow;
        cur[o + 1] += (tgt[o + 1] + push[q + 1] - cur[o + 1]) * follow;
        cur[o + 2] += (tgt[o + 2] + push[q + 2] - cur[o + 2]) * follow;
      }
    frames();

    // ---- draw
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(bg);
    gl.bindVertexArray(quad);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.glowPos, glowPos[0], glowPos[1]);
    gl.uniform3f(u.glow, glow[0], glow[1], glow[2]);
    const base = [0.0045, 0.004, 0.0038];
    gl.uniform3f(u.base, base[0], base[1], base[2]);
    gl.uniform1f(u.time, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tPos);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, P, S, gl.RGBA, gl.FLOAT, cur);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tNrm);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, P, S, gl.RGBA, gl.FLOAT, nrm);
    gl.uniform1i(u.pos, 0);
    gl.uniform1i(u.nrm, 1);
    gl.uniformMatrix4fv(u.vp, false, vp);
    gl.uniform3f(u.cam, 0, 0, CAM_Z);
    gl.uniform3f(u.key, -6, 7, 9);
    gl.uniform3f(u.bg, base[0] + glow[0] * 0.3, base[1] + glow[1] * 0.3, base[2] + glow[2] * 0.3);
    gl.uniform1f(u.fade, fade);
    let calls = 1;
    for (let s = 0; s < S; s++) {
      if (dims[s] < 0.02) continue;
      gl.uniform1i(u.strand, s);
      gl.uniform1f(u.radius, radii[s]);
      gl.uniform3f(u.color, ...strands[s % strands.length].color);
      gl.uniform1f(u.dim, dims[s]);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      calls++;
    }
    stats.drawCalls = calls;

    if (first) {
      first = false;
      options.onFirstFrame?.();
    }

    // ---- keep up, or step down: measured on the time between frames
    const frameMs = performance.now() - t0;
    times.push(dt * 1000);
    if (times.length > 60) times.shift();
    stats.frameMs = frameMs;
    warmup++;
    if (warmup > 90 && times.length === 60 && warmup % 30 === 0) {
      if (options.adaptive === false) {
        stats.fps = Math.round(1000 / [...times].sort((x, y) => x - y)[30]);
        return;
      }
      const sorted = [...times].sort((x, y) => x - y);
      const median = sorted[30];
      stats.fps = Math.round(1000 / median);
      if (median > 26) {
        if (dpr > 0.8) {
          dpr = Math.max(0.75, dpr * 0.75);
          maxDpr = dpr;
          stats.dpr = dpr;
          stats.tier = 'reduced';
          resize();
          times.length = 0;
        } else {
          stats.tier = 'off';
          stop();
          options.onGiveUp?.();
        }
      }
    }
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  raf = requestAnimationFrame(frame);
  (window as unknown as { __scene: SceneStats }).__scene = stats;

  return {
    stats,
    stop,
    get running() {
      return running;
    },
  };
}

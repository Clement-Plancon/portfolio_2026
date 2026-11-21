// Generates public/og-default.png (1200×630) in the art direction of the site (« Fils »): the name in
// Bricolage Grotesque, the role, and the six threads of the projects tangled (same geometry as the site).
// Usage: serve the built site (`npx netlify serve --offline`, port 8888, or ORIGIN=…), then
// `node scripts/generate-og.mjs` (Node ≥ 22.18). The page is loaded from that origin so the fonts load.
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { svgPath, tangle } from '../src/lib/threads.ts';
import { TINTS } from '../src/lib/tints.ts';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:8888';
const projects = readdirSync('src/content/projects')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`src/content/projects/${f}`, 'utf8')))
  .filter((p) => p.visible !== false)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const colors = projects.map((p) => TINTS[p.cover?.color ?? 'sable'].thread);
const paths = colors.map((c, s) => `<path d="${svgPath(tangle(s, colors.length, 300), 1 / 1.45)}" stroke="${c}" stroke-width="0.012"/>`).join('');
const [first, ...rest] = profile.name.split(' ');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:B;src:url(/fonts/bricolage.woff2);font-weight:300 700;font-stretch:75% 100%}
@font-face{font-family:G;src:url(/fonts/geist.woff2);font-weight:100 900}
html,body{margin:0;width:1200px;height:630px;background:radial-gradient(60% 70% at 72% 50%,#3a2414,#0f0e0d 70%);color:#f1ebe2;font-family:G;overflow:hidden}
.t{position:absolute;left:64px;top:56px;bottom:56px;display:flex;flex-direction:column;justify-content:center}
.lab{font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#a89f92}
h1{margin:18px 0 0;font-family:B;font-weight:650;font-stretch:76%;font-size:138px;line-height:.84;letter-spacing:-.035em}
h1 span{display:block}h1 span+span{padding-left:.42em}
.role{margin-top:22px;font-family:B;font-stretch:92%;font-size:34px}
svg{position:absolute;left:440px;top:95px;width:760px;height:471px;overflow:visible;-webkit-mask-image:linear-gradient(90deg,transparent,#000 28%)}
</style></head><body>
<svg viewBox="-1 -0.62 2 1.24" fill="none" stroke-linecap="round">${paths}</svg>
<div class="t"><div class="lab">${esc(profile.location)} — clementplancon.fr</div>
<h1><span>${esc(first)}</span><span>${esc(rest.join(' '))}</span></h1><div class="role">${esc(profile.jobTitle)}</div></div>
</body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${ORIGIN}/robots.txt`);
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-default.png' });
await browser.close();
console.log('public/og-default.png written');

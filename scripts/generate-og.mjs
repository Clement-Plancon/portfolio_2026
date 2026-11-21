// Generates public/og-default.png (1200×630) in the art direction of the site (« Affiches »): the name in
// wide capitals on cobalt, the role, and a pile of posters in the colours of the projects shown first.
// Usage: serve the built site (`npx netlify serve --offline`, port 8888, or ORIGIN=…), then
// `node scripts/generate-og.mjs` (Node ≥ 22.18). The page is loaded from that origin so the font loads.
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { TINTS } from '../src/lib/tints.ts';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:8888';
const all = readdirSync('src/content/projects')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`src/content/projects/${f}`, 'utf8')))
  .filter((p) => p.visible !== false)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const marked = all.filter((p) => p.featured);
const projects = (marked.length ? marked : all).slice(0, 4);
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const words = profile.name.split(' ');
const posters = projects
  .map((p, i) => {
    const t = TINTS[p.cover?.color ?? 'sable'];
    const rot = [-8, 5, -3, 7][i % 4];
    return `<div class="p" style="background:${t.bg};color:${t.ink};left:${860 + i * 70}px;top:${150 + (i % 2) * 34}px;rotate:${rot}deg;z-index:${i + 1}">
      <div class="n" style="color:${t.alt}">${String(i + 1).padStart(2, '0')}</div><div class="pt">${esc(p.title)}</div></div>`;
  })
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(/fonts/archivo.woff2);font-weight:100 900;font-stretch:62% 125%}
html,body{margin:0;width:1200px;height:630px;background:#1f3bd6;color:#f5f4f0;font-family:A;overflow:hidden}
.lab{position:absolute;left:56px;top:48px;font-size:17px;font-weight:600;font-stretch:80%;letter-spacing:.1em;text-transform:uppercase}
h1{position:absolute;left:48px;right:40px;top:130px;margin:0;font-weight:800;font-stretch:125%;text-transform:uppercase;font-size:104px;line-height:.86;letter-spacing:-.04em}
h1 span{display:block}h1 span+span{padding-left:.6em}
.role{position:absolute;left:56px;bottom:52px;font-size:38px;font-weight:800}
.p{position:absolute;width:200px;height:280px;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 24px 40px -20px rgb(0 0 0/.5)}
.n{font-size:160px;font-weight:900;font-stretch:62%;line-height:.8;letter-spacing:-.05em}
.pt{font-size:24px;font-weight:800;font-stretch:112%;text-transform:uppercase;line-height:.9}
</style></head><body>
<div class="lab">${esc(profile.location)} — clementplancon.fr</div>
<h1>${words.map((w) => `<span>${esc(w)}</span>`).join('')}</h1>
${posters}
<div class="role">${esc(profile.jobTitle)}</div>
</body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${ORIGIN}/robots.txt`);
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-default.png' });
await browser.close();
console.log('public/og-default.png written');

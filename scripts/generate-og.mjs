// Generates public/og-default.png (1200×630) in the art direction of the site: the name in Mona Sans,
// and the folded strip of real project papers (colours from src/lib/stocks.ts, titles from the content).
// Usage: npm run build && npx astro preview --port 4321, then `node scripts/generate-og.mjs` (Node ≥ 22.18).
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { STOCKS } from '../src/lib/stocks.ts';

const projects = readdirSync('src/content/projects')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`src/content/projects/${f}`, 'utf8')))
  .filter((p) => p.visible !== false)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const leaves = projects
  .map((p, i) => {
    const s = STOCKS[p.cover?.color] ?? STOCKS.sable;
    const tilt = i % 2 ? -1 : 1;
    return `<div class="leaf" style="background:${s.paper};color:${s.ink};--t:${tilt}"><span>${esc(p.title)}</span></div>`;
  })
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(/fonts/mona-sans.woff2);font-weight:200 900;font-stretch:75% 125%}
html,body{margin:0;width:1200px;height:630px;background:#f3f1ec;color:#15140f;font-family:M}
body{box-sizing:border-box;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
h1{margin:0;font-stretch:75%;font-weight:840;font-size:150px;line-height:.84;letter-spacing:-.03em}
.role{margin-top:22px;font-size:34px;font-weight:460}
.lab{font-stretch:125%;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#4a4842}
.strip{display:flex;height:150px;perspective:1400px}
.leaf{flex:1;display:flex;align-items:flex-end;padding:16px;font-stretch:75%;font-weight:800;font-size:24px;line-height:1;
  transform:rotateY(calc(var(--t) * 14deg));box-shadow:inset calc(var(--t) * 40px) 0 50px -30px rgba(0,0,0,.35)}
</style></head><body>
<div><div class="lab">Expliquer, du latin explicare : déplier</div>
<h1 style="margin-top:20px">${esc(profile.name)}</h1><div class="role">${esc(profile.jobTitle)}</div></div>
<div class="strip">${leaves}</div>
</body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Same origin as the preview server so the fonts load.
await page.goto('http://localhost:4321/robots.txt');
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-default.png' });
await browser.close();
console.log('public/og-default.png written');

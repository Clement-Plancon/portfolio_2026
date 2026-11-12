// Generates public/og-default.png (1200×630): the home statement and a fern print, with the real fonts
// and the same photogram generator as the site.
// Usage: npm run build && npx astro preview --port 4321, then `node scripts/generate-og.mjs` (Node ≥ 22.18).
import { chromium } from '@playwright/test';
import { photogram } from '../src/lib/photogram.ts';

const pg = photogram('bercy-vert', 'ardoise', 'feuille');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:N;src:url(/fonts/newsreader.woff2);font-weight:300 500}
@font-face{font-family:N;src:url(/fonts/newsreader-italic.woff2);font-style:italic}
@font-face{font-family:S;src:url(/fonts/instrument-sans.woff2);font-weight:400 700}
html,body{margin:0;width:1200px;height:630px;background:#f1ede3;color:#14203f}
body{display:grid;grid-template-columns:1fr 330px;gap:56px;align-items:center;align-content:center;padding:0 72px;box-sizing:border-box;font-family:N}
.who{font-family:S;font-size:18px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#47506a}
h1{margin:26px 0 0;font-weight:300;font-size:96px;line-height:.92;letter-spacing:-.04em}
em{font-style:italic;font-weight:400;color:#1c3e8c}
.print{background:#f7f4ed;padding:22px 20px;box-shadow:0 30px 50px -30px rgba(20,32,63,.6);rotate:2deg}
.e{aspect-ratio:4/5;clip-path:url(#edge);background:${pg.tone}}
svg.art{width:100%;height:100%;display:block}
</style></head><body>
<div><div class="who">Clément Plançon — Ingénieur logiciel &amp; Tech Lead</div>
<h1>Je rends <em>lisible</em> ce qui est complexe.</h1></div>
<div class="print"><div class="e"><svg class="art" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
<defs><filter id="soft"><feGaussianBlur stdDeviation="7"/></filter></defs>
<rect width="400" height="500" fill="${pg.tone}"/><g filter="url(#soft)" opacity=".5">${pg.objects}</g><g>${pg.objects}</g></svg></div></div>
<svg width="0" height="0"><clipPath id="edge" clipPathUnits="objectBoundingBox"><path d="${pg.edge}"/></clipPath></svg>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Same origin as the preview server so the fonts load.
await page.goto('http://localhost:4321/robots.txt');
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-default.png' });
await browser.close();
console.log('public/og-default.png written');

// Generates public/og-default.png (1200×630) in the site's sign style, with the real fonts.
// Usage: npm run build && npx astro preview --port 4321, then `node scripts/generate-og.mjs`.
import { chromium } from '@playwright/test';

const lines = [
  ['BV', '#00a86b', '#121310', 'BERCY VERT'],
  ['RI', '#2a62c4', '#f4f2ec', 'RÉFÉRENTIEL INDICATEURS'],
  ['DM', '#d6c49a', '#121310', 'DATAMETRE'],
];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:O;src:url(/fonts/overpass-latin.woff2);font-weight:100 900}
@font-face{font-family:M;src:url(/fonts/overpass-mono-latin.woff2);font-weight:300 700}
html,body{margin:0;width:1200px;height:630px;background:#e7e5df}
body{padding:14px;box-sizing:border-box;font-family:O;display:grid;grid-template-rows:auto 1fr;gap:4px}
.top{display:flex;gap:4px}.top div{background:#141513;color:#f4f2ec;border-radius:6px;padding:16px 22px;font-weight:800;font-size:22px}
.top .here{background:#ffd21f;color:#121310}.top .grow{flex:1;font-family:M;font-weight:500;font-size:19px;color:#a6a59d;text-align:right}
.panel{background:#141513;color:#f4f2ec;border-radius:6px;padding:34px 40px;display:grid;align-content:space-between}
h1{margin:0;font-size:96px;line-height:.9;letter-spacing:-.045em;font-weight:800}
.c{background:linear-gradient(currentColor 70%,#ffd21f 70%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.role{margin-top:14px;color:#ffd21f;font-weight:800;font-size:32px}
.row{display:flex;align-items:center;gap:18px;border-top:1px solid #2e302b;padding:12px 0}
.b{width:46px;height:46px;border-radius:6px;display:grid;place-items:center;font-weight:900;font-size:20px;padding-top:3px;box-sizing:border-box}
.f{display:inline-block;width:.78em;text-align:center;background:#20221e;margin-right:2px;border-radius:2px;font-family:M;font-weight:600;font-size:26px}
.sp{display:inline-block;width:.5em}
</style></head><body>
<div class="top"><div class="here">Clément Plançon</div><div>Projets</div><div>Parcours</div><div class="grow">● En service · ministère de l'Intérieur</div></div>
<div class="panel"><div><h1>Clément Plan<span class="c">ç</span>on</h1><div class="role">Ingénieur logiciel &amp; Tech Lead · Paris</div></div>
<div>${lines
  .map(
    ([code, bg, fg, name]) =>
      `<div class="row"><span class="b" style="background:${bg};color:${fg}">${code}</span><span>${[...name]
        .map((ch) => (ch === ' ' ? '<span class="sp"></span>' : `<span class="f">${ch}</span>`))
        .join('')}</span></div>`,
  )
  .join('')}</div></div>
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

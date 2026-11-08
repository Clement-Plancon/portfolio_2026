// Generates public/og-default.png (1200×630) from HTML with the site's fonts.
// Run after a build: `npm run build && node scripts/generate-og.mjs` (needs `npx astro preview` on :4321).
import { chromium } from '@playwright/test';

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:B;src:url(http://localhost:4321/fonts/bricolage-grotesque-latin.woff2);font-weight:200 800;font-stretch:75% 100%}
@font-face{font-family:P;src:url(http://localhost:4321/fonts/public-sans-latin.woff2);font-weight:100 900}
html,body{margin:0;width:1200px;height:630px;background:#f3efe6;color:#17160f}
body{display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;box-sizing:border-box;font-family:P}
.role{font-size:30px;font-weight:600;color:#4a463c}
h1{margin:0;font-family:B;font-weight:650;font-size:150px;line-height:.88;letter-spacing:-.045em}
h1 span{display:block}h1 span+span{padding-left:.62em}
.c{position:relative}.c:after{content:'ç';position:absolute;left:0;top:0;line-height:1.2;color:#d9411a;clip-path:inset(.93em 0 0 0)}
.foot{display:flex;justify-content:space-between;font-size:26px;color:#4a463c;border-top:2px solid #17160f;padding-top:18px}
</style></head><body><div class="role">Ingénieur logiciel & Tech Lead · Paris</div>
<h1><span>Clément</span><span>Plan<span class="c" style="display:inline">ç</span>on</span></h1>
<div class="foot"><span>Architecture · Full-stack · Applications métiers</span><span>clementplancon.fr</span></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Same origin as the preview server so the fonts load.
await page.goto('http://localhost:4321/robots.txt');
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-default.png' });
await browser.close();
console.log('public/og-default.png written');

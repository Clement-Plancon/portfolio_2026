// Generates public/og-default.png (1200×630) in the art direction of the site (« Sommaire »): the
// statement in Newsreader on the dark paper, the name and role in Geist, the project titles as an index.
// Usage: serve the built site (`npx netlify serve --offline`, port 8888, or ORIGIN=…), then
// `node scripts/generate-og.mjs` (Node ≥ 22.18). The page is loaded from that origin so the fonts load.
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:8888';
const projects = readdirSync('src/content/projects')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`src/content/projects/${f}`, 'utf8')))
  .filter((p) => p.visible !== false)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const profile = JSON.parse(readFileSync('src/content/profile.json', 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const statement = esc(profile.statement ?? profile.headline).replace(/\*([^*]+)\*/g, '<em>$1</em>');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:N;src:url(/fonts/newsreader.woff2);font-weight:300 500}
@font-face{font-family:N;src:url(/fonts/newsreader-italic.woff2);font-style:italic}
@font-face{font-family:G;src:url(/fonts/geist.woff2);font-weight:100 900}
html,body{margin:0;width:1200px;height:630px;background:#12110e;color:#ede7db;font-family:G}
body{box-sizing:border-box;padding:56px 64px;display:grid;grid-template-columns:1fr 330px;gap:40px}
.l{display:flex;flex-direction:column;justify-content:space-between}
.lab{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#a59d8e}
h1{margin:0;font-family:N;font-weight:300;font-size:98px;line-height:.92;letter-spacing:-.035em}
em{color:#d8c29a}
.id{border-top:1px solid #ede7db24;padding-top:16px;font-size:22px}.id span{display:block;color:#a59d8e}
ol{list-style:none;margin:0;padding:0;align-self:end;border-top:1px solid #ede7db24}
li{font-family:N;font-weight:300;font-size:23px;padding:9px 0;border-bottom:1px solid #ede7db24;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style></head><body>
<div class="l"><div class="lab">${esc(profile.location)} — clementplancon.fr</div><h1>${statement}</h1>
<div class="id">${esc(profile.name)}<span>${esc(profile.jobTitle)}</span></div></div>
<ol>${projects.map((p) => `<li>${esc(p.title)}</li>`).join('')}</ol>
</body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${ORIGIN}/robots.txt`);
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-default.png' });
await browser.close();
console.log('public/og-default.png written');

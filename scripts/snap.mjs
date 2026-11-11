// Dev helper for visual review: screenshots of local URLs or files at several widths.
// Usage: node scripts/snap.mjs <outDir> <url-or-file,...> [widths=1440,390] [full]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const [out, targets, widths = '1440,390', full] = process.argv.slice(2);
const browser = await chromium.launch();
for (const w of widths.split(',').map(Number)) {
  const mobile = w < 768;
  const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: w < 1024 });
  const page = await ctx.newPage();
  for (const t of targets.split(',')) {
    const url = /^https?:/.test(t) ? t : t.startsWith('/') || t === 'home' ? `http://localhost:4321${t === 'home' ? '/' : t}` : pathToFileURL(path.resolve(t)).href;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const name = `${out}/${t.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}-${w}.jpg`;
    await page.screenshot({ path: name, fullPage: !!full, type: 'jpeg', quality: 70 });
    console.log(name, overflow > 0 ? `OVERFLOW ${overflow}px` : '');
  }
  await ctx.close();
}
await browser.close();

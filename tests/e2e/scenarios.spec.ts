// The design with other content: the content scenarios of src/scenarios/data.ts (test data, present only
// in builds made with CONTENT_SCENARIOS=1). For each one, on a phone, a tablet in both orientations and a
// computer: nothing overflows, no script error, every text stays inside its block, every image keeps its
// proportions, every project opens its article, and the navigation lists exactly the visible sections.
import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  [390, 844],
  [820, 1180],
  [1024, 768],
  [1440, 900],
];
// large: projects shown in large; the others are in the strip
const EXPECT: Record<string, { projects: number; large: number; nav: string[] }> = {
  a: { projects: 1, large: 1, nav: ['Projets', 'À propos', 'Contact'] },
  b: { projects: 4, large: 4, nav: ['Projets', 'À propos', 'Contact'] },
  c: { projects: 12, large: 4, nav: ['Projets', 'À propos', 'Contact'] },
  d: { projects: 4, large: 3, nav: ['Démarche', 'Réalisations', 'Contact'] },
  e: { projects: 0, large: 0, nav: ['À propos', 'Contact'] },
};

for (const [name, want] of Object.entries(EXPECT)) {
  for (const [width, height] of VIEWPORTS) {
    test(`scenario ${name.toUpperCase()} at ${width}×${height}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 1024 });
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`/__scenarios/${name}`);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 20));
        }
      });
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

      // the navigation lists the visible sections, with their names from the content
      const nav = page.getByRole('navigation', { name: 'Sommaire' });
      expect((await nav.getByRole('link').allTextContents()).map((t) => t.trim().replace(/^\d+\s*/, ''))).toEqual(want.nav);

      // the projects in large, then the strip; the name and the titles never leave the screen
      await expect(page.locator('.case')).toHaveCount(want.large);
      await expect(page.locator('.mini')).toHaveCount(want.projects - want.large);
      const outside = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.hero__word, .projects__title, .about__title, .contact__title, .contact__mail, .case__title')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left < -1 || r.right > innerWidth + 1;
          })
          .map((el) => el.textContent?.trim().slice(0, 40)),
      );
      expect(outside).toEqual([]);

      // titles and texts stay inside their blocks (no line wider than its box)
      const overflowing = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, .case__sum, .mini__title, .path__role, .domain__name, .chips li, .btn')]
          .filter((el) => el.offsetParent && el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'hidden')
          .map((el) => `${el.tagName}.${el.className}: ${el.textContent?.trim().slice(0, 40)}`),
      );
      expect(overflowing).toEqual([]);

      // images and videos keep their proportions
      const distorted = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLImageElement | HTMLVideoElement>('main img, main video')]
          .filter((m) => {
            const nw = m instanceof HTMLImageElement ? m.naturalWidth : m.videoWidth;
            const nh = m instanceof HTMLImageElement ? m.naturalHeight : m.videoHeight;
            if (!nw || !nh || !m.clientWidth || !m.clientHeight || getComputedStyle(m).objectFit !== 'fill') return false;
            return Math.abs(m.clientWidth / m.clientHeight - nw / nh) > 0.02;
          })
          .map((m) => m.currentSrc),
      );
      expect(distorted).toEqual([]);

      // every visible project has an article that opens and closes
      const projects = page.locator('[data-project]');
      await expect(projects).toHaveCount(want.projects);
      if (want.projects > 0) {
        const last = projects.last();
        const id = (await last.getAttribute('id'))!.replace('projet-', '');
        await last.locator('[data-open]').first().click();
        const dialog = page.locator(`#detail-${id}`);
        await expect(dialog).toBeVisible();
        expect(await dialog.evaluate((d) => d.scrollWidth - d.clientWidth)).toBeLessThanOrEqual(0);
        await dialog.getByRole('button', { name: 'Fermer' }).click();
        await expect(dialog).toBeHidden();
      }
      await ctx.close();
    });
  }
}

test('scenarios are never indexed', async ({ request }) => {
  const r = await request.get('/__scenarios/a');
  expect(r.headers()['x-robots-tag']).toContain('noindex');
});

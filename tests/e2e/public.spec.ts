import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/projets/', '/projets/bercy-vert/', '/projets/datametre/', '/parcours/', '/a-propos/', '/contact/'];
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440, 1920];

for (const width of WIDTHS) {
  test(`no horizontal overflow and navigation reachable at ${width}px`, async ({ browser }) => {
    const mobile = width < 768;
    const ctx = await browser.newContext({ viewport: { width, height: mobile ? 700 : 900 }, isMobile: mobile, hasTouch: width < 1024 });
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0);
      const nav = mobile ? page.getByRole('navigation', { name: 'Navigation principale (mobile)' }) : page.getByRole('navigation', { name: 'Navigation principale', exact: true });
      await expect(nav.getByRole('link', { name: 'Projets' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Contact' }).first()).toBeVisible();
    }
    await ctx.close();
  });
}

test('short screens keep the hero readable (1440×700, 375×560)', async ({ browser }) => {
  for (const vp of [{ width: 1440, height: 700 }, { width: 375, height: 560 }]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 768 });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await ctx.close();
  }
});

for (const path of PAGES) {
  test(`accessibility (axe, WCAG 2.1 AA): ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
}

for (const path of ['/', '/projets/safeping/', '/parcours/', '/contact/']) {
  test(`accessibility in dark mode: ${path}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
}

test('SEO essentials on every page', async ({ page }) => {
  const titles = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(titles.has(title), `duplicate title ${title}`).toBe(false);
    titles.add(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://clementplancon.fr${path}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/clementplancon\.fr\//);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('home exposes Person and ProfilePage structured data, with real facts', async ({ page }) => {
  await page.goto('/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const data = blocks.map((b) => JSON.parse(b));
  const person = data.find((d) => d['@type'] === 'Person');
  expect(person.name).toBe('Clément Plançon');
  expect(person.jobTitle).toBe('Ingénieur logiciel & Tech Lead');
  expect(person.worksFor.parentOrganization.name).toBe("Ministère de l'Intérieur");
  expect(data.some((d) => d['@type'] === 'ProfilePage')).toBe(true);
});

test('project board: flap names are real text, focus updates the info strip, row opens the project', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  // Screen readers get the real name, not the flap cells.
  await expect(page.getByRole('heading', { name: 'Référentiel Indicateurs', level: 3 })).toHaveCount(1);
  const row = page.locator('[data-row]').nth(1);
  await row.focus();
  await expect(page.locator('[data-strip-code]')).toHaveText('RI');
  await row.press('Enter');
  await expect(page).toHaveURL(/\/projets\/referentiel-indicateurs\/$/);
  await expect(page.getByRole('heading', { name: 'Contexte' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Sections de la page' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Tous les projets/ })).toBeVisible();
});

test('flaps settle on the real names (animation leaves no scrambled text)', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const texts = await page.locator('.flaps').evaluateAll((els) => els.map((e) => e.textContent?.replace(/\s+/g, '')));
  expect(texts).toContain('BERCYVERT');
  expect(texts).toContain('SAISINESDELACOURDESCOMPTES');
});

test('reduced motion: no flap animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(150);
  const first = await page.locator('.flaps').first().textContent();
  expect(first?.replace(/\s+/g, '')).toBe('BERCYVERT');
});

test('sitemap and robots', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://clementplancon.fr/sitemap-index.xml');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const p of PAGES) expect(sitemap).toContain(`https://clementplancon.fr${p}`);
  expect(sitemap).not.toContain('/admin');
});

test('no articles section while no article is published', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Articles' })).toHaveCount(0);
  expect((await request.get('/articles/')).status()).toBe(404);
});

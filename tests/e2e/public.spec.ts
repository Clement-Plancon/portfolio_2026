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

test('gallery: prints are real links with real titles, keyboard opens a project', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Référentiel Indicateurs', level: 3 })).toHaveCount(1);
  // Photograms say what they are; the real capture is described by its alt text.
  await expect(page.getByRole('img', { name: /Photogramme de présentation pour Bercy Vert/ })).toHaveCount(1);
  const card = page.locator('[data-gallery] [data-card]').nth(1);
  await card.focus();
  await expect(card).toBeInViewport();
  await card.press('Enter');
  await expect(page).toHaveURL(/\/projets\/referentiel-indicateurs\/$/);
  await expect(page.getByRole('heading', { name: /Contexte/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Sommaire du projet' })).toBeVisible();
  await expect(page.getByText(/visuel de présentation, pas une capture du produit/)).toBeVisible();
});

test('desktop gallery: the vertical scroll moves the prints sideways, then the page continues', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const gallery = page.locator('[data-gallery]');
  await expect(gallery).toHaveClass(/is-pinned/);
  const last = page.locator('[data-gallery] [data-card]').last();
  await expect(last).not.toBeInViewport();
  const box = await gallery.boundingBox();
  await page.evaluate((y) => window.scrollTo(0, y), (box?.y ?? 0) + (box?.height ?? 0) - 900);
  await expect(last).toBeInViewport();
  await expect(page.locator('[data-count]')).toHaveText('06');
});

test('phones: the gallery is a native horizontal swipe, no pinning', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('[data-gallery]')).not.toHaveClass(/is-pinned/);
  const track = page.locator('[data-track]');
  expect(await track.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await ctx.close();
});

test('prints develop once they come into view (opacity only), and stay developed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projets/');
  const last = page.locator('.print').last();
  await expect(last).toHaveClass(/is-raw/);
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/is-developing/);
  await expect(last).not.toHaveClass(/is-raw/);
});

test('reduced motion: prints are shown developed, never raw', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/projets/');
  await page.waitForTimeout(300);
  await expect(page.locator('.print.is-raw')).toHaveCount(0);
});

test('real capture: true colours on demand', async ({ page }) => {
  await page.goto('/projets/datametre/');
  const btn = page.getByRole('button', { name: 'Voir en couleurs réelles' });
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#project-print')).toHaveClass(/is-true-colors/);
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

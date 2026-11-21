// The public site is a single page (/). These tests run against the production build.
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const SECTIONS = [
  { id: 'a-propos', title: 'À propos' },
  { id: 'projets', title: 'Projets' },
  { id: 'parcours', title: 'Parcours' },
  { id: 'competences', title: 'Compétences' },
  { id: 'contact', title: 'Contact' },
];
const PROJECTS = ['bercy-vert', 'referentiel-indicateurs', 'saisines-cour-des-comptes', 'veille-strategique', 'safeping', 'datametre'];
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`);

const RESOLUTIONS = [
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];

for (const [width, height] of RESOLUTIONS) {
  test(`no horizontal overflow, sections and projects reachable at ${width}×${height}`, async ({ browser }) => {
    const phone = width < 768;
    const ctx = await browser.newContext({ viewport: { width, height }, isMobile: phone, hasTouch: width < 1024 });
    const page = await ctx.newPage();
    await page.goto('/');
    // Scroll through the whole page so every element has risen into place.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
    const nav = page.getByRole('navigation', { name: 'Sommaire' });
    if (phone) await page.getByRole('button', { name: 'Sommaire' }).click();
    await expect(nav.getByRole('link', { name: 'Projets', exact: true })).toBeVisible();
    await nav.getByRole('link', { name: 'Projets', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Projets', level: 2 })).toBeInViewport();
    // A project opens over the page, and its article fits the screen.
    await page.getByRole('link', { name: 'Datametre', exact: true }).click();
    const detail = page.locator('#detail-datametre');
    await expect(detail).toBeVisible();
    await expect(detail.getByRole('link', { name: /Voir le site/ })).toBeAttached();
    expect(await detail.evaluate((d) => d.scrollWidth - d.clientWidth)).toBeLessThanOrEqual(0);
    await detail.getByRole('button', { name: 'Fermer' }).click();
    await expect(detail).toBeHidden();
    await ctx.close();
  });
}

test('short screens keep the name and role readable (1440×700, 375×560)', async ({ browser }) => {
  for (const vp of [{ width: 1440, height: 700 }, { width: 375, height: 560 }]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 768 });
    const page = await ctx.newPage();
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('Clément Plançon');
    await expect(h1).toContainText('Ingénieur logiciel & Tech Lead');
    await expect(h1).toBeInViewport();
    await ctx.close();
  }
});

test('accessibility (axe, WCAG 2.1 AA), light and dark, with a project open', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await violations(page)).toEqual([]);
    await page.getByRole('link', { name: 'Datametre', exact: true }).click();
    await expect(page.locator('#detail-datametre')).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press('Escape');
  }
});

test('accessibility of the 404 page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/une-page-qui-n-existe-pas/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Cette page n'existe pas");
  expect(await violations(page)).toEqual([]);
});

test('SEO essentials of the single page', async ({ page }) => {
  await page.goto('/');
  expect((await page.title()).length).toBeGreaterThan(20);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{80,}/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://clementplancon.fr/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/clementplancon\.fr\//);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/);
  await expect(page.locator('h1')).toHaveCount(1);
  for (const s of SECTIONS) {
    await expect(page.locator(`section#${s.id} h2`)).toHaveText(s.title);
  }
});

test('structured data: Person, ProfilePage and the six projects, with real facts', async ({ page }) => {
  await page.goto('/');
  const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b));
  const person = data.find((d) => d['@type'] === 'Person');
  expect(person.name).toBe('Clément Plançon');
  expect(person.jobTitle).toBe('Ingénieur logiciel & Tech Lead');
  expect(person.worksFor.parentOrganization.name).toBe("Ministère de l'Intérieur");
  expect(data.some((d) => d['@type'] === 'ProfilePage')).toBe(true);
  const list = data.find((d) => d['@type'] === 'ItemList');
  expect(list.itemListElement.map((i: { item: { url: string } }) => i.item.url)).toEqual(PROJECTS.map((p) => `https://clementplancon.fr/#projet-${p}`));
});

test('every project and its details are in the HTML sent by the server, and nothing invented', async ({ request }) => {
  const html = await (await request.get('/')).text();
  for (const id of PROJECTS) {
    expect(html).toContain(`id="projet-${id}"`);
    expect(html).toContain(`id="detail-${id}"`);
  }
  expect(html).toContain('Encadrement technique d&#39;une équipe de quatre développeurs');
  expect(html).not.toContain('Priorisation');
});

test('a project opens with the keyboard, its address follows, previous/next and Escape work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Référentiel Indicateurs', exact: true });
  const detail = page.locator('#detail-referentiel-indicateurs');
  await expect(detail).toBeHidden();
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(detail).toBeVisible();
  await expect(page).toHaveURL(/#projet-referentiel-indicateurs$/);
  await expect(detail.getByText('Gestion des droits et des périmètres utilisateurs')).toBeVisible();
  // Focus moves into the article (a modal dialog): the page behind is out of reach.
  await expect(detail.getByRole('button', { name: 'Fermer' })).toBeFocused();
  expect(await detail.evaluate((d) => (d as HTMLDialogElement).open && d.matches(':modal'))).toBe(true);
  // One project at a time; "next" opens the following one and updates the address.
  await detail.getByRole('link', { name: /Projet suivant : Saisines/ }).click();
  const saisines = page.locator('#detail-saisines-cour-des-comptes');
  await expect(saisines).toBeVisible();
  await expect(detail).toBeHidden();
  await expect(page).toHaveURL(/#projet-saisines-cour-des-comptes$/);
  // Escape closes it and gives the focus back to its line in the list.
  await page.keyboard.press('Escape');
  await expect(saisines).toBeHidden();
  await expect(page.getByRole('link', { name: 'Saisines de la Cour des comptes', exact: true })).toBeFocused();
});

test('Back closes an open project', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'SafePing', exact: true }).click();
  await expect(page.locator('#detail-safeping')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#detail-safeping')).toBeHidden();
  await expect(page).not.toHaveURL(/#projet-/);
});

test('a link to #projet-… opens that project on arrival', async ({ page }) => {
  await page.goto('/#projet-datametre');
  const detail = page.locator('#detail-datametre');
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('link', { name: /Voir le site/ })).toBeVisible();
  await expect(detail.getByRole('img', { name: /Datametre/ })).toBeVisible();
  // Closing lands on the project's line.
  await detail.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.locator('#projet-datametre')).toBeInViewport();
});

test('desktop: hovering a line shows a preview of the project', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  // The preview hides while the page scrolls: wait for the scroll to settle before pointing.
  await page.evaluate(() => document.getElementById('projets')!.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(200);
  await page.locator('#projet-bercy-vert .pj__row').hover();
  await expect(page.locator('.peek')).toHaveClass(/is-on/);
  await expect(page.locator('.peek .plate')).toHaveCount(1);
});

test('reduced motion: nothing waits for an animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/motion/);
  const hidden = await page.locator('[data-reveal]').evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
  expect(hidden).toBe(0);
  await page.getByRole('link', { name: 'Bercy Vert', exact: true }).click();
  // The plate is drawn spread out at once.
  expect(await page.locator('#detail-bercy-vert .plate').evaluate((el) => getComputedStyle(el).getPropertyValue('--spread').trim())).toBe('1');
});

test('without JavaScript every detail is readable', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('#detail-bercy-vert').getByText('Cadrage du projet et expression des besoins fonctionnels avec les parties prenantes')).toBeVisible();
  await expect(page.locator('#detail-datametre').getByRole('link', { name: /Voir le site/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Projets', exact: true })).toBeVisible();
  await ctx.close();
});

test('phones: the table of contents unfolds, closes with Escape and after a choice', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Sommaire' });
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  await button.click();
  await page.getByRole('navigation', { name: 'Sommaire' }).getByRole('link', { name: 'Contact' }).click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { name: 'Contact', level: 2 })).toBeInViewport();
  await ctx.close();
});

test('contact: the address can be copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#contact');
  await page.getByRole('button', { name: "Copier l'adresse" }).click();
  await expect(page.getByRole('status')).toHaveText('Adresse copiée.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('plancon.clem.pro@gmail.com');
});

test('sitemap and robots', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://clementplancon.fr/sitemap-index.xml');
  expect(robots).toContain('Disallow: /admin/');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('<loc>https://clementplancon.fr/</loc>');
  expect(sitemap.match(/<loc>/g)).toHaveLength(1);
});

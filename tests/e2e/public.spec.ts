// The public site is a single page (/). These tests run against the production build.
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

// The four parts; the path and the skills are told inside « à propos ».
const SECTIONS = [
  { sel: 'section#projets h2', title: /^\s*Projets/ },
  { sel: 'section#a-propos h2', title: 'À propos' },
  { sel: '#a-propos #parcours h3', title: 'Parcours' },
  { sel: '#a-propos #competences h3', title: 'Domaines' },
  { sel: 'section#contact h2', title: 'Travaillons ensemble.' },
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
    // The navigation is always on screen (at the bottom on phones).
    const nav = page.getByRole('navigation', { name: 'Sommaire' });
    await expect(nav.getByRole('link', { name: /Projets/ })).toBeInViewport();
    await nav.getByRole('link', { name: /Projets/ }).click();
    await expect(page.getByRole('heading', { name: /^Projets/, level: 2 })).toBeInViewport();
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
    await expect(h1).toHaveText(/^\s*Clément\s+Plançon\s*$/);
    await expect(h1).toBeInViewport();
    await expect(page.locator('.hero__role')).toHaveText('Ingénieur logiciel & Tech Lead');
    // the name never runs out of the screen
    expect(await page.locator('.hero__word').evaluateAll((els) => els.every((e) => e.getBoundingClientRect().right <= innerWidth))).toBe(true);
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Page introuvable');
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
    await expect(page.locator(s.sel)).toHaveText(s.title);
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
  expect(html).toContain('Chef adjoint de la section informatique');
  expect(html).toContain('Cadrage du projet et expression des besoins fonctionnels');
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
  await detail.getByRole('link', { name: /Projet suivant : SafePing/ }).click();
  const saisines = page.locator('#detail-safeping');
  await expect(saisines).toBeVisible();
  await expect(detail).toBeHidden();
  await expect(page).toHaveURL(/#projet-safeping$/);
  // Escape closes it and gives the focus back to its title on the page.
  await page.keyboard.press('Escape');
  await expect(saisines).toBeHidden();
  await expect(page.getByRole('link', { name: 'SafePing', exact: true })).toBeFocused();
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

test('introduction: the posters of the pile open their project, can be shuffled and moved', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const pile = page.locator('[data-pile]');
  const cards = pile.locator('[data-pile-card]');
  await expect(cards).toHaveCount(4);
  await page.waitForTimeout(1600);
  const topOf = () => cards.evaluateAll((els) => els.reduce((a, b) => (Number(getComputedStyle(b).zIndex) > Number(getComputedStyle(a).zIndex) ? b : a)).getAttribute('href'));
  // drag the top poster with the mouse: it moves, and does not open its project
  const card = cards.last();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 200, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const moved = (await card.boundingBox())!;
  expect(box.x - moved.x).toBeGreaterThan(150);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // shuffle: the top poster goes under the others
  const before = await topOf();
  await pile.getByRole('button', { name: 'Mélanger les affiches' }).click();
  await page.waitForTimeout(800);
  expect(await topOf()).not.toBe(before);
  // a click opens it
  await pile.getByRole('link', { name: 'Ouvrir le projet SafePing' }).click({ force: true });
  await expect(page.locator('#detail-safeping')).toBeVisible();
  await expect(page).toHaveURL(/#projet-safeping$/);
});

test('the other projects are a strip of small posters that opens the same article', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const strip = page.locator('[data-strip-list]');
  await expect(strip.locator('[data-project]')).toHaveCount(2);
  await strip.getByRole('link', { name: 'Veille Stratégique', exact: true }).click();
  await expect(page.locator('#detail-veille-strategique')).toBeVisible();
});

test('no WebGL, no canvas: the page is plain HTML and CSS', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await expect(page.locator('canvas')).toHaveCount(0);
  const scripts = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /engine|three|webgl/i.test(n)));
  expect(scripts).toEqual([]);
});

test('reduced motion: posters still, nothing waits for an animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(800);
  await expect(page.locator('html')).not.toHaveClass(/motion/);
  const hidden = await page.locator('[data-reveal]').evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
  expect(hidden).toBe(0);
  await page.getByRole('link', { name: 'Bercy Vert', exact: true }).click();
  await expect(page.locator('#detail-bercy-vert')).toBeVisible();
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

test('phones: the navigation sits at the bottom of the screen, within reach of the thumb', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Sommaire' });
  const box = (await nav.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(844 - 24);
  expect(box.y).toBeGreaterThan(844 * 0.8);
  for (const link of await nav.getByRole('link').all()) {
    const b = (await link.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  await nav.getByRole('link', { name: /Contact/ }).click();
  await expect(page.getByRole('heading', { name: 'Travaillons ensemble.', level: 2 })).toBeInViewport();
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

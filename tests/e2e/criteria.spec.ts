// The success criteria of the administrable portfolio, done the way a person would, in the admin UI,
// on the real server (SSR function + emulated Netlify Blobs), without touching the code:
//  1 log in · 2 change visible texts · 3 replace the home media · 4 add a project · 5 put it forward ·
//  6 reorder it · 7 add a position · 8 change the current position · 9 hide a section · 10 preview ·
// 11 publish · 12 check the public page on several screens.
// It changes the published content, so it runs after every other test (playwright.config.ts) and puts
// the content back as it was at the end (backup, restore, publish).
import { expect, type Page, test } from '@playwright/test';
import { E2E_PASSWORD } from '../../playwright.config';

test.describe.configure({ mode: 'serial' });

/** The form's own status (a toast of the previous save could still be on screen). */
const saved = (page: Page) => expect(page.locator('.form-actions__status')).toHaveText('Tout est enregistré', { timeout: 15_000 });
const api = (page: Page, path: string, body?: unknown) =>
  page.evaluate(
    async ([path, body]) => {
      const r = await fetch(`/api/admin${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: r.status, json: await r.json().catch(() => null) };
    },
    [path, body] as const,
  );

test('the whole site is edited from the admin, previewed, published, and holds on every screen', async ({ page, browser }) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(15_000);
  // 1. Log in.
  await page.goto('/admin/');
  await page.getByLabel('Mot de passe').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Bonjour' })).toBeVisible();
  const backup = (await api(page, '/backup')).json;
  expect(backup?.snapshot).toBeTruthy();

  try {
    // 2–3. Home: a visible text and the home media.
    await page.goto('/admin/#/site/accueil');
    await page.getByLabel('Titre professionnel').fill('Architecte logiciel — test des critères');
    await page.getByLabel('Courte présentation').fill('Une présentation modifiée depuis l’administration, avec des accents : é, è, ç, œ.');
    await page.getByRole('button', { name: 'Choisir une image ou une vidéo dans la médiathèque' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /datametre-apercu/ }).click();
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await saved(page);

    // 9. Hide a section, rename another in the navigation.
    await page.goto('/admin/#/site/sections');
    await expect(page.getByText('Sections de la page')).toBeVisible();
    const skills = page.locator('.section-item', { hasText: 'Compétences' });
    await skills.getByText('Afficher cette section').click();
    await page.locator('.section-item', { hasText: 'À propos' }).getByLabel('Nom dans le menu').fill('Qui je suis');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await saved(page);

    // 4–5. Add a project with the essentials only, put forward.
    await page.goto('/admin/#/projets/nouveau');
    await expect(page.getByRole('heading', { name: 'Nouveau projet', level: 1 })).toBeVisible();
    await page.getByRole('textbox', { name: 'Titre', exact: true }).fill('Projet des critères');
    await page.getByLabel('Description courte').fill('Un projet ajouté depuis l’administration, sans image ni lien.');
    await page.getByRole('switch', { name: /^Mis en avant/ }).check();
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await saved(page);

    // 6. Reorder it: one place up.
    await page.goto('/admin/#/projets');
    await expect(page.getByRole('heading', { name: 'Projets', level: 1 })).toBeVisible();
    const row = page.locator('.row', { hasText: 'Projet des critères' });
    await expect(row.locator('.badge')).toHaveText(/En grand|Autres réalisations/);
    await row.getByRole('button', { name: 'Monter' }).click();
    await page.getByRole('button', { name: "Enregistrer l'ordre" }).click();
    await expect(page.locator('.order-bar')).toContainText('Glissez les lignes', { timeout: 15_000 });
    await expect(page.locator('.row').nth(-2)).toContainText('Projet des critères');

    // 7. Add a position (current by default).
    await page.goto('/admin/#/experiences/nouveau');
    await expect(page.getByRole('heading', { name: 'Nouvelle expérience', level: 1 })).toBeVisible();
    await page.getByLabel('Intitulé du poste').fill('Poste ajouté pour les critères');
    await page.getByRole('textbox', { name: 'Organisation', exact: true }).fill('Organisation des critères');
    await page.getByRole('textbox', { name: 'Début', exact: true }).fill('2026');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await saved(page);

    // 8. Change the current position.
    await page.goto('/admin/#/experiences/laboratoire-police-scientifique');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Chef adjoint');
    await page.getByLabel('Intitulé du poste').fill('Chef de la section informatique — test des critères');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await saved(page);

    // 10. Preview: the draft, with the same components, at several screen sizes.
    await page.goto('/admin/#/apercu');
    await expect(page.getByRole('heading', { name: 'Aperçu', level: 1 })).toBeVisible();
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('.hero__role')).toHaveText('Architecte logiciel — test des critères');
    await page.getByRole('button', { name: /^Téléphone/ }).click();
    await expect(page.locator('iframe')).toHaveAttribute('width', '390');
    await expect(frame.locator('#projet-projet-des-criteres')).toHaveCount(1);
    await expect(frame.locator('#competences')).toHaveCount(0);

    // 11. Publish.
    await page.getByRole('button', { name: 'Publier le site' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publier' }).click();
    await expect(page.getByText('Publié : le site public est à jour.')).toBeVisible();

    // 12. The public page, on several screens.
    for (const [width, height] of [
      [390, 844],
      [820, 1180],
      [1440, 900],
    ]) {
      const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 1024 });
      const pub = await ctx.newPage();
      await pub.goto('/');
      await expect(pub.locator('.hero__role')).toHaveText('Architecte logiciel — test des critères');
      await expect(pub.locator('.pile__card--media img')).toBeVisible();
      await expect(pub.locator('#projet-projet-des-criteres')).toHaveCount(1);
      await expect(pub.locator('#competences')).toHaveCount(0);
      await expect(pub.getByRole('navigation', { name: 'Sommaire' }).getByRole('link', { name: /Qui je suis/ })).toBeVisible();
      await expect(pub.locator('#parcours')).toContainText('Poste ajouté pour les critères');
      await expect(pub.locator('#parcours')).toContainText('Chef de la section informatique — test des critères');
      expect(await pub.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      await ctx.close();
    }
  } finally {
    // Put the content back as it was, and publish it.
    // the restore checks that the draft has not changed since it was read (its revision)
    const content = (await api(page, '/content')).json;
    const restored = await api(page, '/restore', { backup, expectedRev: content?.ref?.sha });
    expect(restored.status).toBe(200);
    await api(page, '/publish', {});
  }
  const html = await (await page.request.get('/')).text();
  expect(html).not.toContain('test des critères');
});

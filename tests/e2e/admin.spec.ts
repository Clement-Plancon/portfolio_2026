// Admin scenarios in a real browser.
// - /api/admin/* is served by the REAL API handler (src/server), authentication included (Argon2id hash,
//   signed HttpOnly session cookie, rate limiting), running in the test process with an in-memory store
//   in place of Netlify Blobs and an in-memory GitHub seeded with the repository's content.
// What these tests cannot cover (real Netlify Blobs, real GitHub, real Netlify deploys) is listed
// in docs/netlify-deployment.md, "Vérifications en conditions réelles".
import { expect, type Page, test } from '@playwright/test';
import { Cms } from '../../src/server/cms';
import type { GitHub } from '../../src/server/github';
import { createHandler } from '../../src/server/handler';
import { COOKIE } from '../../src/server/session';
import { TEST_PASSWORD as PASSWORD, testAuth } from '../helpers/admin-auth';
import { FakeGitHub } from '../helpers/fake-github';

async function setup(page: Page) {
  const gh = FakeGitHub.fromDir(process.cwd(), ['src/content', 'src/assets/media']);
  const { auth } = await testAuth();
  const handle = createHandler({ cms: new Cms(gh as unknown as GitHub, { branch: 'main', draftBranch: 'cms-draft' }), auth, log: () => {} });

  await page.route('**/api/admin/**', async (route) => {
    const r = route.request();
    const headers = await r.allHeaders();
    const res = await handle(
      new Request(r.url(), { method: r.method(), headers, body: ['GET', 'HEAD'].includes(r.method()) ? undefined : new Uint8Array(r.postDataBuffer() ?? []) }),
      { ip: '127.0.0.1' },
    );
    await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) });
  });
  return gh;
}

async function login(page: Page, password = PASSWORD) {
  await page.goto('/admin/');
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

test('unauthorized access: login screen, and the API refuses anonymous calls', async ({ page }) => {
  await setup(page);
  await page.goto('/admin/');
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
  // Only a password field: no e-mail, no invitation, no "forgotten password".
  await expect(page.locator('input:visible')).toHaveCount(1);
  await expect(page.getByLabel('Adresse e-mail')).toHaveCount(0);
  await expect(page.getByText(/oublié/i)).toHaveCount(0);
  const status = await page.evaluate(async () => (await fetch('/api/admin/content')).status);
  expect(status).toBe(401);
});

test('the session cookie is HttpOnly, Secure and SameSite=Strict, invisible to JavaScript', async ({ page, context }) => {
  await setup(page);
  await login(page);
  await expect(page.getByRole('heading', { name: 'Bonjour' })).toBeVisible();
  const c = (await context.cookies()).find((x) => x.name === COOKIE);
  expect(c).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
  expect(await page.evaluate(() => document.cookie)).not.toContain('cms_session');
});

test('wrong password shows a generic error, then repeated attempts are blocked', async ({ page }) => {
  await setup(page);
  await login(page, 'nope');
  await expect(page.getByRole('alert')).toHaveText('Connexion refusée. Vérifiez le mot de passe.');
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('Mot de passe').fill(`mauvais ${i}`);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeEnabled();
  }
  await expect(page.getByRole('alert')).toHaveText('Trop de tentatives. Réessayez plus tard.');
});

test('full flow: login, edit, save, reload, publish, logout', async ({ page }) => {
  const gh = await setup(page);
  page.on('dialog', (d) => d.accept());

  // 1. Login
  await login(page);
  await expect(page.getByRole('heading', { name: 'Bonjour' })).toBeVisible();
  await expect(page.locator('.stats').getByText('Projets')).toBeVisible();
  await expect(page.locator('.stats__value').first()).toHaveText('6');

  // 2. Edit a project
  await page.getByRole('navigation', { name: 'Administration' }).getByRole('link', { name: 'Projets' }).click();
  await page.getByRole('link', { name: /Bercy Vert/ }).click();
  const summary = page.getByLabel('Résumé');
  await summary.fill('Résumé modifié depuis le back-office.');
  await page.getByRole('button', { name: 'Ajouter un résultat' }).click();
  await page.getByLabel('Résultats vérifiés 1').fill('Résultat de test');

  // 3. Save
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByText('Enregistré. Les modifications sont dans le brouillon.')).toBeVisible();
  expect(gh.read('cms-draft', 'src/content/projects/bercy-vert.json')).toContain('Résumé modifié depuis le back-office.');
  expect(gh.read('main', 'src/content/projects/bercy-vert.json')).not.toContain('Résumé modifié');

  // 4-5. Reload: the change persisted and is pending publication
  await page.reload();
  await expect(page.getByLabel('Résumé')).toHaveValue('Résumé modifié depuis le back-office.');
  await expect(page.locator('.publish-bar')).toContainText('non publié');

  // Validation is enforced before saving
  await page.getByRole('textbox', { name: 'Titre', exact: true }).fill('');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.locator('.form-alert')).toBeVisible();
  await page.getByRole('button', { name: 'Annuler les changements' }).click();

  // 6. Publish
  await page.getByRole('button', { name: 'Publier le site' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publier' }).click();
  await expect(page.getByText('Publication lancée')).toBeVisible();
  await expect(page.locator('.publish-bar')).toContainText('Le site est à jour');
  // 7-8. Main now holds the content the production build will use
  expect(gh.read('main', 'src/content/projects/bercy-vert.json')).toContain('Résumé modifié depuis le back-office.');

  // 9. Logout: the server forgets the session, so even a copy of the cookie stops working.
  const before = (await page.context().cookies()).find((c) => c.name === COOKIE)!;
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByText('Vous êtes déconnecté.')).toBeVisible();
  await page.context().addCookies([before]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
  expect(await page.evaluate(async () => (await fetch('/api/admin/content')).status)).toBe(401);
});

test('create, reorder, hide and delete', async ({ page }) => {
  const gh = await setup(page);
  await login(page);
  await page.goto('/admin/#/projets/nouveau');
  await page.getByRole('textbox', { name: 'Titre', exact: true }).fill('Projet de test');
  await expect(page.getByLabel('Adresse du projet')).toHaveValue('projet-de-test');
  await page.getByLabel('Résumé').fill('Un projet créé pendant les tests.');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page).toHaveURL(/#\/projets\/projet-de-test$/);
  expect(gh.read('cms-draft', 'src/content/projects/projet-de-test.json')).toContain('"visible": false');

  // Through the menu (a hash-only goto can race with the editor's own redirect after saving).
  await page.getByRole('navigation', { name: 'Administration' }).getByRole('link', { name: 'Projets' }).click();
  await expect(page).toHaveURL(/#\/projets$/);
  const row = page.locator('.row', { hasText: 'Projet de test' });
  await row.getByRole('button', { name: 'Monter' }).click();
  await page.getByRole('button', { name: "Enregistrer l'ordre" }).click();
  await expect(page.getByText('Nouvel ordre enregistré.')).toBeVisible();

  await row.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByText('Contenu supprimé.')).toBeVisible();
  expect(gh.read('cms-draft', 'src/content/projects/projet-de-test.json')).toBeUndefined();
});

test('expired session: re-login without losing the open form', async ({ page, context }) => {
  const gh = await setup(page);
  await login(page);
  await page.goto('/admin/#/experiences/outils-publics');
  await page.getByLabel('Résumé').fill('Texte saisi avant expiration.');
  await context.clearCookies(); // the session cookie expires
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByText('Votre session a expiré')).toBeVisible();
  await page.getByLabel('Mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByLabel('Résumé')).toHaveValue('Texte saisi avant expiration.');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByText('Enregistré.', { exact: false })).toBeVisible();
  expect(gh.read('cms-draft', 'src/content/experiences/outils-publics.json')).toContain('Texte saisi avant expiration.');
});

test('admin is usable on a phone', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await setup(page);
  await login(page);
  await expect(page.getByRole('heading', { name: 'Bonjour' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('navigation', { name: 'Administration' }).getByRole('link', { name: 'Médias' }).click();
  await expect(page.getByRole('heading', { name: 'Médiathèque' })).toBeVisible();
  await ctx.close();
});

// Visual review helper: SNAP_DIR=/some/dir npx playwright test admin -g screenshots
test('screenshots', async ({ page }) => {
  test.skip(!process.env.SNAP_DIR, 'set SNAP_DIR to capture admin screenshots');
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await expect(page.getByRole('heading', { name: 'Bonjour' })).toBeVisible();
  await page.screenshot({ path: `${process.env.SNAP_DIR}/admin-dashboard.png` });
  await page.goto('/admin/#/projets');
  await page.screenshot({ path: `${process.env.SNAP_DIR}/admin-projects.png` });
  await page.goto('/admin/#/projets/datametre');
  await page.getByLabel('Résumé').fill('Modifié');
  await page.screenshot({ path: `${process.env.SNAP_DIR}/admin-editor.png` });
  await page.getByRole('button', { name: 'Annuler les changements' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/#/medias');
  await page.screenshot({ path: `${process.env.SNAP_DIR}/admin-mobile.png` });
});

// Admin scenarios in a real browser.
// - Netlify Identity is mocked at /.netlify/identity (token + user endpoints).
// - /api/admin/* is served by the REAL API handler (src/server) running in the test process,
//   backed by an in-memory GitHub seeded with the repository's content. State survives page reloads.
// What these tests cannot cover (real Identity e-mails, real GitHub, real Netlify deploys) is listed
// in docs/netlify-deployment.md, "Vérifications en conditions réelles".
import { expect, type Page, test } from '@playwright/test';
import { Cms } from '../../src/server/cms';
import type { GitHub } from '../../src/server/github';
import { createHandler } from '../../src/server/handler';
import { FakeGitHub } from '../helpers/fake-github';

const ADMIN = 'admin@example.com';
const PASSWORD = 'correct horse battery staple';
const OTHER = 'intrus@example.com';

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwtFor = (email: string) =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: `id-${email}`, email, exp: Math.floor(Date.now() / 1000) + 3600, app_metadata: {}, user_metadata: {} })}.sig`;
const emailFromJwt = (jwt?: string) => {
  try {
    return JSON.parse(Buffer.from(jwt!.split('.')[1], 'base64url').toString()).email as string;
  } catch {
    return null;
  }
};
const cookie = (header: string | undefined, name: string) => header?.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

async function setup(page: Page) {
  const gh = FakeGitHub.fromDir(process.cwd(), ['src/content', 'src/assets/media']);
  const handle = createHandler({
    cms: new Cms(gh as unknown as GitHub, { branch: 'main', draftBranch: 'cms-draft' }),
    // Stand-in for Netlify's verification: the runtime would reject forged tokens.
    getUser: async (req) => {
      const email = emailFromJwt(decodeURIComponent(cookie(req.headers.get('cookie') ?? undefined, 'nf_jwt') ?? ''));
      return email ? { email } : null;
    },
    verifyOrigin: (req) => {
      if (req.headers.get('origin') !== new URL(req.url).origin) throw new Error('origin');
    },
    adminEmails: [ADMIN],
    log: () => {},
  });

  await page.route('**/.netlify/identity/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/.netlify/identity', '');
    if (path === '/token') {
      const form = new URLSearchParams(req.postData() ?? '');
      const email = form.get('username');
      if (form.get('grant_type') === 'password' && form.get('password') === PASSWORD && (email === ADMIN || email === OTHER)) {
        return route.fulfill({ json: { access_token: jwtFor(email), token_type: 'bearer', expires_in: 3600, refresh_token: 'r' } });
      }
      return route.fulfill({ status: 400, json: { error: 'invalid_grant', error_description: 'Invalid email or password' } });
    }
    if (path === '/user') {
      const email = emailFromJwt(req.headers().authorization?.replace('Bearer ', ''));
      return email ? route.fulfill({ json: { id: `id-${email}`, email, aud: '', role: '', app_metadata: { provider: 'email' }, user_metadata: {} } }) : route.fulfill({ status: 401, json: {} });
    }
    if (path === '/logout') return route.fulfill({ status: 204 });
    if (path === '/recover') return route.fulfill({ json: {} });
    if (path === '/settings') return route.fulfill({ json: { external: { email: true }, disable_signup: true, autoconfirm: false } });
    return route.fulfill({ status: 404, json: {} });
  });

  await page.route('**/api/admin/**', async (route) => {
    const r = route.request();
    const headers = await r.allHeaders();
    const res = await handle(
      new Request(r.url(), { method: r.method(), headers, body: ['GET', 'HEAD'].includes(r.method()) ? undefined : new Uint8Array(r.postDataBuffer() ?? []) }),
    );
    await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) });
  });
  return gh;
}

async function login(page: Page, email = ADMIN, password = PASSWORD) {
  await page.goto('/admin/');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

test('unauthorized access: login screen, and the API refuses anonymous calls', async ({ page }) => {
  await setup(page);
  await page.goto('/admin/');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  const status = await page.evaluate(async () => (await fetch('/api/admin/content')).status);
  expect(status).toBe(401);
});

test('wrong password shows an error', async ({ page }) => {
  await setup(page);
  await login(page, ADMIN, 'nope');
  await expect(page.getByRole('alert')).toContainText('incorrect');
});

test('an authenticated account outside ADMIN_EMAILS is denied', async ({ page }) => {
  await setup(page);
  await login(page, OTHER);
  await expect(page.getByRole('heading', { name: 'Accès refusé' })).toBeVisible();
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

  // 9. Logout
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByText('Vous êtes déconnecté.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
});

test('create, reorder, hide and delete', async ({ page }) => {
  const gh = await setup(page);
  await login(page);
  await page.goto('/admin/#/projets/nouveau');
  await page.getByRole('textbox', { name: 'Titre', exact: true }).fill('Projet de test');
  await expect(page.getByLabel('Adresse de la page')).toHaveValue('projet-de-test');
  await page.getByLabel('Résumé').fill('Un projet créé pendant les tests.');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page).toHaveURL(/#\/projets\/projet-de-test$/);
  expect(gh.read('cms-draft', 'src/content/projects/projet-de-test.json')).toContain('"visible": false');

  await page.goto('/admin/#/projets');
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
  await page.getByLabel('Adresse e-mail').fill(ADMIN);
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

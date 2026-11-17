// The whole chain on the real server (`netlify serve`: SSR function + emulated Netlify Blobs), no mocks:
// log in through the admin UI, edit, save a draft, preview, publish, and see the public page change
// without any rebuild. Tests run in order and share the server's state.
import { expect, type Page, test } from '@playwright/test';
import { E2E_PASSWORD } from '../../playwright.config';

test.describe.configure({ mode: 'serial' });

const NEW_SUMMARY = 'Résumé publié depuis le back-office, sans redéploiement.';

async function login(page: Page) {
  await page.goto('/admin/');
  await page.getByLabel('Mot de passe').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Bonjour' })).toBeVisible();
}

test('3. the public page is rendered from the published content, cacheable by the CDN only', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  for (const id of ['bercy-vert', 'referentiel-indicateurs', 'saisines-cour-des-comptes', 'veille-strategique', 'safeping', 'datametre']) {
    expect(html).toContain(`id="projet-${id}"`);
  }
  expect(res.headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
  expect(res.headers()['netlify-cdn-cache-control']).toContain('durable');
  expect(res.headers()['netlify-cache-tag']).toBe('cms-public');
  // The existing image is served from Blobs, immutable under its versioned URL.
  const src = html.match(/src="(\/media\/datametre-apercu\.webp\?v=[0-9a-f]{12})"/)?.[1];
  expect(src).toBeTruthy();
  const img = await request.get(src!);
  expect(img.status()).toBe(200);
  expect(img.headers()['content-type']).toBe('image/webp');
  expect(img.headers()['cache-control']).toContain('immutable');
});

test('5. visitors cannot see drafts: no preview, no admin API, nothing private in the public page', async ({ request }) => {
  const preview = await request.get('/admin/apercu/', { maxRedirects: 0 });
  expect(preview.status()).toBe(303);
  expect(preview.headers().location).toBe('/admin/');
  expect(preview.headers()['cache-control']).toContain('no-store');
  for (const path of ['/api/admin/content', '/api/admin/status', '/api/admin/backup', '/api/admin/media/file?ref=media/datametre-apercu.webp']) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(401);
    expect(r.headers()['cache-control']).toBe('no-store');
  }
});

test('4, 7, 10, 12. edit a project in the admin, preview the draft, publish, and the public page changes', async ({ page, request, context }) => {
  await login(page);
  await page.getByRole('navigation', { name: 'Administration' }).getByRole('link', { name: 'Projets' }).click();
  await page.getByRole('link', { name: /SafePing/ }).click();
  await page.getByLabel('Résumé').fill(NEW_SUMMARY);
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByText('Enregistré. Les modifications sont dans le brouillon.')).toBeVisible();

  // Saved as a draft: the public page has not changed.
  expect(await (await request.get('/')).text()).not.toContain(NEW_SUMMARY);

  // 4. The administrator sees the draft in the preview (private, not indexable).
  const [preview] = await Promise.all([context.waitForEvent('page'), page.getByRole('link', { name: /Voir l'aperçu/ }).click()]);
  await expect(preview.locator('#detail-safeping')).toContainText(NEW_SUMMARY);
  await expect(preview.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(preview.getByRole('note')).toContainText('Aperçu du brouillon');
  await preview.close();

  // 10. Publish.
  await page.getByRole('button', { name: 'Publier le site' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publier' }).click();
  await expect(page.getByText('Publié : le site public est à jour.')).toBeVisible();
  await expect(page.locator('.publish-bar')).toContainText('Le site est à jour');

  // 12. The public page shows it at once: no commit, no build.
  const html = await (await request.get('/')).text();
  expect(html).toContain(NEW_SUMMARY);
  // The admin session cookie never leaks into the public page.
  expect(html).not.toContain('cms_session');
});

test('13. an image added in the admin stays private until published, then is served publicly', async ({ page, request }) => {
  await login(page);
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)]);
  const upload = await page.evaluate(
    async (b64) =>
      (
        await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
          body: JSON.stringify({ fileName: 'essai-e2e.png', contentBase64: b64, alt: 'Essai' }),
        })
      ).status,
    png.toString('base64'),
  );
  expect(upload).toBe(201);
  expect((await request.get('/media/essai-e2e.png')).status()).toBe(404);
  expect(await page.evaluate(async () => (await fetch('/api/admin/media/file?ref=media/essai-e2e.png')).status)).toBe(200);
  const pub = await page.evaluate(async () => (await (await fetch('/api/admin/publish', { method: 'POST', headers: { 'X-CMS-Request': '1' } })).json()) as { published: boolean });
  expect(pub.published).toBe(true);
  const file = await request.get('/media/essai-e2e.png');
  expect(file.status()).toBe(200);
  expect(Buffer.from(await file.body())).toEqual(png);
});

test('15, 16. download a backup and restore it into the draft from the settings', async ({ page }) => {
  await login(page);
  await page.getByRole('navigation', { name: 'Administration' }).getByRole('link', { name: 'Paramètres' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Télécharger une sauvegarde' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^clementplancon-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString('utf8')));
  expect(backup.format).toBe('clementplancon-cms-backup');
  expect(JSON.stringify(backup.snapshot.entries)).toContain(NEW_SUMMARY);

  // Restore it (the draft becomes the backup; nothing else changes).
  page.on('dialog', (d) => d.accept());
  await page.locator('input[type="file"]').setInputFiles({ name: 'sauvegarde.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('dialog').getByRole('button', { name: 'Restaurer dans le brouillon' }).click();
  await expect(page.getByText(/Sauvegarde restaurée dans le brouillon \(6 projets/)).toBeVisible();

  // An invalid file is refused with a clear message.
  await page.locator('input[type="file"]').setInputFiles({ name: 'autre.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"autre"}') });
  await page.getByRole('dialog').getByRole('button', { name: 'Restaurer dans le brouillon' }).click();
  await expect(page.getByText("Ce fichier n'est pas une sauvegarde de cette administration.")).toBeVisible();
});

test('the session ends with logout on the real server too', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByText('Vous êtes déconnecté.')).toBeVisible();
  expect(await page.evaluate(async () => (await fetch('/api/admin/content')).status)).toBe(401);
  await page.goto('/admin/apercu/');
  await expect(page).toHaveURL(/\/admin\/$/);
});

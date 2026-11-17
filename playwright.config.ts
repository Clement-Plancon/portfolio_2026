import { defineConfig, devices } from '@playwright/test';

// Browser tests run against the production build served by the Netlify CLI (`netlify serve --offline`):
// the real SSR function, with Netlify Blobs emulated in .netlify/blobs-serve (emptied before each run, so
// every run starts with a first initialisation from src/content).
//
// TEST-ONLY credentials, used nowhere else: the hash of E2E_PASSWORD and a session secret for this server.
export const E2E_PASSWORD = 'e2e: correct horse battery staple';
const E2E_HASH = '$argon2id$v=19$m=19456,t=2,p=1$6ZRDN9ZbQRhlUd6nho4H1Q$Twh/sQ6Rx0hNf1PK4BA3I8scjI5GoaodARnjTKERPOg';
const E2E_SECRET = 'ST9hy8Pw4qvuFkbtZTx3VwbgMjFKVgf0q58GIoAsU9M';
const PORT = 8888;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `rm -rf .netlify/blobs-serve && npx netlify serve --offline --port ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: false,
    timeout: 300_000,
    // NODE_OPTIONS is reset: some environments set flags that Node refuses in the CLI's function workers.
    env: { ADMIN_PASSWORD_HASH: E2E_HASH, ADMIN_SESSION_SECRET: E2E_SECRET, NODE_OPTIONS: '--max-old-space-size=4096' },
  },
  // CHROMIUM_PATH: use an already installed Chromium when the one matching this Playwright version is absent.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} },
    },
  ],
});

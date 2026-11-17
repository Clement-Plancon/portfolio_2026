import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npx astro preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  // CHROMIUM_PATH: use an already installed Chromium when the one matching this Playwright version is absent.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} },
    },
  ],
});

// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://clementplancon.fr',
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  build: { inlineStylesheets: 'never', format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    preact(),
    sitemap({ filter: (page) => !page.includes('/admin') && !page.includes('/404') }),
  ],
});

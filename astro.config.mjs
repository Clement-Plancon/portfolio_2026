// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import preact from '@astrojs/preact';

// Pages are prerendered by default (404, admin shell, robots, sitemap). The one-page ("/"), its media and
// the admin API/preview are rendered on request (prerender = false) from content stored in Netlify Blobs.
export default defineConfig({
  site: 'https://clementplancon.fr',
  trailingSlash: 'ignore',
  output: 'static',
  adapter: netlify({ imageCDN: false, devFeatures: { images: false, edgeFunctions: false, environmentVariables: false } }),
  compressHTML: true,
  build: { inlineStylesheets: 'always', format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [preact()],
  devToolbar: { enabled: false },
});

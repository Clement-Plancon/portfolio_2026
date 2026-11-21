// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import preact from '@astrojs/preact';

// Pages are prerendered by default (404, admin shell, robots, sitemap). The one-page ("/"), its media and
// the admin API/preview are rendered on request (prerender = false) from content stored in Netlify Blobs.
// Content scenarios (TEST ONLY): pages that render the one-page with fictitious content, to check the
// design with 0, 1, 4, 12 projects… They exist only in builds made with CONTENT_SCENARIOS=1 (the browser
// tests, playwright.config.ts); a production build contains neither the routes nor their data.
/** @type {import('astro').AstroIntegration} */
const scenarios = {
  name: 'content-scenarios',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      if (process.env.CONTENT_SCENARIOS !== '1') return;
      injectRoute({ pattern: '/__scenarios/[name]', entrypoint: './src/scenarios/page.astro', prerender: false });
      injectRoute({ pattern: '/__scenarios/media/[file]', entrypoint: './src/scenarios/media.ts', prerender: false });
    },
  },
};

export default defineConfig({
  site: 'https://clementplancon.fr',
  trailingSlash: 'ignore',
  output: 'static',
  adapter: netlify({ imageCDN: false, devFeatures: { images: false, edgeFunctions: false, environmentVariables: false } }),
  compressHTML: true,
  build: { inlineStylesheets: 'always', format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [preact(), scenarios],
  devToolbar: { enabled: false },
});

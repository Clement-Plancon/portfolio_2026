import type { APIRoute } from 'astro';
import { SHOW_DRAFTS } from '../lib/content';

// Preview deploys (CMS drafts) are fully closed to crawlers; production is open except /admin.
export const GET: APIRoute = ({ site }) => {
  const body = SHOW_DRAFTS
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

import type { APIRoute } from 'astro';

// Deploy previews and branch deploys are closed to crawlers; production is open except /admin.
const production = !process.env.CONTEXT || process.env.CONTEXT === 'production';

export const GET: APIRoute = ({ site }) => {
  const body = production
    ? `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

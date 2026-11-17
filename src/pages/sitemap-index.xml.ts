import type { APIRoute } from 'astro';

// The site is one page: one sitemap with one address (same URLs as the former @astrojs/sitemap output).
export const GET: APIRoute = ({ site }) =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${new URL('/sitemap-0.xml', site).href}</loc></sitemap></sitemapindex>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );

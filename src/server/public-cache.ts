// Cache rules of public responses. Pages are kept by Netlify's CDN until a publication purges them;
// browsers always revalidate. Private responses (admin, preview, drafts) are never stored anywhere.
import { PUBLIC_CACHE_TAG } from './runtime';

export function setPublicCache(headers: Headers) {
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('Netlify-CDN-Cache-Control', 'public, durable, s-maxage=31536000, stale-while-revalidate=86400');
  headers.set('Netlify-Cache-Tag', PUBLIC_CACHE_TAG);
}

/** Versioned file URL (?v=<hash> matching the bytes): the URL can never point to other bytes. */
export function setImmutable(headers: Headers) {
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Netlify-Cache-Tag', PUBLIC_CACHE_TAG);
}

export function setPrivate(headers: Headers) {
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
}

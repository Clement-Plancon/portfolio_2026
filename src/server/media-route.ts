// Public media files (/media/x.webp, /files/cv.pdf): only files of the PUBLISHED content are served.
// A file uploaded in the admin stays private (admin endpoint only) until it is published.
import { isMediaRef } from './media';
import { setImmutable, setPublicCache } from './public-cache';
import { contentStore } from './runtime';

export async function serveMedia(dir: 'media' | 'files', name: string | undefined, url: URL): Promise<Response> {
  const ref = `${dir}/${name ?? ''}`;
  if (!isMediaRef(ref)) return new Response('Not found', { status: 404 });
  let file: Awaited<ReturnType<ReturnType<typeof contentStore>['readMedia']>>;
  try {
    file = await contentStore().readMedia(ref, 'published');
  } catch {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  }
  const headers = new Headers({
    'Content-Type': file.contentType,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  });
  if (url.searchParams.get('v') === file.sha.slice(0, 12)) setImmutable(headers);
  else setPublicCache(headers);
  if (file.contentType === 'application/pdf') headers.set('Content-Disposition', 'inline');
  return new Response(file.bytes as BodyInit, { headers });
}

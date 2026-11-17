// Turns content references ("media/x.webp") into image URLs and dimensions for the page being rendered.
import { mediaUrl, type SiteData } from './snapshot';

export interface ResolvedMedia {
  src: string;
  width?: number;
  height?: number;
}
export type MediaResolver = (ref?: string) => ResolvedMedia | undefined;

/**
 * Visitors get the public, cacheable URLs of published files. The admin preview gets the private admin
 * endpoint (session required), so files that are not published yet never become public.
 */
export function mediaResolver(data: SiteData, mode: 'public' | 'preview'): MediaResolver {
  return (ref) => {
    if (!ref) return undefined;
    const url = mode === 'public' ? mediaUrl(ref, data.media) : data.media[ref] ? `/api/admin/media/file?ref=${encodeURIComponent(ref)}&v=${data.media[ref].sha.slice(0, 12)}` : undefined;
    if (!url) return undefined; // a missing file: the image is left out rather than broken
    const m = data.manifest.get(ref);
    return { src: url, width: m?.width, height: m?.height };
  };
}

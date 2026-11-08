// Maps content references ("media/x.webp") to images Astro can optimise at build time.
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/media/*.{webp,png,jpg,jpeg,avif}', {
  eager: true,
});

const byRef = new Map(
  Object.entries(files).map(([path, mod]) => [`media/${path.split('/').pop()}`, mod.default]),
);

export function getMedia(ref?: string): ImageMetadata | undefined {
  if (!ref) return undefined;
  const img = byRef.get(ref);
  // A reference to a missing file is a content error: fail the build instead of shipping a broken image.
  if (!img) throw new Error(`Image introuvable dans la médiathèque : ${ref}`);
  return img;
}

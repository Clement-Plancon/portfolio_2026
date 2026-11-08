// Upload validation: the file type comes from the bytes, never from the name or the declared type.
import { MEDIA_FILE_RE, MEDIA_IMAGE_RE } from '../lib/schemas';
import { HttpError } from './http';

export const isMediaRef = (ref: unknown): ref is string =>
  typeof ref === 'string' && (MEDIA_IMAGE_RE.test(ref) || MEDIA_FILE_RE.test(ref));

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // keeps the request under Netlify's 6 MB function limit

const TYPES = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  avif: 'image/avif',
  pdf: 'application/pdf',
} as const;
export type MediaExt = keyof typeof TYPES;

export function sniff(bytes: Uint8Array): MediaExt | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length < 12) return null;
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'avif';
  if (ascii(0, 5) === '%PDF-') return 'pdf';
  return null;
}

export function contentTypeOf(ref: string): string {
  const ext = ref.split('.').pop()?.toLowerCase();
  if (ext === 'jpeg') return TYPES.jpg;
  return TYPES[ext as MediaExt] ?? 'application/octet-stream';
}

/** "Capture d'écran (2).PNG" -> "capture-d-ecran-2" */
export function slugifyFileName(name: string): string {
  const base = name.replace(/\.[a-z0-9]{1,5}$/i, '');
  const slug = base
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'media';
}

/** Validates an upload and returns the media reference it will be stored under. */
export function validateUpload(input: {
  fileName: unknown;
  contentBase64: unknown;
  replace?: unknown;
}): { ref: string; bytes: Uint8Array; ext: MediaExt } {
  if (typeof input.contentBase64 !== 'string' || typeof input.fileName !== 'string') {
    throw new HttpError(400, 'bad_request', 'Fichier manquant.');
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input.contentBase64)) {
    throw new HttpError(400, 'bad_request', 'Encodage du fichier invalide.');
  }
  const bytes = new Uint8Array(Buffer.from(input.contentBase64, 'base64'));
  if (bytes.byteLength === 0) throw new HttpError(400, 'empty', 'Le fichier est vide.');
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, 'too_large', 'Fichier trop lourd (4 Mo maximum).');
  }
  const ext = sniff(bytes);
  if (!ext) throw new HttpError(415, 'unsupported', 'Format non accepté. Formats acceptés : WebP, PNG, JPEG, AVIF et PDF.');

  if (typeof input.replace === 'string' && input.replace) {
    const ref = input.replace;
    if (!isMediaRef(ref)) throw new HttpError(400, 'bad_request', 'Référence de média invalide.');
    const refExt = ref.split('.').pop() === 'jpeg' ? 'jpg' : ref.split('.').pop();
    if (refExt !== ext) throw new HttpError(415, 'type_mismatch', `Le fichier de remplacement doit être au même format (.${refExt}).`);
    return { ref, bytes, ext };
  }
  const dir = ext === 'pdf' ? 'files' : 'media';
  return { ref: `${dir}/${slugifyFileName(input.fileName)}.${ext}`, bytes, ext };
}

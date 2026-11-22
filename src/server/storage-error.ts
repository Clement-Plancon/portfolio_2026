// Failures of the storage (Netlify Blobs), told apart from the application's own errors.
//
// Every Blobs operation goes through `guard()` (src/server/blob-store.ts): whatever the SDK throws
// becomes a StorageError that knows the operation, the store, the HTTP status when there is one, and a
// technical message with every secret removed. The API turns it into a 503 « stockage indisponible »
// with a correlation id, never into « mot de passe incorrect », « session expirée » or a fake success.

export type StorageFailure =
  /** Blobs refused the credentials (401/403): an expired or invalid token, or a misconfigured site. */
  | 'auth'
  /** Blobs answered 429/5xx, or could not be reached (network, timeout). Usually temporary. */
  | 'unavailable'
  /** The function has no Blobs context (site ID, token, edge URL): a configuration problem. */
  | 'config'
  | 'unknown';

export class StorageError extends Error {
  readonly kind: StorageFailure;
  /** HTTP status returned by Blobs, if any. */
  readonly status?: number;
  /** Name of the error thrown by the SDK (BlobsInternalError, MissingBlobsEnvironmentError, TypeError…). */
  readonly causeName: string;
  /** Netlify's request id of the failed Blobs call, when the SDK reported it. */
  readonly blobsRequestId?: string;

  constructor(
    readonly op: string,
    readonly store: string,
    cause: unknown,
  ) {
    const c = cause as { name?: string; status?: unknown; message?: unknown } | undefined;
    const message = redact(String(c?.message ?? cause ?? ''));
    super(`${op} ${store}: ${message}`);
    this.name = 'StorageError';
    this.causeName = typeof c?.name === 'string' ? c.name : 'Error';
    this.status = typeof c?.status === 'number' ? c.status : statusFromMessage(message);
    this.blobsRequestId = /ID: ([A-Za-z0-9]+)/.exec(String(c?.message ?? ''))?.[1];
    this.kind = classify(this.causeName, this.status);
  }
}

function statusFromMessage(m: string): number | undefined {
  const s = /\b([1-5]\d\d) status code\b/.exec(m)?.[1];
  return s ? Number(s) : undefined;
}

function classify(name: string, status?: number): StorageFailure {
  if (name === 'MissingBlobsEnvironmentError' || name === 'BlobsConsistencyError' || name === 'InvalidBlobsRegionError') return 'config';
  if (status === 401 || status === 403) return 'auth';
  if (status === 429 || (status !== undefined && status >= 500)) return 'unavailable';
  // fetch failures (DNS, reset, timeout) have no status
  if (status === undefined && (name === 'TypeError' || name === 'AbortError' || name === 'TimeoutError' || name === 'FetchError')) return 'unavailable';
  return 'unknown';
}

/**
 * Removes anything that could be a secret from a technical message: bearer tokens, JWTs, query strings
 * (signed URLs), long opaque strings (keys, hashes, cookies), the admin secrets if they appear. Keeps
 * what helps to diagnose: status codes, request ids, store names, short words. Bounded length.
 */
export function redact(message: string, secrets: (string | undefined)[] = [process.env.ADMIN_SESSION_SECRET, process.env.ADMIN_PASSWORD_HASH]): string {
  let m = message;
  for (const s of secrets) if (s && s.length >= 8) m = m.split(s).join('[secret]');
  m = m
    .replace(/Bearer\s+[^\s,;"']+/gi, 'Bearer [redacted]')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[jwt]')
    .replace(/\$argon2id\$[^\s"']+/g, '[hash]')
    .replace(/(https?:\/\/[^\s?#"']+)[?#][^\s"']*/g, '$1?[redacted]')
    // long opaque strings (tokens, signatures, cookies, base64); a Netlify request id (26 chars) is kept
    .replace(/[A-Za-z0-9+/_=-]{40,}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
  return m.length > 400 ? `${m.slice(0, 400)}…` : m;
}

/** A short id for a failure, shown to the user and written in the log, to find one in the other. */
export function correlationId(req?: Request): string {
  // Netlify's own request id, when present, is the one shown in Netlify's logs: reuse it.
  const nf = req?.headers.get('x-nf-request-id');
  if (nf && /^[A-Za-z0-9]{10,40}$/.test(nf)) return nf;
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase();
}

/** One log line, as JSON, with only safe fields. */
export function logLine(fields: Record<string, string | number | boolean | undefined>): string {
  const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== ''));
  return JSON.stringify(clean);
}

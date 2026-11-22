// Browser client for the admin API. Auth travels in an HttpOnly session cookie set by the API itself.
import type { ContentType } from '../lib/content-types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: { path: string; message: string }[] = [],
    /** Correlation id of a server failure, to quote when reporting it (also in the server log). */
    public ref?: string,
  ) {
    super(message);
  }
  /** The storage is momentarily unavailable: nothing was changed, retrying later is the answer. */
  get storageDown() {
    return this.code === 'storage_unavailable';
  }
}

export type Entry<T = Record<string, unknown>> = { type: ContentType; id?: string; path: string; sha: string; data: T; error?: string };

export interface ContentPayload {
  ref: { branch: string; sha: string; isDraft: boolean; date: string };
  collections: { project: Entry[]; experience: Entry[] };
  singletons: Partial<Record<'profile' | 'skills' | 'seo' | 'media' | 'site', Entry>>;
  mediaFiles: { ref: string; sha: string; size: number }[];
}

export type SaveChange =
  | { op: 'put'; type: ContentType; id?: string; data: unknown; baseSha: string | null }
  | { op: 'delete'; type: ContentType; id?: string; baseSha: string };

export interface DeployState {
  state: string;
  url: string | null;
  description: string | null;
  updatedAt: string;
}
export interface StatusPayload {
  production: { sha: string; deploy: DeployState | null };
  draft: {
    sha: string;
    ahead: number;
    files: { path: string; status: string; type?: ContentType; id?: string }[];
    commits: { sha: string; message: string; date: string }[];
    deploy: DeployState | null;
  } | null;
  previewUrl: string | null;
}

/** Called when the API reports an expired session, so the app can show the login screen. */
let onUnauthenticated: (() => void) | null = null;
export const setUnauthenticatedHandler = (fn: () => void) => {
  onUnauthenticated = fn;
};

async function request<T>(method: string, path: string, body?: unknown, { quiet401 = false } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json', 'X-CMS-Request': '1' } : method === 'GET' ? {} : { 'X-CMS-Request': '1' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'Connexion impossible. Vérifiez votre réseau puis réessayez.');
  }
  let data: { error?: { code: string; message: string; details?: { path: string; message: string }[]; ref?: string } } | null = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = data?.error;
    if (res.status === 401 && !quiet401) onUnauthenticated?.();
    const ref = err?.ref ?? res.headers.get('x-request-ref') ?? undefined;
    // A failure without a readable answer (a platform error page) is still never shown as a success.
    const fallback = res.status >= 500 ? `Le serveur ne répond pas correctement (erreur ${res.status}). Rien n’a été enregistré ; réessayez dans un instant.` : `Erreur ${res.status}`;
    throw new ApiError(res.status, err?.code ?? 'http', err?.message ?? fallback, err?.details ?? [], ref);
  }
  return data as T;
}

export const api = {
  session: () => request<{ user: string; expiresAt: number; configured: boolean; previewUrl: string | null }>('GET', '/session', undefined, { quiet401: true }),
  login: (password: string) => request<{ expiresAt: number }>('POST', '/auth/login', { password }, { quiet401: true }),
  logout: () => request<{ loggedOut: boolean }>('POST', '/auth/logout', {}, { quiet401: true }),
  logoutAll: () => request<{ loggedOut: boolean }>('POST', '/auth/logout-all', {}),
  content: () => request<ContentPayload>('GET', '/content'),
  status: () => request<StatusPayload>('GET', '/status'),
  save: (message: string, changes: SaveChange[]) =>
    request<{ commit: string; files: Record<string, string | null> }>('POST', '/save', { message, changes }),
  upload: (body: { fileName: string; contentBase64: string; alt: string; width?: number; height?: number; replace?: string }) =>
    request<{ ref: string; commit: string; files: Record<string, string | null> }>('POST', '/media', body),
  deleteMedia: (ref: string) => request<{ commit: string; files: Record<string, string | null> }>('POST', '/media/delete', { ref }),
  publish: () => request<{ published: boolean; sha: string; purged: boolean }>('POST', '/publish', {}),
  purge: () => request<{ purged: boolean }>('POST', '/purge', {}),
  restore: (backup: unknown, expectedRev: string) =>
    request<{ restored: boolean; rev: string; projects: number; media: number }>('POST', '/restore', { backup, expectedRev }),
  discard: () => request<{ discarded: boolean }>('POST', '/discard', {}),
};

/** Download URL of a backup (the browser sends the session cookie). */
export const backupUrl = (withFiles: boolean) => `/api/admin/backup${withFiles ? '?fichiers=1' : ''}`;

export const mediaUrl = (ref: string, v?: string) =>
  `/api/admin/media/file?ref=${encodeURIComponent(ref)}${v ? `&v=${v.slice(0, 8)}` : ''}`;

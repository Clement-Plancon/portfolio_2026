// Browser client for the admin API. Auth travels in the nf_jwt cookie set by Netlify Identity.
import type { ContentType } from '../lib/content-types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

export type Entry<T = Record<string, unknown>> = { type: ContentType; id?: string; path: string; sha: string; data: T; error?: string };

export interface ContentPayload {
  ref: { branch: string; sha: string; isDraft: boolean; date: string };
  collections: { project: Entry[]; experience: Entry[]; article: Entry[] };
  singletons: Partial<Record<'profile' | 'skills' | 'seo' | 'media', Entry>>;
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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
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
  let data: { error?: { code: string; message: string; details?: { path: string; message: string }[] } } | null = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = data?.error;
    if (res.status === 401) onUnauthenticated?.();
    throw new ApiError(res.status, err?.code ?? 'http', err?.message ?? `Erreur ${res.status}`, err?.details ?? []);
  }
  return data as T;
}

export const api = {
  session: () => request<{ email: string; configured: boolean; previewUrl: string | null }>('GET', '/session'),
  content: () => request<ContentPayload>('GET', '/content'),
  status: () => request<StatusPayload>('GET', '/status'),
  save: (message: string, changes: SaveChange[]) =>
    request<{ commit: string; files: Record<string, string | null> }>('POST', '/save', { message, changes }),
  upload: (body: { fileName: string; contentBase64: string; alt: string; width?: number; height?: number; replace?: string }) =>
    request<{ ref: string; commit: string; files: Record<string, string | null> }>('POST', '/media', body),
  deleteMedia: (ref: string) => request<{ commit: string; files: Record<string, string | null> }>('POST', '/media/delete', { ref }),
  publish: () => request<{ published: boolean; sha: string }>('POST', '/publish', {}),
  discard: () => request<{ discarded: boolean }>('POST', '/discard', {}),
};

export const mediaUrl = (ref: string, v?: string) =>
  `/api/admin/media/file?ref=${encodeURIComponent(ref)}${v ? `&v=${v.slice(0, 8)}` : ''}`;

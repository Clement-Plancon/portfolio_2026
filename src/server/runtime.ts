// Production wiring: Netlify Blobs for content, media and sessions; Netlify's CDN purge after publishing.
// Only the authentication secrets come from the environment. Nothing here talks to GitHub.
import { purgeCache } from '@netlify/cache';
import { netlifyDocStore, netlifyFileStore } from './blob-store';
import { ContentStore } from './content-store';
import { createHandler } from './handler';
import { AdminAuth, parseAuthConfig } from './session';
import { redact } from './storage-error';

/** Cache tag of every public response built from content (the page and the media files). */
export const PUBLIC_CACHE_TAG = 'cms-public';

const log = (m: string) => console.error(m);
let content: ContentStore | null = null;
let auth: AdminAuth | null | undefined;
let handler: ReturnType<typeof createHandler> | null = null;

// These objects are kept for the life of the function instance (a warm instance serves many requests,
// for hours). That is safe because they hold no Blobs credentials: netlifyDocStore/netlifyFileStore open
// the store again for every operation, with the context Netlify gives to the CURRENT invocation. Never
// call getStore() here, at module level or in a cached object: its token would outlive its invocation.
export function contentStore(): ContentStore {
  content ??= new ContentStore({ docs: netlifyDocStore('cms'), files: netlifyFileStore('cms-media'), log });
  return content;
}

export function adminAuth(): AdminAuth | null {
  if (auth === undefined) {
    const parsed = parseAuthConfig(process.env);
    if ('error' in parsed) log(`[auth] administration disabled: ${parsed.error}`);
    auth = 'config' in parsed ? new AdminAuth({ config: parsed.config, kv: netlifyDocStore('admin-auth'), log }) : null;
  }
  return auth;
}

export async function purgePublic(): Promise<boolean> {
  try {
    await purgeCache({ tags: [PUBLIC_CACHE_TAG] });
    return true;
  } catch (e) {
    // Outside Netlify (local development) there is no CDN cache to purge.
    log(`[cms] cache purge failed: ${(e as Error).name} ${redact(String((e as Error).message ?? ''))}`);
    return false;
  }
}

export function adminHandler() {
  handler ??= createHandler({
    cms: contentStore(),
    auth: adminAuth(),
    purge: purgePublic,
    siteOrigins: [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL].filter((u): u is string => !!u),
    log,
  });
  return handler;
}

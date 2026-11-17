// Admin API, served at /api/admin/*. All logic lives in src/server (tested without Netlify).
import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import { Cms } from '../../src/server/cms';
import { GitHub } from '../../src/server/github';
import { createHandler } from '../../src/server/handler';
import { AdminAuth, type KV, parseAuthConfig } from '../../src/server/session';

const env = process.env;
const log = (m: string) => console.error(m);

const cms =
  env.GITHUB_TOKEN && env.GITHUB_REPO
    ? new Cms(new GitHub({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO }), {
        branch: env.GITHUB_BRANCH || 'main',
        draftBranch: env.GITHUB_DRAFT_BRANCH || 'cms-draft',
      })
    : null;

/** Sessions and login counters live in Netlify Blobs, shared by every instance (strong consistency). */
function blobsKV(): KV {
  const store = getStore({ name: 'admin-auth', consistency: 'strong' });
  return {
    async get<T>(key: string) {
      const r = await store.getWithMetadata(key, { type: 'json' });
      if (!r) return null;
      // The ETag drives the conditional writes. Netlify returns it with the blob; if a server does not,
      // read it from the listing rather than writing unconditionally.
      const etag = r.etag ?? (await store.list({ prefix: key })).blobs.find((b) => b.key === key)?.etag ?? '';
      return { value: r.data as T, etag };
    },
    async set(key, value, cond) {
      if (cond?.onlyIfMatch !== undefined) {
        // Without a known version, refuse: an unconditional write could let parallel attempts through.
        if (!cond.onlyIfMatch) return false;
        return (await store.setJSON(key, value, { onlyIfMatch: cond.onlyIfMatch })).modified;
      }
      return (await store.setJSON(key, value, cond?.onlyIfNew ? { onlyIfNew: true } : {})).modified;
    },
    delete: (key) => store.delete(key),
    async list(prefix) {
      return (await store.list({ prefix })).blobs.map((b) => b.key);
    },
  };
}

const parsed = parseAuthConfig(env);
if ('error' in parsed) log(`[auth] administration disabled: ${parsed.error}`);

let handler: ReturnType<typeof createHandler> | null = null;
function getHandler() {
  // Built on first request: Netlify Blobs needs the request context to be configured.
  handler ??= createHandler({
    cms,
    auth: 'config' in parsed ? new AdminAuth({ config: parsed.config, kv: blobsKV(), log }) : null,
    siteOrigins: [env.URL, env.DEPLOY_PRIME_URL, env.DEPLOY_URL].filter((u): u is string => !!u),
    previewUrl: env.PREVIEW_URL || undefined,
    commitAuthor: env.CMS_AUTHOR_NAME && env.CMS_AUTHOR_EMAIL ? { name: env.CMS_AUTHOR_NAME, email: env.CMS_AUTHOR_EMAIL } : undefined,
    log,
  });
  return handler;
}

export default (req: Request, context: Context) => getHandler()(req, { ip: context.ip });

export const config: Config = { path: '/api/admin/*' };

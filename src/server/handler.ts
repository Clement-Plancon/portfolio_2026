// Admin API router. Dependencies are injected so the whole flow can be tested without Netlify or GitHub.
import { z } from 'zod';
import { CONTENT_TYPES, isContentType } from '../lib/content-types';
import { type AuthDeps, notConfigured, requireAdmin } from './auth';
import type { ContentStore, SaveChange } from './content-store';
import { errorResponse, HttpError, json, readJson, SECURITY_HEADERS } from './http';
import { checkSameOrigin, clearedCookie } from './session';
import { contentTypeOf, isMediaRef, validateUpload } from './media';

export interface HandlerDeps extends AuthDeps {
  cms: ContentStore;
  /** Purges the public pages from the CDN after a publication. Returns false if it could not. */
  purge?: () => Promise<boolean>;
  log?: (msg: string) => void;
}

/** Path of the admin-only preview of the draft. */
export const PREVIEW_PATH = '/admin/apercu/';

/** Facts about the request that only the platform knows (Netlify passes the client IP in its context). */
export interface RequestContext {
  ip?: string;
}

const withCookie = (res: Response, cookie: string) => {
  res.headers.append('Set-Cookie', cookie);
  return res;
};

const PREFIX = '/api/admin';

const saveBody = z.object({
  message: z.string().trim().min(1).max(200),
  changes: z
    .array(
      z.discriminatedUnion('op', [
        z.object({ op: z.literal('put'), type: z.string(), id: z.string().optional(), data: z.unknown(), baseSha: z.string().nullable() }),
        z.object({ op: z.literal('delete'), type: z.string(), id: z.string().optional(), baseSha: z.string() }),
      ]),
    )
    .min(1)
    .max(60),
});

const uploadBody = z.object({
  fileName: z.string().max(200),
  contentBase64: z.string(),
  alt: z.string().trim().max(300).default(''),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  replace: z.string().optional(),
});

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, 'bad_request', 'Requête invalide.');
  return r.data;
}

export function createHandler(deps: HandlerDeps) {
  const log = deps.log ?? ((m: string) => console.error(m));

  return async function handle(req: Request, ctx: RequestContext = {}): Promise<Response> {
    const url = new URL(req.url);
    const route = url.pathname.replace(/\/+$/, '').slice(PREFIX.length) || '/';
    const method = req.method.toUpperCase();
    const mutation = method !== 'GET' && method !== 'HEAD';

    try {
      if (!url.pathname.startsWith(PREFIX)) throw new HttpError(404, 'not_found', 'Route inconnue.');

      // Login and logout: same-origin checks, but no session needed.
      if (route === '/auth/login' || route === '/auth/logout') {
        if (method !== 'POST') throw new HttpError(405, 'method', 'Méthode non autorisée.');
        if (!deps.auth) throw notConfigured();
        checkSameOrigin(req, deps.siteOrigins);
        if (route === '/auth/logout') {
          await deps.auth.logout(req);
          return withCookie(json({ loggedOut: true }), clearedCookie());
        }
        const body = await readJson(req, 4_000);
        // Any malformed body is a failed login, with the same generic answer.
        const password = body && typeof body === 'object' ? (body as { password?: unknown }).password : undefined;
        const s = await deps.auth.login(password, ctx.ip || 'unknown');
        return withCookie(json({ expiresAt: s.expiresAt }), s.cookie);
      }

      const session = await requireAdmin(req, deps, mutation);
      const cms = deps.cms;

      if (method === 'GET' && route === '/session') {
        return json({ user: 'administrateur', expiresAt: session.expiresAt, configured: true, previewUrl: PREVIEW_PATH });
      }
      if (method === 'POST' && route === '/auth/logout-all') {
        await deps.auth!.logoutAll();
        return withCookie(json({ loggedOut: true }), clearedCookie());
      }


      if (method === 'GET' && route === '/content') return json(await cms.readAll());
      if (method === 'GET' && route === '/status') return json({ ...(await cms.status()), previewUrl: PREVIEW_PATH });

      if (method === 'POST' && route === '/save') {
        const body = parse(saveBody, await readJson(req, 1_000_000));
        for (const c of body.changes) {
          if (!isContentType(c.type)) throw new HttpError(400, 'invalid_type', 'Type de contenu inconnu.');
          if (CONTENT_TYPES[c.type].kind === 'collection' && !c.id) throw new HttpError(400, 'invalid_id', 'Identifiant manquant.');
        }
        return json(await cms.save(body.changes as SaveChange[]));
      }

      if (method === 'POST' && route === '/media') {
        const body = parse(uploadBody, await readJson(req, 6_000_000));
        const file = validateUpload(body);
        const result = await cms.uploadMedia({
          ref: file.ref,
          bytes: file.bytes,
          contentType: contentTypeOf(file.ref),
          alt: body.alt,
          width: body.width,
          height: body.height,
          replace: !!body.replace,
        });
        return json({ ref: file.ref, ...result }, 201);
      }

      if (method === 'POST' && route === '/media/delete') {
        const { ref } = parse(z.object({ ref: z.string() }), await readJson(req, 10_000));
        if (!isMediaRef(ref)) throw new HttpError(400, 'bad_request', 'Référence de média invalide.');
        return json(await cms.deleteMedia(ref));
      }

      if (method === 'GET' && route === '/media/file') {
        const ref = url.searchParams.get('ref');
        if (!isMediaRef(ref)) throw new HttpError(400, 'bad_request', 'Référence de média invalide.');
        const data = await cms.readMedia(ref);
        return new Response(data.bytes as BodyInit, {
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': data.contentType,
            'Cache-Control': 'private, no-store',
            'Content-Disposition': 'inline',
            'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
          },
        });
      }

      if (method === 'POST' && route === '/publish') {
        const r = await cms.publish();
        // The content is published in Blobs; the CDN copy of the page is dropped so visitors see it now.
        const purged = deps.purge ? await deps.purge() : false;
        if (!purged) log('[cms] publish: CDN purge failed or unavailable');
        return json({ ...r, purged });
      }

      if (method === 'GET' && route === '/backup') {
        const withFiles = url.searchParams.get('fichiers') === '1';
        const backup = await cms.exportBackup({ withFiles });
        const date = backup.exportedAt.slice(0, 10);
        return new Response(JSON.stringify(backup, null, 2), {
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="clementplancon-sauvegarde-${date}${withFiles ? '-avec-fichiers' : ''}.json"`,
          },
        });
      }
      if (method === 'POST' && route === '/restore') {
        const body = parse(z.object({ backup: z.unknown(), expectedRev: z.string().optional() }), await readJson(req, 6_000_000));
        return json(await cms.restoreBackup(body.backup, body.expectedRev));
      }
      if (method === 'POST' && route === '/discard') return json(await cms.discard());

      throw new HttpError(404, 'not_found', 'Route inconnue.');
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.status >= 500 || e.status === 429) log(`[cms] ${method} ${route} -> ${e.status} ${e.code}`);
        const res = errorResponse(e);
        // A refused or expired session also removes the cookie from the browser.
        return e.status === 401 && route !== '/auth/login' ? withCookie(res, clearedCookie()) : res;
      }
      log(`[cms] ${method} ${route} -> unexpected ${(e as Error)?.name ?? 'error'}`);
      return errorResponse(new HttpError(500, 'internal', 'Erreur inattendue du serveur.'));
    }
  };
}

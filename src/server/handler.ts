// Admin API router. Dependencies are injected so the whole flow can be tested without Netlify or GitHub.
import { z } from 'zod';
import { CONTENT_TYPES, isContentType } from '../lib/content-types';
import { type AuthDeps, requireAdmin } from './auth';
import { type Cms, type SaveChange } from './cms';
import { GitHubError } from './github';
import { errorResponse, HttpError, json, readJson, SECURITY_HEADERS } from './http';
import { contentTypeOf, isMediaRef, validateUpload } from './media';

export interface HandlerDeps extends AuthDeps {
  cms: Cms | null; // null when GitHub is not configured
  previewUrl?: string;
  log?: (msg: string) => void;
}

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

  return async function handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const route = url.pathname.replace(/\/+$/, '').slice(PREFIX.length) || '/';
    const method = req.method.toUpperCase();
    const mutation = method !== 'GET' && method !== 'HEAD';

    try {
      if (!url.pathname.startsWith(PREFIX)) throw new HttpError(404, 'not_found', 'Route inconnue.');
      const user = await requireAdmin(req, deps, mutation);
      const author = { name: `${user.name} (CMS)`, email: user.email };

      if (method === 'GET' && route === '/session') {
        return json({ email: user.email, configured: !!deps.cms, previewUrl: deps.previewUrl ?? null });
      }

      const cms = deps.cms;
      if (!cms) throw new HttpError(503, 'not_configured', "Le dépôt GitHub n'est pas configuré (GITHUB_TOKEN, GITHUB_REPO).");

      if (method === 'GET' && route === '/content') return json(await cms.readAll());
      if (method === 'GET' && route === '/status') return json({ ...(await cms.status()), previewUrl: deps.previewUrl ?? null });

      if (method === 'POST' && route === '/save') {
        const body = parse(saveBody, await readJson(req, 1_000_000));
        for (const c of body.changes) {
          if (!isContentType(c.type)) throw new HttpError(400, 'invalid_type', 'Type de contenu inconnu.');
          if (CONTENT_TYPES[c.type].kind === 'collection' && !c.id) throw new HttpError(400, 'invalid_id', 'Identifiant manquant.');
        }
        return json(await cms.save(body.changes as SaveChange[], `CMS : ${body.message}`, author));
      }

      if (method === 'POST' && route === '/media') {
        const body = parse(uploadBody, await readJson(req, 6_000_000));
        const file = validateUpload(body);
        const result = await cms.uploadMedia(
          { ref: file.ref, bytes: file.bytes, alt: body.alt, width: body.width, height: body.height, replace: !!body.replace },
          author,
        );
        return json({ ref: file.ref, ...result }, 201);
      }

      if (method === 'POST' && route === '/media/delete') {
        const { ref } = parse(z.object({ ref: z.string() }), await readJson(req, 10_000));
        if (!isMediaRef(ref)) throw new HttpError(400, 'bad_request', 'Référence de média invalide.');
        return json(await cms.deleteMedia(ref, author));
      }

      if (method === 'GET' && route === '/media/file') {
        const ref = url.searchParams.get('ref');
        if (!isMediaRef(ref)) throw new HttpError(400, 'bad_request', 'Référence de média invalide.');
        const data = await cms.readMedia(ref);
        return new Response(data, {
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': contentTypeOf(ref),
            'Cache-Control': 'private, max-age=60',
            'Content-Disposition': 'inline',
            'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
          },
        });
      }

      if (method === 'POST' && route === '/publish') return json(await cms.publish(user));
      if (method === 'POST' && route === '/discard') return json(await cms.discard());

      throw new HttpError(404, 'not_found', 'Route inconnue.');
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.status >= 500) log(`[cms] ${method} ${route} -> ${e.status} ${e.code}`);
        return errorResponse(e);
      }
      if (e instanceof GitHubError) {
        // Never log the token or request bodies, only the route and GitHub's status.
        log(`[cms] ${method} ${route} -> GitHub ${e.status}`);
        const status = 502;
        const message =
          e.status === 401 || e.status === 403
            ? "GitHub refuse l'accès : vérifiez le jeton GITHUB_TOKEN et ses permissions."
            : e.status === 404
              ? 'Dépôt ou branche introuvable sur GitHub : vérifiez GITHUB_REPO et GITHUB_BRANCH.'
              : 'GitHub est momentanément indisponible. Réessayez dans un instant.';
        return errorResponse(new HttpError(status, 'github', message));
      }
      log(`[cms] ${method} ${route} -> unexpected ${(e as Error)?.name ?? 'error'}`);
      return errorResponse(new HttpError(500, 'internal', 'Erreur inattendue du serveur.'));
    }
  };
}

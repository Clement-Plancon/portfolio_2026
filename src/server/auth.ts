// Every admin request is checked here, server side. Hiding /admin is not a protection.
import { HttpError } from './http';
import { type AdminAuth, checkSameOrigin } from './session';

export interface AuthDeps {
  /** null when ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET are missing or invalid: everything is refused. */
  auth: AdminAuth | null;
  /** The site's own URLs (Netlify's URL, DEPLOY_PRIME_URL…), accepted as origins besides the request's own. */
  siteOrigins?: string[];
}

export function notConfigured(): HttpError {
  return new HttpError(503, 'not_configured', "L'administration n'est pas configurée. Voir docs/netlify-deployment.md.");
}

export async function requireAdmin(req: Request, deps: AuthDeps, mutation: boolean) {
  if (!deps.auth) throw notConfigured();
  if (mutation) checkSameOrigin(req, deps.siteOrigins);
  return deps.auth.verify(req);
}

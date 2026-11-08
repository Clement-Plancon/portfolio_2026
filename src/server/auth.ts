// Every admin request is checked here, server side. Hiding /admin is not a protection.
import { HttpError } from './http';

export interface IdentityUser {
  email?: string;
  name?: string;
}

export interface AuthDeps {
  /** Returns the Netlify Identity user verified by the Netlify runtime, or null. */
  getUser: (req: Request) => Promise<IdentityUser | null>;
  /** Throws if the request Origin does not match the site (CSRF protection). */
  verifyOrigin: (req: Request) => void;
  adminEmails: string[];
}

export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(req: Request, deps: AuthDeps, mutation: boolean) {
  // Fail closed: without an allow-list nobody gets in.
  if (deps.adminEmails.length === 0) {
    throw new HttpError(503, 'not_configured', "L'administration n'est pas configurée (ADMIN_EMAILS).");
  }
  if (mutation) {
    try {
      deps.verifyOrigin(req);
    } catch {
      throw new HttpError(403, 'bad_origin', 'Origine de la requête refusée.');
    }
    // A custom header forces a CORS preflight for any cross-site attempt.
    if (req.headers.get('x-cms-request') !== '1') {
      throw new HttpError(403, 'bad_request', 'Requête refusée.');
    }
  }
  const user = await deps.getUser(req);
  if (!user?.email) throw new HttpError(401, 'unauthenticated', 'Session absente ou expirée. Reconnectez-vous.');
  const email = user.email.toLowerCase();
  if (!deps.adminEmails.includes(email)) {
    throw new HttpError(403, 'forbidden', "Ce compte n'a pas accès à l'administration.");
  }
  return { email, name: user.name || email };
}

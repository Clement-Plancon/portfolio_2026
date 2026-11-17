// Login and logout against the admin API. The session lives in an HttpOnly cookie set by the server:
// this code never sees a token or a secret, and the password is only sent once, to /api/admin/auth/login.
import { ApiError, api } from './api';

export function authMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return 'Trop de tentatives. Réessayez plus tard.';
    if (e.status === 401) return 'Connexion refusée. Vérifiez le mot de passe.';
    if (e.status === 503) return "L'administration n'est pas configurée sur ce site. Voir docs/netlify-deployment.md.";
    if (e.status === 0) return e.message;
  }
  return 'Le service de connexion ne répond pas. Réessayez dans un instant.';
}

export const auth = {
  login: (password: string) => api.login(password),
  logout: () => api.logout(),
  logoutEverywhere: () => api.logoutAll(),
};

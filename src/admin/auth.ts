// Thin wrapper over @netlify/identity (the library Netlify recommends for new projects).
// Passwords are only ever sent to Netlify Identity; nothing is stored by this app.
import {
  AuthError,
  acceptInvite,
  getUser,
  handleAuthCallback,
  login,
  logout,
  MissingIdentityError,
  requestPasswordRecovery,
  updateUser,
} from '@netlify/identity';

export type CallbackKind = { type: 'invite'; token: string } | { type: 'recovery' } | { type: 'done' } | null;

export function authMessage(e: unknown, context: 'login' | 'link' | 'other' = 'other'): string {
  if (e instanceof MissingIdentityError) {
    return "Netlify Identity n'est pas activé sur ce site. Voir docs/netlify-deployment.md.";
  }
  if (e instanceof AuthError) {
    const s = e.status ?? 0;
    const m = (e.message || '').toLowerCase();
    if (s === 429) return 'Trop de tentatives. Patientez quelques minutes.';
    if (context === 'login' && s < 500) return 'E-mail ou mot de passe incorrect.';
    if (context === 'link' && s < 500) return 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.';
    if (s === 422) return e.message || 'Données refusées par le service d’identité.';
    if (m.includes('expired') || m.includes('invalid')) return 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.';
    return 'Le service de connexion ne répond pas. Réessayez dans un instant.';
  }
  return 'Une erreur inattendue est survenue.';
}

export const auth = {
  currentUser: () => getUser(),
  login: (email: string, password: string) => login(email.trim(), password),
  logout: () => logout(),
  requestRecovery: (email: string) => requestPasswordRecovery(email.trim()),
  setPassword: (password: string) => updateUser({ password }),
  acceptInvite: (token: string, password: string) => acceptInvite(token, password),

  /** Handles links from invitation and password-reset e-mails (tokens in the URL hash). */
  async callback(): Promise<CallbackKind> {
    if (!/^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/.test(location.hash)) return null;
    const r = await handleAuthCallback();
    history.replaceState(null, '', location.pathname);
    if (!r) return null;
    if (r.type === 'invite' && r.token) return { type: 'invite', token: r.token };
    if (r.type === 'recovery') return { type: 'recovery' };
    return { type: 'done' };
  },
};

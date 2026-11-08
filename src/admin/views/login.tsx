import { useState } from 'preact/hooks';
import { auth, authMessage } from '../auth';

type Mode = { kind: 'login' } | { kind: 'forgot' } | { kind: 'reset' } | { kind: 'invite'; token: string };

export function Login(p: { initial?: Mode; notice?: string; onDone: () => void }) {
  const [mode, setMode] = useState<Mode>(p.initial ?? { kind: 'login' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(p.notice ?? null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, context: 'login' | 'link' | 'other' = 'other') => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(authMessage(e, context));
    } finally {
      setBusy(false);
    }
  };

  const newPassword = mode.kind === 'reset' || mode.kind === 'invite';
  const submit = (e: Event) => {
    e.preventDefault();
    if (mode.kind === 'login') {
      run(async () => {
        await auth.login(email, password);
        p.onDone();
      }, 'login');
    } else if (mode.kind === 'forgot') {
      run(async () => {
        await auth.requestRecovery(email);
        setInfo('Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.');
        setMode({ kind: 'login' });
      });
    } else if (newPassword) {
      if (password.length < 12) return setError('12 caractères minimum.');
      if (password !== password2) return setError('Les deux mots de passe ne correspondent pas.');
      run(async () => {
        if (mode.kind === 'invite') await auth.acceptInvite(mode.token, password);
        else await auth.setPassword(password);
        p.onDone();
      }, mode.kind === 'invite' ? 'link' : 'other');
    }
  };

  const titles = {
    login: 'Connexion',
    forgot: 'Mot de passe oublié',
    reset: 'Nouveau mot de passe',
    invite: 'Créer votre mot de passe',
  };

  return (
    <main class="login">
      <form class="login__card" onSubmit={submit} noValidate>
        <p class="login__brand">
          Clément Plan<span class="cedilla">ç</span>on <span>· administration</span>
        </p>
        <h1>{titles[mode.kind]}</h1>
        {info && (
          <p class="login__info" role="status">
            {info}
          </p>
        )}
        {error && (
          <p class="login__error" role="alert">
            {error}
          </p>
        )}
        {(mode.kind === 'login' || mode.kind === 'forgot') && (
          <div class="field">
            <label for="email">Adresse e-mail</label>
            <input id="email" type="email" autocomplete="username" required value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
          </div>
        )}
        {mode.kind === 'login' && (
          <div class="field">
            <label for="password">Mot de passe</label>
            <input id="password" type="password" autocomplete="current-password" required value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
          </div>
        )}
        {newPassword && (
          <>
            <div class="field">
              <label for="np">Nouveau mot de passe</label>
              <p class="hint" id="np-hint">
                12 caractères minimum. Une phrase de passe est idéale.
              </p>
              <input id="np" type="password" autocomplete="new-password" aria-describedby="np-hint" required value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
            </div>
            <div class="field">
              <label for="np2">Confirmer le mot de passe</label>
              <input id="np2" type="password" autocomplete="new-password" required value={password2} onInput={(e) => setPassword2(e.currentTarget.value)} />
            </div>
          </>
        )}
        <button type="submit" class="btn btn--block" disabled={busy}>
          {busy ? 'Un instant…' : mode.kind === 'login' ? 'Se connecter' : mode.kind === 'forgot' ? 'Envoyer le lien' : 'Enregistrer le mot de passe'}
        </button>
        {mode.kind === 'login' && (
          <button type="button" class="linklike" onClick={() => {
              setMode({ kind: 'forgot' });
              setError(null);
              setInfo(null);
            }}>
            Mot de passe oublié ?
          </button>
        )}
        {mode.kind === 'forgot' && (
          <button type="button" class="linklike" onClick={() => {
              setMode({ kind: 'login' });
              setError(null);
            }}>
            Retour à la connexion
          </button>
        )}
        <p class="login__foot">
          Accès réservé. <a href="/">Retour au site</a>
        </p>
      </form>
    </main>
  );
}

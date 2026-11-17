import { useState } from 'preact/hooks';
import { auth, authMessage } from '../auth';

// A single administrator: the password is the only field. It is checked on the server only.
export function Login(p: { notice?: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!password) return setError('Saisissez le mot de passe.');
    setBusy(true);
    setError(null);
    try {
      await auth.login(password);
      setPassword('');
      p.onDone();
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main class="login">
      <form class="login__card" onSubmit={submit} noValidate>
        <p class="login__brand">
          Clément Plan<span class="cedilla">ç</span>on <span>· administration</span>
        </p>
        <h1>Administration</h1>
        {p.notice && !error && (
          <p class="login__info" role="status">
            {p.notice}
          </p>
        )}
        {error && (
          <p class="login__error" role="alert">
            {error}
          </p>
        )}
        {/* Hidden username: lets password managers file the entry under a stable name. */}
        <input type="text" name="username" autocomplete="username" value="admin" hidden readOnly />
        <div class="field">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
        </div>
        <button type="submit" class="btn btn--block" disabled={busy}>
          {busy ? 'Un instant…' : 'Se connecter'}
        </button>
        <p class="login__foot">
          Accès réservé. <a href="/">Retour au site</a>
        </p>
      </form>
    </main>
  );
}

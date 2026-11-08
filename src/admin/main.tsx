import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ApiError, api, setUnauthenticatedHandler } from './api';
import { auth, authMessage } from './auth';
import { StoreProvider, useRoute, useStore } from './store';
import { ConfirmHost, Spinner, Toasts } from './ui';
import { ArticleEditor, ArticleList } from './views/articles';
import { Dashboard, PublishBar } from './views/dashboard';
import { ExperienceEditor, ExperienceList } from './views/experiences';
import { Login } from './views/login';
import { MediaView } from './views/media';
import { ProjectEditor, ProjectList } from './views/projects';
import { SettingsView } from './views/settings';
import { ProfileView, SeoView, SkillsView } from './views/singleton';

type Phase =
  | { kind: 'loading' }
  | { kind: 'login'; notice?: string; mode?: { kind: 'invite'; token: string } | { kind: 'reset' } }
  | { kind: 'denied'; message: string }
  | { kind: 'ready'; email: string };

const NAV = [
  { href: '', label: 'Tableau de bord' },
  { href: 'projets', label: 'Projets' },
  { href: 'experiences', label: 'Expériences' },
  { href: 'articles', label: 'Articles' },
  { href: 'profil', label: 'Profil' },
  { href: 'competences', label: 'Compétences' },
  { href: 'medias', label: 'Médias' },
  { href: 'seo', label: 'Référencement' },
  { href: 'parametres', label: 'Paramètres' },
];

function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  // Session expired while working: the app stays mounted (unsaved forms are kept) under a login overlay.
  const [expired, setExpired] = useState(false);

  const check = async () => {
    const user = await auth.currentUser();
    if (!user) return setPhase({ kind: 'login' });
    try {
      const s = await api.session();
      setPhase({ kind: 'ready', email: s.email });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return setPhase({ kind: 'login', notice: 'Votre session a expiré. Reconnectez-vous.' });
      setPhase({ kind: 'denied', message: e instanceof ApiError ? e.message : 'Accès impossible.' });
    }
  };

  useEffect(() => {
    setUnauthenticatedHandler(() => setExpired(true));
    (async () => {
      try {
        const cb = await auth.callback();
        if (cb?.type === 'invite') return setPhase({ kind: 'login', mode: { kind: 'invite', token: cb.token } });
        if (cb?.type === 'recovery') return setPhase({ kind: 'login', mode: { kind: 'reset' } });
      } catch (e) {
        return setPhase({ kind: 'login', notice: authMessage(e, 'link') });
      }
      await check();
    })();
  }, []);

  const logout = async () => {
    try {
      await auth.logout();
    } finally {
      setExpired(false);
      setPhase({ kind: 'login', notice: 'Vous êtes déconnecté.' });
    }
  };

  if (phase.kind === 'loading') {
    return (
      <main class="center">
        <Spinner label="Vérification de la session…" />
      </main>
    );
  }
  if (phase.kind === 'login') {
    return <Login key={phase.notice} initial={phase.mode} notice={phase.notice} onDone={check} />;
  }
  if (phase.kind === 'denied') {
    return (
      <main class="center">
        <div class="login__card">
          <h1>Accès refusé</h1>
          <p role="alert">{phase.message}</p>
          <button type="button" class="btn" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </main>
    );
  }
  return (
    <StoreProvider email={phase.email}>
      <Shell onLogout={logout} />
      {expired && (
        <div class="login-overlay">
          <Login notice="Votre session a expiré. Reconnectez-vous puis enregistrez à nouveau : le formulaire ouvert est conservé." onDone={() => setExpired(false)} />
        </div>
      )}
    </StoreProvider>
  );
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const route = useRoute();
  const { data, loadError, reload } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [route.join('/')]);
  const [section, id] = route;

  let view = null;
  if (loadError) {
    view = (
      <section class="view">
        <h1>Chargement impossible</h1>
        <p role="alert">{loadError}</p>
        <button type="button" class="btn" onClick={reload}>
          Réessayer
        </button>
      </section>
    );
  } else if (!data) {
    view = <Spinner label="Chargement du contenu…" />;
  } else {
    switch (section ?? '') {
      case '':
        view = <Dashboard />;
        break;
      case 'projets':
        view = id ? <ProjectEditor key={id} id={id} /> : <ProjectList />;
        break;
      case 'experiences':
        view = id ? <ExperienceEditor key={id} id={id} /> : <ExperienceList />;
        break;
      case 'articles':
        view = id ? <ArticleEditor key={id} id={id} /> : <ArticleList />;
        break;
      case 'profil':
        view = <ProfileView />;
        break;
      case 'competences':
        view = <SkillsView />;
        break;
      case 'medias':
        view = <MediaView />;
        break;
      case 'seo':
        view = <SeoView />;
        break;
      case 'parametres':
        view = <SettingsView onLogout={onLogout} />;
        break;
      default:
        view = (
          <section class="view">
            <h1>Page introuvable</h1>
            <a href="#/">Retour au tableau de bord</a>
          </section>
        );
    }
  }

  return (
    <div class="shell">
      <a class="skip-link" href="#admin-main">
        Aller au contenu
      </a>
      <header class="topbar">
        <button type="button" class="menu-btn" aria-expanded={menuOpen} aria-controls="admin-nav" onClick={() => setMenuOpen(!menuOpen)}>
          <span aria-hidden="true">☰</span> Menu
        </button>
        <a class="topbar__brand" href="#/">
          Plan<span class="cedilla">ç</span>on <span>admin</span>
        </a>
        <PublishBar />
      </header>
      <nav id="admin-nav" class={`sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Administration">
        <ul>
          {NAV.map((n) => (
            <li>
              <a href={`#/${n.href}`} aria-current={(section ?? '') === n.href ? 'page' : undefined}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div class="sidebar__foot">
          <a href="/" target="_blank" rel="noopener">
            Voir le site ↗
          </a>
          <button type="button" class="linklike" onClick={onLogout}>
            Se déconnecter
          </button>
        </div>
      </nav>
      <main id="admin-main" class="main" tabindex={-1}>
        {view}
      </main>
      <Toasts />
      <ConfirmHost />
    </div>
  );
}

render(<App />, document.getElementById('admin')!);

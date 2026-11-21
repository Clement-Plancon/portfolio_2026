import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ApiError, api, setUnauthenticatedHandler } from './api';
import { auth, authMessage } from './auth';
import { StoreProvider, useRoute, useStore } from './store';
import { ConfirmHost, Spinner, Toasts } from './ui';
import { Dashboard, PublishBar } from './views/dashboard';
import { ExperienceEditor, ExperienceList } from './views/experiences';
import { Login } from './views/login';
import { MediaView } from './views/media';
import { ProjectEditor, ProjectList } from './views/projects';
import { PreviewView } from './views/preview';
import { SettingsView } from './views/settings';
import { SiteView } from './views/site';
import { ProfileView, SeoView, SkillsView } from './views/singleton';

type Phase =
  | { kind: 'loading' }
  | { kind: 'login'; notice?: string }
  | { kind: 'denied'; message: string }
  | { kind: 'ready'; email: string };

// Organised by what you edit on the page, not by how it is stored.
const NAV = [
  { href: '', label: 'Tableau de bord' },
  { href: 'site', label: 'Site' },
  { href: 'projets', label: 'Projets' },
  { href: 'experiences', label: 'Expériences' },
  { href: 'competences', label: 'Compétences' },
  { href: 'medias', label: 'Médias' },
  { href: 'apercu', label: 'Aperçu' },
  { href: 'seo', label: 'Référencement' },
  { href: 'parametres', label: 'Paramètres' },
];

function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  // Session expired while working: the app stays mounted (unsaved forms are kept) under a login overlay.
  const [expired, setExpired] = useState(false);

  // The server is the only judge of the session: ask it.
  const check = async () => {
    try {
      const s = await api.session();
      setPhase({ kind: 'ready', email: s.user });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return setPhase({ kind: 'login' });
      setPhase({ kind: 'denied', message: e instanceof ApiError && e.status !== 503 ? e.message : authMessage(e) });
    }
  };

  useEffect(() => {
    setUnauthenticatedHandler(() => setExpired(true));
    check();
  }, []);

  const logout = async () => {
    try {
      await auth.logout();
    } catch {
      /* the cookie expires anyway; the screen must not stay open */
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
    return <Login key={phase.notice} notice={phase.notice} onDone={check} />;
  }
  if (phase.kind === 'denied') {
    return (
      <main class="center">
        <div class="login__card">
          <h1>Administration indisponible</h1>
          <p role="alert">{phase.message}</p>
          <button type="button" class="btn" onClick={() => location.reload()}>
            Réessayer
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
      case 'site':
        view = <SiteView key="site" tab={id} />;
        break;
      case 'profil':
        // the profile is edited in Site (Accueil, À propos, Contact); this page keeps every field in one place
        view = <ProfileView />;
        break;
      case 'apercu':
        view = <PreviewView />;
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

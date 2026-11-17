import { useState } from 'preact/hooks';
import { ApiError, api, backupUrl } from '../api';
import { auth } from '../auth';
import { useStore } from '../store';
import { confirmDialog } from '../ui';
import { DeployBadge, relTime } from './dashboard';

export function SettingsView({ onLogout }: { onLogout: () => void }) {
  const { data, status, email, reload, refreshStatus, toast } = useStore();
  const [busy, setBusy] = useState(false);
  const pending = status?.draft?.ahead ?? 0;

  const discard = async () => {
    const ok = await confirmDialog({
      title: 'Abandonner toutes les modifications non publiées ?',
      body: 'Le brouillon sera remis à l’identique du site public. Cette action ne peut pas être annulée depuis l’administration (les versions restent dans l’historique Git).',
      confirm: 'Tout abandonner',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.discard();
      toast('Modifications abandonnées.');
      await reload();
      await refreshStatus();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Action impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Revokes every session on the server (other browsers, a forgotten computer), this one included.
  const logoutEverywhere = async () => {
    const ok = await confirmDialog({
      title: 'Fermer toutes les sessions ?',
      body: 'Toutes les sessions ouvertes, sur tous les appareils, sont révoquées immédiatement, y compris celle-ci.',
      confirm: 'Fermer toutes les sessions',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await auth.logoutEverywhere();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Action impossible.', 'error');
      setBusy(false);
      return;
    }
    onLogout();
  };

  const purge = async () => {
    setBusy(true);
    try {
      const r = await api.purge();
      toast(r.purged ? 'Cache vidé : le site public affiche la dernière publication.' : 'Le cache n’a pas pu être vidé. Réessayez dans un instant.', r.purged ? undefined : 'error');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Action impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const restore = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    let backup: { format?: string; exportedAt?: string; snapshot?: { entries?: Record<string, unknown> } };
    try {
      backup = JSON.parse(await file.text());
    } catch {
      toast('Ce fichier n’est pas une sauvegarde lisible.', 'error');
      return;
    }
    const projects = Object.keys(backup.snapshot?.entries ?? {}).filter((k) => k.includes('/projects/')).length;
    const ok = await confirmDialog({
      title: 'Restaurer cette sauvegarde dans le brouillon ?',
      body: `Sauvegarde du ${backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('fr-FR') : 'date inconnue'} (${projects} projet${projects > 1 ? 's' : ''}). Elle remplacera le brouillon actuel (qui est conservé en copie). Le site public ne change pas tant que vous ne publiez pas.`,
      confirm: 'Restaurer dans le brouillon',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await api.restore(backup, data?.ref.sha ?? '');
      toast(`Sauvegarde restaurée dans le brouillon (${r.projects} projets, ${r.media} médias). Vérifiez l’aperçu, puis publiez.`);
      await reload();
      await refreshStatus();
    } catch (err) {
      const details = err instanceof ApiError && err.details.length ? ` (${err.details.map((d) => d.path).join(', ')})` : '';
      toast(err instanceof ApiError ? `${err.message}${details}` : 'Restauration impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section class="view">
      <header class="view__head">
        <h1>Paramètres</h1>
      </header>
      <section class="panel" aria-labelledby="s-account">
        <h2 id="s-account">Compte</h2>
        <dl class="meta-list">
          <dt>Connecté en tant que</dt>
          <dd>{email}</dd>
          <dt>Mot de passe</dt>
          <dd>
            Il se change hors de l'administration : <code>npm run admin:setup</code> sur votre ordinateur, puis nouvelle valeur de{' '}
            <code>ADMIN_PASSWORD_HASH</code> dans Netlify (voir <code>docs/admin-guide.md</code>). Toutes les sessions sont alors fermées.
          </dd>
        </dl>
        <div class="btn-row">
          <button type="button" class="btn btn--ghost" onClick={onLogout}>
            Se déconnecter
          </button>
          <button type="button" class="btn btn--danger-ghost" disabled={busy} onClick={logoutEverywhere}>
            Fermer toutes les sessions
          </button>
        </div>
      </section>
      <section class="panel" aria-labelledby="s-pub">
        <h2 id="s-pub">Publication</h2>
        <dl class="meta-list">
          <dt>Contenu affiché ici</dt>
          <dd>
            {data?.ref.isDraft ? 'brouillon (modifications non publiées)' : 'identique au site public'}, version {data?.ref.sha}, {relTime(data?.ref.date)}
          </dd>
          <dt>Site public</dt>
          <dd>
            <DeployBadge d={status?.production.deploy} label="Site" />
          </dd>
          <dt>Aperçu</dt>
          <dd>
            {status?.previewUrl ? (
              <a href={status.previewUrl} target="_blank" rel="noopener">
                Ouvrir l'aperçu du brouillon
              </a>
            ) : (
              '—'
            )}{' '}
            (visible par vous seul, jamais indexé)
          </dd>
        </dl>
        <h3>Cache du site public</h3>
        <p class="hint">Chaque publication vide le cache automatiquement. À utiliser seulement si le site affiche encore une ancienne version.</p>
        <button type="button" class="btn btn--ghost" disabled={busy} onClick={purge}>
          Vider le cache
        </button>
        <h3>Abandonner le brouillon</h3>
        <p class="hint">Revient au contenu actuellement en ligne. {pending ? `${status!.draft!.files.length} modification(s) concernée(s).` : 'Aucune modification en attente.'}</p>
        <button type="button" class="btn btn--danger-ghost" disabled={!pending || busy} onClick={discard}>
          Abandonner les modifications non publiées
        </button>
      </section>
      <section class="panel" aria-labelledby="s-backup">
        <h2 id="s-backup">Sauvegarde</h2>
        <p class="hint">
          La sauvegarde contient tous les textes, projets, expériences, compétences, le référencement et la liste des médias (noms, textes alternatifs,
          dimensions). La version « avec les fichiers » contient aussi les images et PDF eux-mêmes (fichier plus lourd).
        </p>
        <div class="btn-row">
          <a class="btn btn--ghost" href={backupUrl(false)} download>
            Télécharger une sauvegarde
          </a>
          <a class="btn btn--ghost" href={backupUrl(true)} download>
            Télécharger avec les fichiers
          </a>
        </div>
        <h3>Restaurer une sauvegarde</h3>
        <p class="hint">
          Le contenu de la sauvegarde remplace le <strong>brouillon</strong> : vérifiez-le dans l'aperçu, puis publiez. Le mot de passe, les sessions et les
          réglages ne sont jamais modifiés. Le brouillon actuel est conservé en copie de sécurité.
        </p>
        <label class="btn btn--ghost file-btn">
          Choisir un fichier de sauvegarde…
          <input type="file" accept="application/json,.json" class="visually-hidden" disabled={busy} onChange={restore} />
        </label>
      </section>
      <section class="panel" aria-labelledby="s-help">
        <h2 id="s-help">Aide</h2>
        <p>
          Le mode d'emploi complet se trouve dans <code>docs/admin-guide.md</code> du dépôt. Les 20 dernières versions publiées sont conservées
          automatiquement ; téléchargez aussi une sauvegarde de temps en temps.
        </p>
      </section>
    </section>
  );
}

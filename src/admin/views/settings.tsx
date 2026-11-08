import { useState } from 'preact/hooks';
import { ApiError, api } from '../api';
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
          <dd>Pour le changer : déconnectez-vous puis « Mot de passe oublié ».</dd>
        </dl>
        <button type="button" class="btn btn--ghost" onClick={onLogout}>
          Se déconnecter
        </button>
      </section>
      <section class="panel" aria-labelledby="s-pub">
        <h2 id="s-pub">Publication</h2>
        <dl class="meta-list">
          <dt>Contenu lu depuis</dt>
          <dd>
            branche <code>{data?.ref.branch}</code> ({data?.ref.isDraft ? 'brouillon' : 'site public'}), {relTime(data?.ref.date)}
          </dd>
          <dt>Site public</dt>
          <dd>
            <DeployBadge d={status?.production.deploy} label="Production" />
          </dd>
          <dt>Aperçu</dt>
          <dd>{status?.previewUrl ? <a href={status.previewUrl} target="_blank" rel="noopener">{status.previewUrl}</a> : 'Non configuré (variable PREVIEW_URL)'}</dd>
        </dl>
        <h3>Abandonner le brouillon</h3>
        <p class="hint">Revient au contenu actuellement en ligne. {pending ? `${status!.draft!.files.length} fichier(s) concerné(s).` : 'Aucune modification en attente.'}</p>
        <button type="button" class="btn btn--danger-ghost" disabled={!pending || busy} onClick={discard}>
          Abandonner les modifications non publiées
        </button>
      </section>
      <section class="panel" aria-labelledby="s-help">
        <h2 id="s-help">Aide</h2>
        <p>
          Le mode d'emploi complet se trouve dans <code>docs/admin-guide.md</code> du dépôt. Chaque enregistrement est un commit Git attribué à votre adresse :
          rien n'est perdu, tout peut être retrouvé dans l'historique.
        </p>
      </section>
    </section>
  );
}

import { useState } from 'preact/hooks';
import { CONTENT_ROOT } from '../../lib/content-types';
import { ApiError, api, type DeployState } from '../api';
import { useStore } from '../store';
import { confirmDialog, Icon } from '../ui';

const TYPE_LABEL: Record<string, string> = {
  project: 'Projet',
  experience: 'Expérience',
  profile: 'Profil',
  skills: 'Compétences',
  seo: 'Référencement',
  media: 'Médiathèque',
};
const TYPE_ROUTE: Record<string, string> = { project: 'projets', experience: 'experiences', profile: 'profil', skills: 'competences', seo: 'seo', media: 'medias' };

export function relTime(iso?: string) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function DeployBadge({ d, label }: { d?: DeployState | null; label: string }) {
  const [cls, text] = d?.state === 'success' ? ['ok', `en ligne, publié ${relTime(d.updatedAt)}`] : ['muted', 'état inconnu'];
  return (
    <span class={`deploy deploy--${cls}`}>
      <span class="deploy__dot" aria-hidden="true" />
      {label} : {text}
      {d?.url && (
        <a href={d.url} target="_blank" rel="noopener">
          détails <span class="visually-hidden">(nouvel onglet)</span>
        </a>
      )}
    </span>
  );
}

/** Persistent bar: unpublished changes, preview link, publish button. */
export function PublishBar() {
  const { status, refreshStatus, reload, toast } = useStore();
  const [busy, setBusy] = useState(false);
  const pending = status?.draft?.ahead ?? 0;
  const preview = status?.previewUrl ?? null;

  const publish = async () => {
    const files = status?.draft?.files ?? [];
    const ok = await confirmDialog({
      title: `Publier ${files.length} modification${files.length > 1 ? 's' : ''} ?`,
      body: `Le site public affichera immédiatement le contenu du brouillon. ${files
        .slice(0, 8)
        .map((f) => `${TYPE_LABEL[f.type ?? ''] ?? f.path.split('/').pop()}${f.id ? ` « ${f.id} »` : ''}`)
        .join(', ')}${files.length > 8 ? '…' : ''}`,
      confirm: 'Publier',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await api.publish();
      toast(
        r.purged
          ? 'Publié : le site public est à jour.'
          : 'Publié, mais le cache du site n’a pas pu être vidé : le site peut encore afficher l’ancienne version. Réessayez « Vider le cache » dans les paramètres.',
        r.purged ? undefined : 'error',
      );
      await refreshStatus();
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Publication impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class={`publish-bar${pending ? ' has-pending' : ''}`}>
      <div class="publish-bar__state" aria-live="polite">
        {status === null ? (
          'Vérification de l’état de publication…'
        ) : pending ? (
          <>
            <strong>
              {status.draft!.files.length} modification{status.draft!.files.length > 1 ? 's' : ''}
            </strong>{' '}
            non publiée{status.draft!.files.length > 1 ? 's' : ''}
          </>
        ) : (
          'Le site est à jour'
        )}
      </div>
      <div class="publish-bar__actions">
        {pending > 0 && preview && (
          <a class="btn btn--small btn--ghost" href={preview} target="_blank" rel="noopener" title="Le site avec les modifications non publiées, visible par vous seul">
            Voir l'aperçu <Icon name="ext" size={14} />
          </a>
        )}
        <button type="button" class="btn btn--small btn--accent" disabled={!pending || busy} onClick={publish}>
          {busy ? 'Publication…' : 'Publier le site'}
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, status, email } = useStore();
  if (!data) return null;
  const { project, experience } = data.collections;
  const visible = project.filter((p) => p.data.visible !== false).length;
  const hiddenProjects = project.length - visible;

  const recent = [
    ...project,
    ...experience,
    ...Object.values(data.singletons).filter((x) => x && x.type !== 'media'),
  ]
    .filter((e) => e?.data.updatedAt)
    .sort((a, b) => String(b!.data.updatedAt).localeCompare(String(a!.data.updatedAt)))
    .slice(0, 6);

  const stats = [
    { label: 'Projets', value: project.length, note: hiddenProjects ? `${hiddenProjects} masqué${hiddenProjects > 1 ? 's' : ''}` : 'tous visibles', href: '#/projets' },
    { label: 'Expériences', value: experience.length, note: `${experience.filter((x) => !x.data.end).length} en cours`, href: '#/experiences' },
    { label: 'Médias', value: data.mediaFiles.length, note: 'dans la médiathèque', href: '#/medias' },
  ];

  return (
    <section class="view">
      <header class="view__head">
        <div>
          <h1>Bonjour</h1>
          <p class="lead">Connecté en tant que {email}.</p>
        </div>
        <a class="btn" href="#/projets/nouveau">
          + Nouveau projet
        </a>
      </header>

      <ul class="stats">
        {stats.map((s) => (
          <li>
            <a href={s.href}>
              <span class="stats__value">{s.value}</span>
              <span class="stats__label">{s.label}</span>
              <span class="stats__note">{s.note}</span>
            </a>
          </li>
        ))}
      </ul>

      <div class="dash-grid">
        <section class="panel" aria-labelledby="d-pub">
          <h2 id="d-pub">Publication</h2>
          <div class="deploys">
            <DeployBadge d={status?.production.deploy} label="Site public" />
          </div>
          {status?.draft && status.draft.ahead > 0 ? (
            <>
              <p>Modifications enregistrées, pas encore en ligne :</p>
              <ul class="changes">
                {status.draft.files.map((f) => (
                  <li>
                    <span class={`chg chg--${f.status}`}>{f.status === 'added' ? 'Ajout' : f.status === 'removed' ? 'Suppression' : 'Modification'}</span>
                    {f.type && f.type !== 'media' && f.status !== 'removed' ? (
                      <a href={`#/${TYPE_ROUTE[f.type]}${f.id ? `/${f.id}` : ''}`}>
                        {TYPE_LABEL[f.type]} {f.id ? `« ${f.id} »` : ''}
                      </a>
                    ) : (
                      <span>{f.type ? TYPE_LABEL[f.type] : f.path.replace(`${CONTENT_ROOT}/`, '')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p class="muted">Aucune modification en attente : le site public correspond au contenu.</p>
          )}
        </section>

        <section class="panel" aria-labelledby="d-recent">
          <h2 id="d-recent">Dernières modifications</h2>
          {recent.length === 0 ? (
            <p class="muted">Les contenus modifiés depuis l'administration apparaîtront ici.</p>
          ) : (
            <ul class="recent">
              {recent.map((e) => (
                <li>
                  <a href={`#/${TYPE_ROUTE[e!.type]}${e!.id ? `/${e!.id}` : ''}`}>
                    <strong>{String(e!.data.title ?? e!.data.role ?? TYPE_LABEL[e!.type])}</strong>
                    <span>
                      {TYPE_LABEL[e!.type]} · {relTime(String(e!.data.updatedAt))}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

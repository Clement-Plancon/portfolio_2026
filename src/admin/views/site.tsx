// « Site »: everything on the page that is not a project, a position or a skill, organised as the page
// is (Accueil, Sections et navigation, Projets et parcours, À propos, Contact, Apparence) rather than by
// the stored documents. A tab may edit two documents (the profile and the site's settings): they are
// validated and saved together.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { AMBIANCE, SECTION_DEFAULTS } from '../../lib/site';
import { type Profile, profileSchema, SECTION_IDS, type SectionId, type Site, siteSchema } from '../../lib/schemas';
import { useStore, useUnsavedGuard } from '../store';
import { type Errors, FormActions, IconButton, ImageField, issuesToErrors, LinkList, Select, TextArea, TextInput, Toggle } from '../ui';
import { EditorShell } from './shared';

const TABS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'sections', label: 'Sections et navigation' },
  { id: 'projets', label: 'Projets et parcours' },
  { id: 'a-propos', label: 'À propos' },
  { id: 'contact', label: 'Contact' },
  { id: 'apparence', label: 'Apparence' },
] as const;
type Tab = (typeof TABS)[number]['id'];

type SiteForm = Site;
type ProfileForm = Profile;

const opt = (v: string) => (v.trim() ? v : undefined);

function useSiteDocs() {
  const { data, save } = useStore();
  const siteEntry = data?.singletons.site;
  const profileEntry = data?.singletons.profile;
  const siteOriginal = useMemo(() => siteSchema.parse(structuredClone(siteEntry?.data ?? {})) as SiteForm, [siteEntry?.sha]);
  const profileOriginal = useMemo(() => structuredClone(profileEntry?.data ?? {}) as ProfileForm, [profileEntry?.sha]);
  const [site, setSite] = useState<SiteForm>(siteOriginal);
  const [profile, setProfile] = useState<ProfileForm>(profileOriginal);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setSite(siteOriginal), [siteOriginal]);
  useEffect(() => setProfile(profileOriginal), [profileOriginal]);
  const siteDirty = JSON.stringify(site) !== JSON.stringify(siteOriginal);
  const profileDirty = JSON.stringify(profile) !== JSON.stringify(profileOriginal);
  const dirty = siteDirty || profileDirty;
  useUnsavedGuard(dirty);

  const submit = async () => {
    const s = siteSchema.safeParse(site);
    const p = profileSchema.safeParse(profile);
    const errs: Errors = {
      ...(s.success ? {} : prefixed(issuesToErrors(s.error.issues), 'site')),
      ...(p.success ? {} : prefixed(issuesToErrors(p.error.issues), 'profile')),
    };
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const changes = [
      ...(siteDirty ? [{ op: 'put' as const, type: 'site' as const, data: site, baseSha: siteEntry?.sha ?? null }] : []),
      ...(profileDirty ? [{ op: 'put' as const, type: 'profile' as const, data: profile, baseSha: profileEntry?.sha ?? null }] : []),
    ];
    const err = await save('Modification : site', changes);
    setSaving(false);
    if (err?.details.length) setErrors(issuesToErrors(err.details));
  };
  return {
    site,
    setSite,
    profile,
    setProfile,
    errors,
    dirty,
    saving,
    submit,
    reset: () => {
      setSite(siteOriginal);
      setProfile(profileOriginal);
      setErrors({});
    },
  };
}

function prefixed(e: Errors, p: string): Errors {
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [`${p}.${k}`, v]));
}

/** A button of the introduction: its text and where it goes (a section of the page, or an address). */
function ButtonField(p: {
  label: string;
  value?: { label: string; href: string };
  fallback: { label: string; href: string };
  onChange: (v?: { label: string; href: string }) => void;
  error?: string;
  hint: string;
}) {
  const v = p.value;
  const target = v?.href.startsWith('#') ? v.href : v ? 'url' : '';
  return (
    <fieldset class="list-field">
      <legend>{p.label}</legend>
      <p class="hint">{p.hint}</p>
      <Toggle label="Personnaliser ce bouton" hint="Désactivé : le bouton par défaut." checked={!!v} onChange={(on) => p.onChange(on ? { ...p.fallback } : undefined)} />
      {v && (
        <div class="grid-2">
          <TextInput label="Texte du bouton" value={v.label} maxLength={40} recommended={24} onInput={(label) => p.onChange({ ...v, label })} />
          <Select
            label="Mène à"
            value={target}
            options={[
              ...SECTION_IDS.map((id) => ({ value: `#${id}`, label: `La section ${SECTION_DEFAULTS[id].label}` })),
              { value: 'url', label: 'Une adresse (lien externe)' },
            ]}
            onChange={(t) => p.onChange({ ...v, href: t === 'url' ? 'https://' : t })}
          />
          {target === 'url' && <TextInput label="Adresse" value={v.href} error={p.error} onInput={(href) => p.onChange({ ...v, href })} />}
        </div>
      )}
    </fieldset>
  );
}

export function SiteView({ tab: rawTab }: { tab?: string }) {
  const tab: Tab = (TABS.find((t) => t.id === rawTab)?.id ?? 'accueil') as Tab;
  const d = useSiteDocs();
  const { data } = useStore();
  const { site, setSite, profile, setProfile, errors: e } = d;
  if (!profile.name && !d.dirty) return null;
  const setHero = (k: keyof Site['hero'], v: unknown) => setSite({ ...site, hero: { ...site.hero, [k]: v } });
  const setP = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => setProfile({ ...profile, [k]: v });
  const pdfs = (data?.mediaFiles ?? []).filter((m) => m.ref.endsWith('.pdf'));

  // Sections: the saved order completed with defaults, contact last.
  const sections = (() => {
    const saved = site.sections ?? [];
    const all = [...saved, ...SECTION_IDS.filter((id) => !saved.some((s) => s.id === id)).map((id) => ({ id, visible: true }))] as NonNullable<Site['sections']>;
    return [...all.filter((s) => s.id !== 'contact'), ...all.filter((s) => s.id === 'contact')];
  })();
  const setSection = (id: SectionId, patch: Partial<NonNullable<Site['sections']>[number]>) =>
    setSite({ ...site, sections: sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const move = (i: number, by: number) => {
    const next = [...sections];
    const [it] = next.splice(i, 1);
    next.splice(i + by, 0, it);
    setSite({ ...site, sections: next });
  };
  const projects = data?.collections.project ?? [];
  const featuredCount = projects.filter((p) => (p.data as { featured?: boolean; visible?: boolean }).featured && (p.data as { visible?: boolean }).visible !== false).length;

  return (
    <EditorShell
      back={{ href: '#/', label: 'Tableau de bord' }}
      title="Site"
      publicPath={tab === 'accueil' ? '/' : `/#${tab === 'apparence' || tab === 'sections' ? '' : tab === 'projets' ? 'projets' : tab}`}
      actions={<FormActions dirty={d.dirty} saving={d.saving} onSave={d.submit} onCancel={d.reset} />}
      errorCount={Object.keys(e).length}
    >
      <nav class="tabs" aria-label="Parties du site">
        {TABS.map((t) => (
          // Switching tab keeps the form: it is the same view, edits are kept until saved or cancelled.
          <a href={`#/site/${t.id}`} aria-current={t.id === tab ? 'page' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>

      {tab === 'accueil' && (
        <>
          <section class="panel" aria-labelledby="s-id">
            <h2 id="s-id">Qui vous êtes</h2>
            <div class="grid-2">
              <TextInput label="Nom" required value={profile.name} maxLength={80} recommended={24} error={e['profile.name']} onInput={(v) => setP('name', v)} />
              <TextInput label="Titre professionnel" required value={profile.jobTitle} maxLength={120} recommended={40} error={e['profile.jobTitle']} onInput={(v) => setP('jobTitle', v)} />
            </div>
            <TextArea label="Courte présentation" required hint="Une ou deux phrases, sous votre nom." value={profile.headline} maxLength={200} recommended={140} rows={2} error={e['profile.headline']} onInput={(v) => setP('headline', v)} />
            <TextInput
              label="Ligne au-dessus du nom"
              hint={`Vide : « ${[profile.location, '(organisation actuelle)'].join(' — ')} ». Séparez deux éléments par « — ».`}
              value={site.hero.kicker}
              maxLength={140}
              recommended={70}
              onInput={(v) => setHero('kicker', opt(v))}
            />
            <TextInput label="Ville" required value={profile.location} maxLength={120} error={e['profile.location']} onInput={(v) => setP('location', v)} />
          </section>
          <section class="panel" aria-labelledby="s-btn">
            <h2 id="s-btn">Boutons</h2>
            <ButtonField label="Bouton principal" hint="Par défaut : « Explorer les projets », vers les projets (absent s'il n'y a aucun projet)." fallback={{ label: 'Explorer les projets', href: '#projets' }} value={site.hero.primary} error={e['site.hero.primary.href']} onChange={(v) => setHero('primary', v)} />
            <ButtonField label="Bouton secondaire" hint="Par défaut : « Me contacter », vers le contact." fallback={{ label: 'Me contacter', href: '#contact' }} value={site.hero.secondary} error={e['site.hero.secondary.href']} onChange={(v) => setHero('secondary', v)} />
          </section>
          <section class="panel" aria-labelledby="s-media">
            <h2 id="s-media">Image ou vidéo d'accueil</h2>
            <p class="hint">Facultatif. Elle est posée au milieu des fils, à droite du nom (au-dessus sur téléphone). Une vidéo est lue en boucle, sans le son, avec un bouton pause ; elle ne se lance pas seule pour les visiteurs qui limitent les animations. Vidéo : 4 Mo au plus (MP4 ou WebM).</p>
            <ImageField kind="media" label="Média" value={site.hero.media} errors={e} prefix="site.hero.media" onChange={(v) => setHero('media', v && { src: v.src, alt: v.alt })} />
            <TextInput label="Invitation sous l'accueil" hint="Vide : « Passez sur les fils pour les démêler — faites défiler »." value={site.hero.hint} maxLength={120} recommended={60} onInput={(v) => setHero('hint', opt(v))} />
          </section>
          <section class="panel" aria-labelledby="s-share">
            <h2 id="s-share">Image de partage</h2>
            <TextInput
              label="Phrase d'accroche"
              hint="Reprise dans l'image de partage (réseaux sociaux). Entourez un mot d'astérisques pour le mettre en valeur : Je rends *lisible*…"
              value={profile.statement}
              maxLength={90}
              onInput={(v) => setP('statement', opt(v))}
            />
          </section>
        </>
      )}

      {tab === 'sections' && (
        <section class="panel" aria-labelledby="s-sec">
          <h2 id="s-sec">Sections de la page</h2>
          <p class="hint">L'ordre ci-dessous est celui de la page et du menu (l'accueil est toujours en premier, le contact toujours en dernier). Une section masquée disparaît de la page et du menu ; une section sans contenu (aucun projet, par exemple) est masquée d'elle-même.</p>
          <ol class="section-list">
            {sections.map((s, i) => {
              const def = SECTION_DEFAULTS[s.id];
              const locked = s.id === 'contact';
              return (
                <li class="section-item" key={s.id}>
                  <div class="section-item__head">
                    <strong>{def.label}</strong>
                    <div class="btn-row">
                      <IconButton label={`Monter ${def.label}`} icon="up" disabled={locked || i === 0} onClick={() => move(i, -1)} />
                      <IconButton label={`Descendre ${def.label}`} icon="down" disabled={locked || i >= sections.length - 2} onClick={() => move(i, 1)} />
                    </div>
                  </div>
                  <Toggle label="Afficher cette section" checked={s.visible !== false} onChange={(v) => setSection(s.id, { visible: v })} />
                  <div class="grid-2">
                    <TextInput label="Nom dans le menu" hint={`Vide : « ${def.label} »`} value={s.label} maxLength={30} recommended={14} onInput={(v) => setSection(s.id, { label: opt(v) })} />
                    <TextInput label="Titre sur la page" hint={`Vide : « ${def.title} »`} value={s.title} maxLength={90} recommended={30} onInput={(v) => setSection(s.id, { title: opt(v) })} />
                  </div>
                  <TextArea label="Phrase d'introduction (facultatif)" value={s.intro} maxLength={400} recommended={180} rows={2} onInput={(v) => setSection(s.id, { intro: opt(v) })} />
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {tab === 'projets' && (
        <>
          <section class="panel" aria-labelledby="s-proj">
            <h2 id="s-proj">Projets sur la page</h2>
            <Select
              label="Projets mis en scène"
              hint="Chaque projet mis en scène a son écran, avec son fil et son motif. Les autres projets visibles sont présentés plus brièvement, sous « Autres réalisations »."
              value={site.projects.selection}
              options={[
                { value: 'tous', label: 'Tous les projets visibles (dans l’ordre de la liste)' },
                { value: 'mis-en-avant', label: 'Seulement les projets mis en avant (★)' },
              ]}
              onChange={(v) => setSite({ ...site, projects: { ...site.projects, selection: v } })}
            />
            {site.projects.selection === 'mis-en-avant' && featuredCount === 0 && (
              <p class="form-alert">Aucun projet n'est mis en avant : tous les projets visibles sont mis en scène en attendant.</p>
            )}
            <TextInput
              label="Nombre maximum de projets mis en scène"
              hint="Au-delà, les projets passent dans « Autres réalisations ». Conseillé : 4 à 6."
              type="number"
              value={String(site.projects.max)}
              error={e['site.projects.max']}
              onInput={(v) => setSite({ ...site, projects: { ...site.projects, max: Math.max(1, Math.min(24, Number(v) || 1)) } })}
            />
            <TextInput label="Titre des autres réalisations" hint="Vide : « Autres réalisations »." value={site.projects.othersTitle} maxLength={80} onInput={(v) => setSite({ ...site, projects: { ...site.projects, othersTitle: opt(v) } })} />
            <p class="hint">
              L'ordre et la mise en avant se règlent dans <a href="#/projets">la liste des projets</a>, qui indique pour chacun où il apparaît.
            </p>
          </section>
          <section class="panel" aria-labelledby="s-journey">
            <h2 id="s-journey">Parcours</h2>
            <TextInput
              label="Postes racontés en entier"
              hint="Les postes actuels puis ceux mis en avant (★), dans cet ordre. Les autres sont dans une liste « Tout le parcours » qui s'ouvre. Conseillé : 3."
              type="number"
              value={String(site.journey.chapters)}
              onInput={(v) => setSite({ ...site, journey: { chapters: Math.max(1, Math.min(8, Number(v) || 1)) } })}
            />
          </section>
        </>
      )}

      {tab === 'a-propos' && (
        <>
          <section class="panel" aria-labelledby="s-about">
            <h2 id="s-about">Présentation</h2>
            <TextArea label="Introduction" required hint="Deux phrases, en grand en tête de la section." value={profile.intro} maxLength={600} recommended={220} rows={3} error={e['profile.intro']} onInput={(v) => setP('intro', v)} />
            <TextArea label="Biographie" required hint="Une ligne vide entre deux paragraphes. Le dernier paragraphe est mis en exergue, au milieu des fils." value={profile.bio} maxLength={6000} recommended={1400} rows={10} error={e['profile.bio']} onInput={(v) => setP('bio', v)} />
            <ImageField label="Photo ou image (facultatif)" value={profile.photo} errors={e} prefix="profile.photo" onChange={(v) => setP('photo', v && { src: v.src, alt: v.alt })} />
            <p class="hint">Le poste actuel est repris automatiquement de vos <a href="#/experiences">expériences</a> (celle sans date de fin).</p>
          </section>
          <section class="panel" aria-labelledby="s-cv">
            <h2 id="s-cv">CV</h2>
            <Select
              label="CV (PDF de la médiathèque)"
              hint="Ajoutez d'abord le PDF dans Médias. Le bouton « Télécharger le CV » apparaît dans À propos et dans Contact."
              value={profile.cv ?? ''}
              options={[{ value: '', label: 'Aucun' }, ...pdfs.map((f) => ({ value: f.ref, label: f.ref.replace('files/', '') }))]}
              onChange={(v) => setP('cv', v || undefined)}
            />
          </section>
          <section class="panel" aria-labelledby="s-princ">
            <h2 id="s-princ">Façon de travailler</h2>
            <Toggle label="Afficher les principes" checked={site.about.showPrinciples} onChange={(v) => setSite({ ...site, about: { ...site.about, showPrinciples: v } })} />
            <TextInput label="Titre" hint="Vide : « Ma façon de travailler »." value={site.about.principlesTitle} maxLength={80} onInput={(v) => setSite({ ...site, about: { ...site.about, principlesTitle: opt(v) } })} />
            {profile.principles.map((pr, i) => (
              <div class="gallery-item" key={i}>
                <div class="grid-2">
                  <TextInput label={`Principe ${i + 1}`} value={pr.title} maxLength={120} recommended={40} onInput={(v) => setP('principles', profile.principles.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
                  <TextArea label="Explication" value={pr.text} maxLength={600} recommended={180} rows={2} onInput={(v) => setP('principles', profile.principles.map((x, j) => (j === i ? { ...x, text: v } : x)))} />
                </div>
                <button type="button" class="btn btn--small btn--ghost" onClick={() => setP('principles', profile.principles.filter((_, j) => j !== i))}>
                  Retirer ce principe
                </button>
              </div>
            ))}
            {profile.principles.length < 8 && (
              <button type="button" class="btn btn--small" onClick={() => setP('principles', [...profile.principles, { title: '', text: '' }])}>
                Ajouter un principe
              </button>
            )}
          </section>
        </>
      )}

      {tab === 'contact' && (
        <section class="panel" aria-labelledby="s-contact">
          <h2 id="s-contact">Contact</h2>
          <TextInput label="E-mail" required type="email" value={profile.email} error={e['profile.email']} onInput={(v) => setP('email', v)} />
          <TextArea label="Texte de la section" hint="Vide : « Un projet, une équipe à renforcer, une question technique : écrivez-moi… »." value={site.contact.lead} maxLength={300} recommended={160} rows={2} onInput={(v) => setSite({ ...site, contact: { ...site.contact, lead: opt(v) } })} />
          <TextInput label="Texte du bouton de copie" hint="Vide : « Copier l'adresse »." value={site.contact.copyLabel} maxLength={40} onInput={(v) => setSite({ ...site, contact: { ...site.contact, copyLabel: opt(v) } })} />
          <p class="hint">Liens : GitHub et LinkedIn sont reconnus par leur nom et présentés en premier ; ajoutez autant d'autres liens que nécessaire. Le titre de la section se règle dans « Sections et navigation ».</p>
          <LinkList items={profile.socials} errors={e} prefix="profile.socials" onChange={(v) => setP('socials', v)} />
        </section>
      )}

      {tab === 'apparence' && (
        <section class="panel" aria-labelledby="s-look">
          <h2 id="s-look">Apparence</h2>
          <fieldset class="swatches">
            <legend>Ambiance</legend>
            {(Object.entries(AMBIANCE) as [keyof typeof AMBIANCE, (typeof AMBIANCE)[keyof typeof AMBIANCE]][]).map(([k, a]) => (
              <label class="swatch-option">
                <input type="radio" name="ambiance" value={k} checked={site.appearance.ambiance === k} onChange={() => setSite({ ...site, appearance: { ...site.appearance, ambiance: k } })} />
                <span class="swatch" style={{ background: `radial-gradient(circle at 40% 40%, ${a.glow}, #0f0e0d 75%)`, boxShadow: `inset 0 0 0 3px ${a.accent}` }} aria-hidden="true" />
                {a.label}
              </label>
            ))}
          </fieldset>
          <Select
            label="Scène des fils"
            hint="« Automatique » : la scène animée en 3D sur les appareils qui la font tourner sans peine, les fils dessinés sinon. « Fils dessinés » : jamais de 3D."
            value={site.appearance.scene}
            options={[
              { value: 'auto', label: 'Automatique' },
              { value: 'svg', label: 'Fils dessinés (sans 3D)' },
            ]}
            onChange={(v) => setSite({ ...site, appearance: { ...site.appearance, scene: v } })}
          />
          <p class="hint">La teinte et le motif de chaque fil se choisissent dans chaque projet.</p>
        </section>
      )}
    </EditorShell>
  );
}

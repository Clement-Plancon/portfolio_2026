import { COVER_COLORS } from '../../lib/schemas';
import { POSTER_LABELS, POSTER_LAYOUTS } from '../../lib/poster';
import type { MOTIFS } from '../../lib/schemas';
import { TINTS } from '../../lib/tints';
import type { Entry } from '../api';
import { useStore } from '../store';
import { siteSchema } from '../../lib/schemas';
import { FormActions, ImageField, LinkList, Select, StringList, TagInput, TextArea, TextInput, Thumb, Toggle } from '../ui';
import { CollectionList, useEntryEditor } from './collection';
import { EditorShell, NotFound, SlugField } from './shared';

/** Where each project appears on the site, with the settings of Site → Projets et parcours (same rule as src/lib/site.ts). */
function usePlacement() {
  const { data } = useStore();
  const settings = siteSchema.parse(data?.singletons.site?.data ?? {}).projects;
  const visible = (data?.collections.project ?? [])
    .filter((e) => (e.data as { visible?: boolean }).visible !== false)
    .sort((a, b) => ((a.data.order as number) ?? 0) - ((b.data.order as number) ?? 0) || (a.id ?? '').localeCompare(b.id ?? ''));
  const featured = visible.filter((e) => e.data.featured);
  const pool = settings.selection === 'mis-en-avant' && featured.length ? featured : visible;
  const scenes = new Set(pool.slice(0, settings.max).map((e) => e.id));
  return { settings, scenes };
}

export function ProjectList() {
  const { settings, scenes } = usePlacement();
  return (
    <CollectionList
      type="project"
      title="Projets"
      lead={`L'ordre ci-dessous est celui du site. ${
        settings.selection === 'mis-en-avant' ? `Les projets mis en avant (★) sont présentés en grand, ${settings.max} au plus` : `Les ${settings.max} premiers projets visibles sont présentés en grand`
      } ; les autres projets visibles sont dans la bande « Autres réalisations ». Ce réglage se change dans Site → Projets et parcours.`}
      base="projets"
      newLabel="Nouveau projet"
      reorderable
      featured
      describe={(e: Entry) => {
        const d = e.data as { title: string; kind?: string; category: string; period?: { start: string; end?: string }; cover?: { color: string; image?: { src: string } } };
        const hidden = (e.data as { visible?: boolean }).visible === false;
        return {
          title: d.title,
          meta: [d.category === 'pro' ? 'Professionnel' : 'Personnel', d.kind, d.period?.start].filter(Boolean).join(' · '),
          status: hidden ? { label: 'Masqué', tone: 'hidden' } : scenes.has(e.id) ? { label: 'En grand', tone: 'scene' } : { label: 'Autres réalisations', tone: 'other' },
          thumb: d.cover?.image ? (
            <Thumb src={d.cover.image.src} size="sm" />
          ) : (
            <span class="swatch" style={{ background: TINTS[(d.cover?.color ?? 'sapin') as keyof typeof TINTS].bg }} aria-hidden="true" />
          ),
        };
      }}
    />
  );
}

type ProjectForm = {
  title: string;
  summary: string;
  kind?: string;
  category: 'pro' | 'perso';
  organisation?: string;
  period?: { start: string; end?: string };
  status?: 'termine' | 'en-cours';
  role?: string;
  context?: string;
  problem?: string;
  approach?: string;
  contributions: string[];
  results: string[];
  technologies: string[];
  links: { label: string; url: string }[];
  cover: {
    color: (typeof COVER_COLORS)[number];
    image?: { src: string; alt: string; caption?: string };
    video?: { src: string; alt: string };
    poster?: (typeof POSTER_LAYOUTS)[number];
    motif?: (typeof MOTIFS)[number];
    variant?: 'auto' | 'texte-gauche' | 'texte-droite';
  };
  gallery: { src: string; alt: string; caption?: string }[];
  featured: boolean;
  visible: boolean;
  order: number;
  seo: { title?: string; description?: string; ogImage?: string; noindex?: boolean };
  [k: string]: unknown;
};

const blank = (): ProjectForm => ({
  title: '',
  summary: '',
  category: 'pro',
  contributions: [],
  results: [],
  technologies: [],
  links: [],
  cover: { color: 'sapin' },
  gallery: [],
  featured: false,
  visible: true,
  order: 999,
  seo: {},
});

const opt = (v: string) => (v.trim() ? v : undefined);

export function ProjectEditor({ id }: { id: string }) {
  const ed = useEntryEditor<ProjectForm>('project', id, blank, 'title');
  if (ed.missing) return <NotFound back="projets" />;
  const { form: f, set, errors: e } = ed;
  const period = f.period ?? { start: '' };
  const setPeriod = (k: 'start' | 'end', v: string) => {
    const next = { ...period, [k]: opt(v) };
    set('period', next.start || next.end ? (next as ProjectForm['period']) : undefined);
  };

  // The main media: a video (with the image as its poster) or an image.
  const main = f.cover.video ?? f.cover.image;
  const setMain = (v?: { src: string; alt: string; caption?: string }) => {
    if (!v) return set('cover', { ...f.cover, image: undefined, video: undefined });
    if (/\.(mp4|webm)$/.test(v.src)) set('cover', { ...f.cover, video: { src: v.src, alt: v.alt } });
    else set('cover', { ...f.cover, image: { src: v.src, alt: v.alt, caption: f.cover.image?.caption }, video: undefined });
  };
  const link = f.links[0];
  const setLink = (k: 'label' | 'url', v: string) => {
    const next = { label: link?.label ?? 'Voir le site', url: link?.url ?? '', [k]: v };
    set('links', next.url.trim() || k === 'url' ? [next, ...f.links.slice(1)] : f.links.slice(1));
  };

  return (
    <EditorShell
      back={{ href: '#/projets', label: 'Projets' }}
      title={ed.isNew ? 'Nouveau projet' : f.title || 'Sans titre'}
      publicPath={ed.isNew ? undefined : `/#projet-${id}`}
      actions={<FormActions dirty={ed.dirty} saving={ed.saving} onSave={ed.submit} onCancel={ed.isNew ? undefined : ed.reset} />}
      errorCount={Object.keys(e).length}
    >
      <section class="panel" aria-labelledby="p-essentiel">
        <h2 id="p-essentiel">L'essentiel</h2>
        <p class="hint">Ces six informations suffisent pour publier un projet. Le reste est facultatif, dans « Paramètres avancés ».</p>
        <TextInput label="Titre" required value={f.title} maxLength={120} recommended={32} error={e.title} onInput={(v) => set('title', v)} />
        <TextArea
          label="Description courte"
          required
          hint="Deux phrases : ce que c'est et pour qui. Affichée sur la page et en chapeau de l'article."
          value={f.summary}
          maxLength={320}
          recommended={200}
          rows={3}
          error={e.summary}
          onInput={(v) => set('summary', v)}
        />
        <ImageField
          kind="media"
          label="Image ou vidéo principale (facultatif)"
          hint="Une capture réelle de l'application, ou une courte vidéo (4 Mo au plus, sans le son). Portrait, paysage ou carré : le site la cadre sans la déformer. Sans média, le projet est représenté par une affiche composée de son numéro, de son titre et de sa couleur."
          value={main}
          errors={e}
          prefix={f.cover.video ? 'cover.video' : 'cover.image'}
          onChange={setMain}
        />
        <div class="grid-2">
          <TextInput label="Lien (facultatif)" hint="Adresse du site, du code ou d'un article." value={link?.url} error={e['links.0.url']} placeholder="https://" onInput={(v) => setLink('url', v)} />
          <TextInput label="Texte du lien" value={link?.label} maxLength={80} recommended={20} placeholder="Voir le site" onInput={(v) => setLink('label', v)} />
        </div>
        <div class="toggles">
          <Toggle label="Visible sur le site" hint="Masqué : visible seulement dans l'aperçu." checked={f.visible} onChange={(v) => set('visible', v)} />
          <Toggle label="Mis en avant" hint="Avec le réglage « Projets mis en avant » (Site → Projets et parcours), seuls ces projets sont présentés en grand (4 au plus par défaut) ; les autres sont dans la bande « Autres réalisations »." checked={f.featured} onChange={(v) => set('featured', v)} />
        </div>
      </section>

      {/* opened by itself when one of its fields has an error */}
      <details class="advanced" open={Object.keys(e).some((k) => !['title', 'summary', 'links.0.url', 'cover.image.alt', 'cover.video.alt'].includes(k)) || undefined}>
        <summary>Paramètres avancés</summary>

        <section class="panel" aria-labelledby="p-infos">
          <h2 id="p-infos">Informations</h2>
          <SlugField prefix="/#projet-" value={ed.slug} onInput={ed.setSlug} error={e.slug} isNew={ed.isNew} />
          <div class="grid-2">
            <TextInput label="Nature du projet" hint="Ex. : Application web · Tableau de bord" value={f.kind} maxLength={80} recommended={40} onInput={(v) => set('kind', opt(v))} />
            <Select label="Catégorie" value={f.category} options={[{ value: 'pro', label: 'Professionnel' }, { value: 'perso', label: 'Personnel' }]} onChange={(v) => set('category', v)} />
          </div>
          <div class="grid-3">
            <TextInput label="Organisation / cadre" value={f.organisation} maxLength={120} onInput={(v) => set('organisation', opt(v))} />
            <TextInput label="Début" hint="AAAA ou AAAA-MM" value={period.start} error={e['period.start']} onInput={(v) => setPeriod('start', v)} placeholder="2024" />
            <TextInput label="Fin" hint="Vide si une seule année" value={period.end} error={e['period.end']} onInput={(v) => setPeriod('end', v)} placeholder="2025" />
          </div>
          <Select
            label="État"
            value={f.status ?? ''}
            options={[
              { value: '', label: 'Non précisé' },
              { value: 'en-cours', label: 'En cours / en développement' },
              { value: 'termine', label: 'Terminé' },
            ]}
            onChange={(v) => set('status', (v || undefined) as ProjectForm['status'])}
          />
        </section>

        <section class="panel" aria-labelledby="p-couverture">
          <h2 id="p-couverture">Présentation</h2>
          <p class="hint">Sur le site, chaque projet est une affiche dans sa couleur : son image ou sa vidéo quand il en a une, sinon une composition faite de son numéro, de son titre, de sa nature et de ses technologies.</p>
          <div class="grid-2">
            <Select
              label="Composition de l'affiche"
              hint="Utilisée quand le projet n'a ni image ni vidéo. « Automatique » varie d'un projet à l'autre."
              value={f.cover.poster ?? ''}
              options={[{ value: '', label: 'Automatique' }, ...POSTER_LAYOUTS.map((m) => ({ value: m, label: POSTER_LABELS[m] }))]}
              onChange={(v) => set('cover', { ...f.cover, poster: (v || undefined) as ProjectForm['cover']['poster'] })}
            />
            <Select
              label="Disposition"
              hint="De quel côté se place l'affiche quand le projet est présenté en grand."
              value={f.cover.variant ?? 'auto'}
              options={[
                { value: 'auto', label: 'Automatique (alterne)' },
                { value: 'texte-gauche', label: 'Affiche à droite' },
                { value: 'texte-droite', label: 'Affiche à gauche' },
              ]}
              onChange={(v) => set('cover', { ...f.cover, variant: v === 'auto' ? undefined : (v as 'texte-gauche' | 'texte-droite') })}
            />
          </div>
          <fieldset class="swatches">
            <legend>Couleur de l'affiche</legend>
            {COVER_COLORS.map((c) => (
              <label class="swatch-option">
                <input type="radio" name="cover-color" value={c} checked={f.cover.color === c} onChange={() => set('cover', { ...f.cover, color: c })} />
                <span class="swatch" style={{ background: TINTS[c].bg }} aria-hidden="true" />
                {TINTS[c].label}
              </label>
            ))}
          </fieldset>
          {f.cover.video && (
            <ImageField
              label="Image d'aperçu de la vidéo (facultatif)"
              hint="Montrée avant la lecture, et à la place de la vidéo pour les visiteurs qui limitent les animations."
              value={f.cover.image}
              errors={e}
              prefix="cover.image"
              onChange={(img) => set('cover', { ...f.cover, image: img })}
            />
          )}
        </section>

        <section class="panel" aria-labelledby="p-detail">
          <h2 id="p-detail">Article</h2>
          <p class="hint">Tous ces champs sont facultatifs : une section vide n'apparaît pas. Laissez une ligne vide entre deux paragraphes.</p>
          <TextArea label="Contexte" value={f.context} maxLength={4000} recommended={900} rows={5} onInput={(v) => set('context', opt(v))} />
          <TextArea label="Problème" value={f.problem} maxLength={4000} recommended={900} rows={4} onInput={(v) => set('problem', opt(v))} />
          <TextArea label="Mon rôle" value={f.role} maxLength={1500} recommended={500} rows={3} onInput={(v) => set('role', opt(v))} />
          <TextArea label="Approche" value={f.approach} maxLength={4000} recommended={900} rows={5} onInput={(v) => set('approach', opt(v))} />
          <StringList label={f.category === 'pro' ? 'Contributions' : 'Fonctionnalités'} items={f.contributions} addLabel="Ajouter une ligne" maxLength={300} onChange={(v) => set('contributions', v)} error={e.contributions} />
          <StringList label="Résultats vérifiés" hint="Uniquement des résultats constatés et vérifiables." items={f.results} addLabel="Ajouter un résultat" maxLength={300} onChange={(v) => set('results', v)} />
          <TagInput label="Technologies" hint="Huit au plus sont affichées sur la page ; toutes le sont dans l'article." items={f.technologies} onChange={(v) => set('technologies', v)} error={e.technologies} />
          <LinkList items={f.links} errors={e} prefix="links" onChange={(v) => set('links', v)} />
        </section>

        <section class="panel" aria-labelledby="p-images">
          <h2 id="p-images">Images de l'article</h2>
          {f.gallery.map((g, i) => (
            <div class="gallery-item" key={`${g.src}-${i}`}>
              <ImageField
                label={`Image ${i + 1}`}
                value={g}
                withCaption
                errors={e}
                prefix={`gallery.${i}`}
                onChange={(img) => set('gallery', img ? f.gallery.map((x, j) => (j === i ? img : x)) : f.gallery.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <ImageField label={f.gallery.length ? 'Ajouter une image' : 'Première image'} value={undefined} onChange={(img) => img && set('gallery', [...f.gallery, img])} />
        </section>
      </details>
    </EditorShell>
  );
}

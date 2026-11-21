import { COVER_COLORS } from '../../lib/schemas';
import { MOTIF_LABELS, MOTIFS } from '../../lib/threads';
import { TINTS } from '../../lib/tints';
import type { Entry } from '../api';
import { FormActions, ImageField, LinkList, Select, StringList, TagInput, TextArea, TextInput, Thumb, Toggle } from '../ui';
import { CollectionList, useEntryEditor } from './collection';
import { EditorShell, NotFound, SlugField } from './shared';

export function ProjectList() {
  return (
    <CollectionList
      type="project"
      title="Projets"
      lead="L'ordre ci-dessous est celui des projets sur le site (et de leurs fils). L'étoile marque un projet comme mis en avant ; la présentation actuelle donne la même place à chaque projet."
      base="projets"
      newLabel="Nouveau projet"
      reorderable
      featured
      describe={(e: Entry) => {
        const d = e.data as { title: string; kind?: string; category: string; period?: { start: string; end?: string }; cover?: { color: string; image?: { src: string } } };
        return {
          title: d.title,
          meta: [d.category === 'pro' ? 'Professionnel' : 'Personnel', d.kind, d.period?.start].filter(Boolean).join(' · '),
          thumb: d.cover?.image ? (
            <Thumb src={d.cover.image.src} size="sm" />
          ) : (
            <span class="swatch" style={{ background: TINTS[(d.cover?.color ?? 'sapin') as keyof typeof TINTS].dark }} aria-hidden="true" />
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
  cover: { color: (typeof COVER_COLORS)[number]; image?: { src: string; alt: string; caption?: string }; motif?: (typeof MOTIFS)[number] };
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
  visible: false,
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
        <TextInput label="Titre" required value={f.title} maxLength={120} error={e.title} onInput={(v) => set('title', v)} />
        <SlugField prefix="/#projet-" value={ed.slug} onInput={ed.setSlug} error={e.slug} isNew={ed.isNew} />
        <TextArea label="Résumé" required hint="Deux phrases : ce que c'est et pour qui. Affiché en chapeau de l'article du projet." value={f.summary} maxLength={320} rows={3} error={e.summary} onInput={(v) => set('summary', v)} />
        <div class="grid-2">
          <TextInput label="Nature du projet" hint="Ex. : Application web · Tableau de bord" value={f.kind} maxLength={80} onInput={(v) => set('kind', opt(v))} />
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
        <div class="toggles">
          <Toggle label="Visible sur le site" hint="Masqué : visible seulement dans l'aperçu." checked={f.visible} onChange={(v) => set('visible', v)} />
          <Toggle label="Mis en avant" hint="Conservé dans le contenu ; sans effet sur la présentation actuelle." checked={f.featured} onChange={(v) => set('featured', v)} />
        </div>
      </section>

      <section class="panel" aria-labelledby="p-couverture">
        <h2 id="p-couverture">Présentation</h2>
        <p class="hint">Sur le site, chaque projet est un fil teint de sa couleur, qui dessine un motif : un signe abstrait de son domaine (jamais une image de l'application). Une capture réelle, si vous en ajoutez une, est montrée en grand devant le motif et dans l'article.</p>
        <Select
          label="Motif du fil"
          hint="« Automatique » garde le motif par défaut du projet."
          value={f.cover.motif ?? ''}
          options={[{ value: '', label: 'Automatique' }, ...MOTIFS.map((m) => ({ value: m, label: MOTIF_LABELS[m] }))]}
          onChange={(v) => set('cover', { ...f.cover, motif: (v || undefined) as ProjectForm['cover']['motif'] })}
        />
        <fieldset class="swatches">
          <legend>Teinte du fil</legend>
          {COVER_COLORS.map((c) => (
            <label class="swatch-option">
              <input type="radio" name="cover-color" value={c} checked={f.cover.color === c} onChange={() => set('cover', { ...f.cover, color: c })} />
              <span class="swatch" style={{ background: TINTS[c].dark }} aria-hidden="true" />
              {TINTS[c].label}
            </label>
          ))}
        </fieldset>
        <ImageField label="Capture réelle (facultative)" value={f.cover.image} errors={e} prefix="cover.image" onChange={(img) => set('cover', { ...f.cover, image: img })} />
      </section>

      <section class="panel" aria-labelledby="p-detail">
        <h2 id="p-detail">Article</h2>
        <p class="hint">Tous ces champs sont facultatifs : une section vide n'apparaît pas. Laissez une ligne vide entre deux paragraphes.</p>
        <TextArea label="Contexte" value={f.context} maxLength={4000} rows={5} onInput={(v) => set('context', opt(v))} />
        <TextArea label="Problème" value={f.problem} maxLength={4000} rows={4} onInput={(v) => set('problem', opt(v))} />
        <TextArea label="Mon rôle" value={f.role} maxLength={1500} rows={3} onInput={(v) => set('role', opt(v))} />
        <TextArea label="Approche" value={f.approach} maxLength={4000} rows={5} onInput={(v) => set('approach', opt(v))} />
        <StringList label={f.category === 'pro' ? 'Contributions' : 'Fonctionnalités'} items={f.contributions} addLabel="Ajouter une ligne" maxLength={300} onChange={(v) => set('contributions', v)} error={e.contributions} />
        <StringList label="Résultats vérifiés" hint="Uniquement des résultats constatés et vérifiables." items={f.results} addLabel="Ajouter un résultat" maxLength={300} onChange={(v) => set('results', v)} />
        <TagInput label="Technologies" items={f.technologies} onChange={(v) => set('technologies', v)} error={e.technologies} />
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

    </EditorShell>
  );
}

import type { Entry } from '../api';
import { FormActions, StringList, TagInput, TextArea, TextInput, Toggle } from '../ui';
import { CollectionList, useEntryEditor } from './collection';
import { EditorShell, NotFound } from './shared';

export function ExperienceList() {
  return (
    <CollectionList
      type="experience"
      title="Expériences"
      lead="Votre parcours, dans l'ordre d'affichage. Les postes actuels puis ceux mis en avant (★) sont racontés en entier (3 par défaut, réglable dans Site → Projets et parcours) ; les autres sont dans la liste « Tout le parcours »."
      base="experiences"
      newLabel="Nouvelle expérience"
      reorderable
      featured
      describe={(e: Entry) => {
        const d = e.data as { role: string; organisation: string; start: string; end?: string };
        return { title: d.role, meta: `${d.organisation} · ${d.start} — ${d.end ?? "aujourd'hui"}` };
      }}
    />
  );
}

type ExperienceForm = {
  role: string;
  organisation: string;
  parentOrganisation?: string;
  url?: string;
  location?: string;
  start: string;
  end?: string;
  summary?: string;
  responsibilities: string[];
  skills: string[];
  featured: boolean;
  visible: boolean;
  order: number;
  [k: string]: unknown;
};

const blank = (): ExperienceForm => ({ role: '', organisation: '', start: '', responsibilities: [], skills: [], featured: false, visible: true, order: 999 });
const opt = (v: string) => (v.trim() ? v : undefined);

export function ExperienceEditor({ id }: { id: string }) {
  const ed = useEntryEditor<ExperienceForm>('experience', id, blank, 'organisation');
  if (ed.missing) return <NotFound back="experiences" />;
  const { form: f, set, errors: e } = ed;
  const current = !f.end;
  return (
    <EditorShell
      back={{ href: '#/experiences', label: 'Expériences' }}
      title={ed.isNew ? 'Nouvelle expérience' : f.role || 'Sans titre'}
      publicPath={ed.isNew ? undefined : '/#parcours'}
      actions={<FormActions dirty={ed.dirty} saving={ed.saving} onSave={ed.submit} onCancel={ed.isNew ? undefined : ed.reset} />}
      errorCount={Object.keys(e).length}
    >
      <section class="panel" aria-labelledby="x-poste">
        <h2 id="x-poste">L'essentiel</h2>
        <TextInput label="Intitulé du poste" required value={f.role} maxLength={160} recommended={60} error={e.role} onInput={(v) => set('role', v)} />
        <TextInput label="Organisation" required value={f.organisation} maxLength={160} recommended={50} error={e.organisation} onInput={(v) => set('organisation', v)} />
        <div class="grid-2">
          <TextInput label="Début" required hint="AAAA ou AAAA-MM" value={f.start} error={e.start} onInput={(v) => set('start', v)} placeholder="2024" />
          {f.end !== undefined || !current ? (
            <TextInput label="Fin" hint="AAAA ou AAAA-MM" value={f.end} error={e.end} onInput={(v) => set('end', opt(v))} />
          ) : (
            <p class="hint">Poste actuel : affiché « aujourd'hui ».</p>
          )}
        </div>
        <Toggle label="Poste actuel" hint="Sans date de fin. Le premier poste actuel est repris en haut de la page et dans À propos." checked={current} onChange={(v) => set('end', v ? undefined : f.start || '')} />
        <TextArea label="Description courte" hint="Une ou deux phrases." value={f.summary} maxLength={1500} recommended={220} rows={3} onInput={(v) => set('summary', opt(v))} />
        <div class="toggles">
          <Toggle label="Visible sur le site" checked={f.visible} onChange={(v) => set('visible', v)} />
          <Toggle label="Mis en avant" hint="Raconté en entier dans le parcours, avec les postes actuels." checked={f.featured} onChange={(v) => set('featured', v)} />
        </div>
      </section>
      <details class="advanced" open={Object.keys(e).some((k) => !['role', 'organisation', 'start', 'end'].includes(k)) || undefined}>
        <summary>Paramètres avancés</summary>
        <section class="panel" aria-labelledby="x-more">
          <h2 id="x-more">Détails</h2>
          <div class="grid-2">
            <TextInput label="Organisation de rattachement" hint="Ex. : Ministère de l'Intérieur" value={f.parentOrganisation} maxLength={160} onInput={(v) => set('parentOrganisation', opt(v))} />
            <TextInput label="Lieu" value={f.location} maxLength={120} onInput={(v) => set('location', opt(v))} />
          </div>
          <TextInput label="Site de l'organisation" type="url" value={f.url} error={e.url} onInput={(v) => set('url', opt(v))} placeholder="https://" />
          <StringList label="Responsabilités" items={f.responsibilities} addLabel="Ajouter une responsabilité" maxLength={300} onChange={(v) => set('responsibilities', v)} />
          <TagInput label="Compétences et technologies" items={f.skills} onChange={(v) => set('skills', v)} />
          <TextInput label="Identifiant interne" hint="Nom du fichier. Il n'apparaît pas sur le site." value={ed.slug} error={e.slug} maxLength={80} onInput={ed.setSlug} />
        </section>
      </details>
    </EditorShell>
  );
}

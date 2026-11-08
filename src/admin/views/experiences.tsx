import type { Entry } from '../api';
import { FormActions, StringList, TagInput, TextArea, TextInput, Toggle } from '../ui';
import { CollectionList, useEntryEditor } from './collection';
import { EditorShell, NotFound } from './shared';

export function ExperienceList() {
  return (
    <CollectionList
      type="experience"
      title="Expériences"
      lead="Votre parcours, dans l'ordre d'affichage. Un poste sans date de fin est affiché « En poste »."
      base="experiences"
      newLabel="Nouvelle expérience"
      reorderable
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
  visible: boolean;
  order: number;
  [k: string]: unknown;
};

const blank = (): ExperienceForm => ({ role: '', organisation: '', start: '', responsibilities: [], skills: [], visible: true, order: 999 });
const opt = (v: string) => (v.trim() ? v : undefined);

export function ExperienceEditor({ id }: { id: string }) {
  const ed = useEntryEditor<ExperienceForm>('experience', id, blank, 'organisation');
  if (ed.missing) return <NotFound back="experiences" />;
  const { form: f, set, errors: e } = ed;
  return (
    <EditorShell
      back={{ href: '#/experiences', label: 'Expériences' }}
      title={ed.isNew ? 'Nouvelle expérience' : f.role || 'Sans titre'}
      publicPath={ed.isNew ? undefined : '/parcours/'}
      actions={<FormActions dirty={ed.dirty} saving={ed.saving} onSave={ed.submit} onCancel={ed.isNew ? undefined : ed.reset} />}
      errorCount={Object.keys(e).length}
    >
      <section class="panel" aria-labelledby="x-poste">
        <h2 id="x-poste">Poste</h2>
        <TextInput label="Intitulé du poste" required value={f.role} maxLength={160} error={e.role} onInput={(v) => set('role', v)} />
        <div class="grid-2">
          <TextInput label="Organisation" required value={f.organisation} maxLength={160} error={e.organisation} onInput={(v) => set('organisation', v)} />
          <TextInput label="Organisation de rattachement" hint="Ex. : Ministère de l'Intérieur" value={f.parentOrganisation} maxLength={160} onInput={(v) => set('parentOrganisation', opt(v))} />
        </div>
        <div class="grid-3">
          <TextInput label="Début" required hint="AAAA ou AAAA-MM" value={f.start} error={e.start} onInput={(v) => set('start', v)} placeholder="2024" />
          <TextInput label="Fin" hint="Vide = poste actuel" value={f.end} error={e.end} onInput={(v) => set('end', opt(v))} />
          <TextInput label="Lieu" value={f.location} maxLength={120} onInput={(v) => set('location', opt(v))} />
        </div>
        <TextInput label="Site de l'organisation" type="url" value={f.url} error={e.url} onInput={(v) => set('url', opt(v))} placeholder="https://" />
        <div class="toggles">
          <Toggle label="Visible sur le site" checked={f.visible} onChange={(v) => set('visible', v)} />
        </div>
        <TextInput label="Identifiant interne" hint="Nom du fichier. Il n'apparaît pas sur le site." value={ed.slug} error={e.slug} maxLength={80} onInput={ed.setSlug} />
      </section>
      <section class="panel" aria-labelledby="x-desc">
        <h2 id="x-desc">Description</h2>
        <TextArea label="Résumé" value={f.summary} maxLength={1500} rows={3} onInput={(v) => set('summary', opt(v))} />
        <StringList label="Responsabilités" items={f.responsibilities} addLabel="Ajouter une responsabilité" maxLength={300} onChange={(v) => set('responsibilities', v)} />
        <TagInput label="Compétences et technologies" items={f.skills} onChange={(v) => set('skills', v)} />
      </section>
    </EditorShell>
  );
}

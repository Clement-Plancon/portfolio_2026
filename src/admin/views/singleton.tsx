// Editors for single files: profile, skills, SEO settings.
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { z } from 'zod';
import { CONTENT_TYPES } from '../../lib/content-types';
import { SEO_PAGES } from '../../lib/schemas';
import { useStore, useUnsavedGuard } from '../store';
import { type Errors, FormActions, IconButton, ImageField, issuesToErrors, LinkList, TagInput, TextArea, TextInput } from '../ui';
import { EditorShell, SeoFields } from './shared';

function useSingleton<T>(type: 'profile' | 'skills' | 'seo', label: string) {
  const { data, save } = useStore();
  const entry = data?.singletons[type];
  const original = useMemo(() => structuredClone(entry?.data ?? {}) as T, [entry?.sha]);
  const [form, setForm] = useState<T>(original);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(original), [original]);
  const dirty = JSON.stringify(form) !== JSON.stringify(original);
  useUnsavedGuard(dirty);
  const submit = async () => {
    const r = (CONTENT_TYPES[type].schema as z.ZodType).safeParse(form);
    if (!r.success) {
      setErrors(issuesToErrors(r.error.issues));
      return;
    }
    setErrors({});
    setSaving(true);
    const err = await save(`Modification : ${label}`, [{ op: 'put', type, data: form, baseSha: entry?.sha ?? null }]);
    setSaving(false);
    if (err?.details.length) setErrors(issuesToErrors(err.details));
  };
  const set = <K extends keyof T>(k: K, v: T[K]) => setForm((f) => ({ ...f, [k]: v }));
  return { form, set, setForm, errors, dirty, saving, submit, reset: () => setForm(original) };
}

type Profile = {
  name: string;
  jobTitle: string;
  headline: string;
  statement?: string;
  intro: string;
  bio: string;
  location: string;
  email: string;
  socials: { label: string; url: string }[];
  cv?: string;
  photo?: { src: string; alt: string };
  principles: { title: string; text: string }[];
};

export function ProfileView() {
  const s = useSingleton<Profile>('profile', 'profil');
  const { data } = useStore();
  const { form: f, set, errors: e } = s;
  const pdfs = (data?.mediaFiles ?? []).filter((m) => m.ref.endsWith('.pdf'));
  if (!f.name && !s.dirty) return null;
  return (
    <EditorShell
      back={{ href: '#/', label: 'Tableau de bord' }}
      title="Profil"
      publicPath="/a-propos/"
      actions={<FormActions dirty={s.dirty} saving={s.saving} onSave={s.submit} onCancel={s.reset} />}
      errorCount={Object.keys(e).length}
    >
      <section class="panel" aria-labelledby="pr-id">
        <h2 id="pr-id">Identité</h2>
        <div class="grid-2">
          <TextInput label="Nom" required value={f.name} maxLength={80} error={e.name} onInput={(v) => set('name', v)} />
          <TextInput label="Titre professionnel" required value={f.jobTitle} maxLength={120} error={e.jobTitle} onInput={(v) => set('jobTitle', v)} />
        </div>
        <TextInput label="Phrase d'ouverture (page d'accueil)" hint="Une phrase courte en très grand. Entourez un mot d'astérisques pour le mettre en valeur : Je rends *lisible*…" value={f.statement} maxLength={90} error={e.statement} onInput={(v) => set('statement', v.trim() ? v : undefined)} />
        <TextArea label="Accroche" required value={f.headline} maxLength={200} rows={2} error={e.headline} onInput={(v) => set('headline', v)} />
        <TextArea label="Introduction" required hint="Deux phrases sous l'accroche." value={f.intro} maxLength={600} rows={3} error={e.intro} onInput={(v) => set('intro', v)} />
        <TextArea label="Biographie (page À propos)" required hint="Une ligne vide entre deux paragraphes. Le dernier paragraphe est mis en exergue." value={f.bio} maxLength={6000} rows={10} error={e.bio} onInput={(v) => set('bio', v)} />
        <ImageField label="Photo (facultatif)" value={f.photo} errors={e} prefix="photo" onChange={(v) => set('photo', v)} />
      </section>
      <section class="panel" aria-labelledby="pr-contact">
        <h2 id="pr-contact">Coordonnées publiques</h2>
        <div class="grid-2">
          <TextInput label="E-mail de contact" required type="email" value={f.email} error={e.email} onInput={(v) => set('email', v)} />
          <TextInput label="Localisation publique" required value={f.location} maxLength={120} error={e.location} onInput={(v) => set('location', v)} />
        </div>
        <LinkList items={f.socials} errors={e} prefix="socials" onChange={(v) => set('socials', v)} />
        <div class="field">
          <label for="cv">CV</label>
          <p class="hint">Envoyez d'abord le PDF dans la médiathèque, puis choisissez-le ici.</p>
          <select id="cv" value={f.cv ?? ''} onChange={(ev) => set('cv', ev.currentTarget.value || undefined)}>
            <option value="">Pas de CV en ligne</option>
            {pdfs.map((p) => (
              <option value={p.ref}>{p.ref.replace('files/', '')}</option>
            ))}
          </select>
        </div>
      </section>
      <section class="panel" aria-labelledby="pr-principes">
        <h2 id="pr-principes">Façon de travailler</h2>
        {f.principles.map((p, i) => (
          <div class="principle-edit" key={i}>
            <TextInput label={`Principe ${i + 1}`} value={p.title} maxLength={120} error={e[`principles.${i}.title`]} onInput={(v) => set('principles', f.principles.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
            <TextArea label="Explication" value={p.text} maxLength={600} rows={2} error={e[`principles.${i}.text`]} onInput={(v) => set('principles', f.principles.map((x, j) => (j === i ? { ...x, text: v } : x)))} />
            <IconButton label="Retirer ce principe" icon="trash" danger onClick={() => set('principles', f.principles.filter((_, j) => j !== i))} />
          </div>
        ))}
        {f.principles.length < 8 && (
          <button type="button" class="btn btn--small btn--ghost" onClick={() => set('principles', [...f.principles, { title: '', text: '' }])}>
            + Ajouter un principe
          </button>
        )}
      </section>
    </EditorShell>
  );
}

type Skills = { groups: { name: string; description?: string; items: string[] }[] };

export function SkillsView() {
  const s = useSingleton<Skills>('skills', 'compétences');
  const { form: f, setForm, errors: e } = s;
  const groups = f.groups ?? [];
  const setGroup = (i: number, g: Skills['groups'][number]) => setForm({ groups: groups.map((x, j) => (j === i ? g : x)) });
  const move = (i: number, d: number) => {
    const n = [...groups];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    setForm({ groups: n });
  };
  return (
    <EditorShell
      back={{ href: '#/', label: 'Tableau de bord' }}
      title="Compétences"
      publicPath="/parcours/#competences"
      actions={<FormActions dirty={s.dirty} saving={s.saving} onSave={s.submit} onCancel={s.reset} />}
      errorCount={Object.keys(e).length}
    >
      {groups.map((g, i) => (
        <section class="panel" key={i} aria-label={g.name || `Groupe ${i + 1}`}>
          <div class="panel__head">
            <h2>{g.name || `Groupe ${i + 1}`}</h2>
            <div class="row-actions">
              <IconButton label="Monter" icon="up" disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton label="Descendre" icon="down" disabled={i === groups.length - 1} onClick={() => move(i, 1)} />
              <IconButton label="Supprimer le groupe" icon="trash" danger onClick={() => setForm({ groups: groups.filter((_, j) => j !== i) })} />
            </div>
          </div>
          <TextInput label="Nom du groupe" value={g.name} maxLength={80} error={e[`groups.${i}.name`]} onInput={(v) => setGroup(i, { ...g, name: v })} />
          <TextInput label="Description courte" value={g.description} maxLength={300} onInput={(v) => setGroup(i, { ...g, description: v || undefined })} />
          <TagInput label="Éléments" items={g.items} onChange={(v) => setGroup(i, { ...g, items: v })} />
        </section>
      ))}
      <button type="button" class="btn btn--ghost" onClick={() => setForm({ groups: [...groups, { name: '', items: [] }] })}>
        + Ajouter un groupe
      </button>
    </EditorShell>
  );
}

type SeoSettings = {
  siteName: string;
  defaultDescription: string;
  defaultOgImage?: string;
  pages: Record<(typeof SEO_PAGES)[number], { title?: string; description?: string; ogImage?: string; noindex?: boolean }>;
};

const PAGE_LABELS: Record<(typeof SEO_PAGES)[number], { label: string; path: string }> = {
  home: { label: 'Accueil', path: '/' },
  projects: { label: 'Projets', path: '/projets/' },
  experience: { label: 'Parcours', path: '/parcours/' },
  about: { label: 'À propos', path: '/a-propos/' },
  articles: { label: 'Articles', path: '/articles/' },
  contact: { label: 'Contact', path: '/contact/' },
};

export function SeoView() {
  const s = useSingleton<SeoSettings>('seo', 'référencement');
  const { form: f, set, errors: e } = s;
  if (!f.pages) return null;
  return (
    <EditorShell
      back={{ href: '#/', label: 'Tableau de bord' }}
      title="Référencement"
      actions={<FormActions dirty={s.dirty} saving={s.saving} onSave={s.submit} onCancel={s.reset} />}
      errorCount={Object.keys(e).length}
    >
      <section class="panel" aria-labelledby="seo-defaults">
        <h2 id="seo-defaults">Valeurs par défaut</h2>
        <TextInput label="Nom du site" required value={f.siteName} maxLength={80} error={e.siteName} onInput={(v) => set('siteName', v)} />
        <TextArea label="Description par défaut" required value={f.defaultDescription} maxLength={170} rows={2} error={e.defaultDescription} onInput={(v) => set('defaultDescription', v)} />
        <ImageField label="Image de partage par défaut" value={f.defaultOgImage ? { src: f.defaultOgImage, alt: '' } : undefined} onChange={(v) => set('defaultOgImage', v?.src)} />
        <p class="hint">Sans image, le site utilise une image de partage générique aux couleurs du site.</p>
      </section>
      {SEO_PAGES.map((p) => (
        <SeoFields
          key={p}
          prefix={`pages.${p}`}
          heading={`Page « ${PAGE_LABELS[p].label} »`}
          value={f.pages[p] ?? {}}
          errors={e}
          onChange={(v) => set('pages', { ...f.pages, [p]: v })}
          fallbackTitle={`${PAGE_LABELS[p].label} — ${f.siteName}`}
          fallbackDescription={f.defaultDescription}
          path={PAGE_LABELS[p].path}
        />
      ))}
    </EditorShell>
  );
}

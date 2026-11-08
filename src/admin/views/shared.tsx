import type { ComponentChildren } from 'preact';
import { useStore } from '../store';
import { type Errors, Icon, ImageField, TextArea, TextInput, Toggle } from '../ui';

export function EditorShell(p: {
  back: { href: string; label: string };
  title: string;
  publicPath?: string;
  actions: ComponentChildren;
  errorCount?: number;
  children: ComponentChildren;
}) {
  const { status } = useStore();
  const preview = status?.previewUrl;
  return (
    <section class="view view--editor">
      <a class="back" href={p.back.href}>
        ← {p.back.label}
      </a>
      <header class="view__head">
        <h1>{p.title}</h1>
        {p.publicPath && (
          <div class="view__links">
            {preview && (
              <a class="btn btn--small btn--ghost" href={`${preview.replace(/\/$/, '')}${p.publicPath}`} target="_blank" rel="noopener">
                Aperçu <Icon name="ext" size={14} />
              </a>
            )}
            <a class="btn btn--small btn--ghost" href={p.publicPath} target="_blank" rel="noopener">
              En ligne <Icon name="ext" size={14} />
            </a>
          </div>
        )}
      </header>
      {!!p.errorCount && (
        <p class="form-alert" role="alert">
          {p.errorCount} champ{p.errorCount > 1 ? 's' : ''} à corriger avant d'enregistrer.
        </p>
      )}
      <div class="editor">{p.children}</div>
      <div class="sticky-actions">{p.actions}</div>
    </section>
  );
}

export function NotFound({ back }: { back: string }) {
  return (
    <section class="view">
      <h1>Contenu introuvable</h1>
      <p>Il a peut-être été renommé ou supprimé.</p>
      <a class="btn" href={`#/${back}`}>
        Retour à la liste
      </a>
    </section>
  );
}

export function SlugField(p: { prefix: string; value: string; onInput: (v: string) => void; error?: string; isNew: boolean }) {
  return (
    <TextInput
      label="Adresse de la page"
      prefix={p.prefix}
      hint={p.isNew ? 'Générée depuis le titre. Modifiable.' : "Changer l'adresse casse les liens existants vers cette page."}
      value={p.value}
      error={p.error}
      maxLength={80}
      onInput={p.onInput}
    />
  );
}

type Seo = { title?: string; description?: string; ogImage?: string; noindex?: boolean };

export function SeoFields(p: { value: Seo; onChange: (v: Seo) => void; errors: Errors; fallbackTitle: string; fallbackDescription: string; path: string; prefix?: string; heading?: string }) {
  const v = p.value ?? {};
  const pre = p.prefix ?? 'seo';
  const title = v.title || p.fallbackTitle;
  const desc = v.description || p.fallbackDescription;
  const set = (k: keyof Seo, val: unknown) => p.onChange({ ...v, [k]: val === '' ? undefined : val });
  return (
    <section class="panel" aria-labelledby={`${pre.replace(".", "-")}-title`}>
      <h2 id={`${pre.replace(".", "-")}-title`}>{p.heading ?? 'Référencement'}</h2>
      <p class="hint">Facultatif : sans valeur, le titre et le résumé sont utilisés.</p>
      <section class="serp" aria-label="Aperçu dans un moteur de recherche">
        <span class="serp__url">clementplancon.fr{p.path}</span>
        <span class="serp__title">{title.length > 62 ? `${title.slice(0, 60)}…` : title}</span>
        <span class="serp__desc">{desc.length > 160 ? `${desc.slice(0, 158)}…` : desc}</span>
      </section>
      <TextInput label="Titre SEO" hint="50 à 60 caractères idéalement." value={v.title} maxLength={70} error={p.errors[`${pre}.title`]} onInput={(x) => set('title', x)} />
      <TextArea label="Meta description" hint="120 à 160 caractères." value={v.description} maxLength={170} rows={2} error={p.errors[`${pre}.description`]} onInput={(x) => set('description', x)} />
      <ImageField
        label="Image de partage (Open Graph)"
        value={v.ogImage ? { src: v.ogImage, alt: '' } : undefined}
        onChange={(img) => set('ogImage', img?.src)}
      />
      <Toggle label="Ne pas indexer cette page" hint="Demande aux moteurs de ne pas l'afficher dans leurs résultats." checked={!!v.noindex} onChange={(x) => set('noindex', x || undefined)} />
    </section>
  );
}

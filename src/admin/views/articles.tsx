import { useRef, useState } from 'preact/hooks';
import { readingTime, renderMarkdown } from '../../lib/markdown';
import type { Entry } from '../api';
import { FormActions, ImageField, Select, TagInput, TextArea, TextInput } from '../ui';
import { CollectionList, useEntryEditor } from './collection';
import { EditorShell, NotFound, SeoFields, SlugField } from './shared';

const byDate = (a: Entry, b: Entry) => String(b.data.publishedAt ?? '9999').localeCompare(String(a.data.publishedAt ?? '9999'));

export function ArticleList() {
  return (
    <CollectionList
      type="article"
      title="Articles"
      lead="La rubrique Articles n'apparaît sur le site que lorsqu'au moins un article est publié."
      base="articles"
      newLabel="Nouvel article"
      sort={byDate}
      describe={(e: Entry) => {
        const d = e.data as { title: string; publishedAt?: string; body?: string };
        return { title: d.title, meta: [d.publishedAt ?? 'Non daté', `${readingTime(d.body ?? '')} min de lecture`].join(' · ') };
      }}
    />
  );
}

type ArticleForm = {
  title: string;
  excerpt: string;
  body: string;
  cover?: { src: string; alt: string };
  tags: string[];
  status: 'draft' | 'published';
  publishedAt?: string;
  seo: { title?: string; description?: string; ogImage?: string; noindex?: boolean };
  [k: string]: unknown;
};

const blank = (): ArticleForm => ({ title: '', excerpt: '', body: '', tags: [], status: 'draft', seo: {} });

const TOOLBAR: { label: string; title: string; before: string; after?: string; block?: boolean }[] = [
  { label: 'T2', title: 'Intertitre', before: '## ', block: true },
  { label: 'T3', title: 'Sous-titre', before: '### ', block: true },
  { label: 'G', title: 'Gras', before: '**', after: '**' },
  { label: 'I', title: 'Italique', before: '_', after: '_' },
  { label: 'Lien', title: 'Lien', before: '[', after: '](https://)' },
  { label: '• Liste', title: 'Liste à puces', before: '- ', block: true },
  { label: '“ Citation', title: 'Citation', before: '> ', block: true },
  { label: '</>', title: 'Code', before: '`', after: '`' },
];

function MarkdownEditor({ value, onInput }: { value: string; onInput: (v: string) => void }) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const apply = (t: (typeof TOOLBAR)[number]) => {
    const el = area.current!;
    const { selectionStart: s, selectionEnd: e } = el;
    let next: string;
    let caret: number;
    if (t.block) {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      next = value.slice(0, lineStart) + t.before + value.slice(lineStart);
      caret = e + t.before.length;
    } else {
      const sel = value.slice(s, e);
      next = value.slice(0, s) + t.before + sel + (t.after ?? '') + value.slice(e);
      caret = s + t.before.length + sel.length;
    }
    onInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };
  return (
    <div class="md">
      <div class="md__bar">
        <div class="tabs" role="tablist" aria-label="Mode d'édition">
          <button type="button" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>
            Rédiger
          </button>
          <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
            Aperçu
          </button>
        </div>
        {tab === 'write' && (
          <div class="md__tools" role="toolbar" aria-label="Mise en forme">
            {TOOLBAR.map((t) => (
              <button type="button" title={t.title} aria-label={t.title} onClick={() => apply(t)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div class="md__panes">
        <textarea
          ref={area}
          class={`md__input mono${tab === 'preview' ? ' is-hidden-mobile' : ''}`}
          aria-label="Contenu de l'article (Markdown)"
          value={value}
          rows={22}
          onInput={(e) => onInput(e.currentTarget.value)}
        />
        {/* Same renderer as the public site: raw HTML is escaped, unsafe links are dropped. */}
        <section class={`md__preview prose${tab === 'write' ? ' is-hidden-mobile' : ''}`} aria-label="Aperçu de l'article" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
      </div>
      <p class="hint">Markdown : ## intertitre, **gras**, _italique_, [lien](https://…), - liste. Le HTML brut n'est pas interprété.</p>
    </div>
  );
}

export function ArticleEditor({ id }: { id: string }) {
  const ed = useEntryEditor<ArticleForm>('article', id, blank, 'title');
  if (ed.missing) return <NotFound back="articles" />;
  const { form: f, set, errors: e } = ed;
  return (
    <EditorShell
      back={{ href: '#/articles', label: 'Articles' }}
      title={ed.isNew ? 'Nouvel article' : f.title || 'Sans titre'}
      publicPath={ed.isNew ? undefined : `/articles/${id}/`}
      actions={<FormActions dirty={ed.dirty} saving={ed.saving} onSave={ed.submit} onCancel={ed.isNew ? undefined : ed.reset} />}
      errorCount={Object.keys(e).length}
    >
      <section class="panel" aria-labelledby="a-main">
        <h2 id="a-main">Article</h2>
        <TextInput label="Titre" required value={f.title} maxLength={160} error={e.title} onInput={(v) => set('title', v)} />
        <SlugField prefix="/articles/" value={ed.slug} onInput={ed.setSlug} error={e.slug} isNew={ed.isNew} />
        <TextArea label="Chapeau" required hint="Une ou deux phrases, affichées dans la liste et en tête d'article." value={f.excerpt} maxLength={320} rows={2} error={e.excerpt} onInput={(v) => set('excerpt', v)} />
        <div class="grid-2">
          <Select
            label="Statut"
            value={f.status}
            options={[
              { value: 'draft', label: 'Brouillon (visible seulement dans l’aperçu)' },
              { value: 'published', label: 'Publié' },
            ]}
            onChange={(v) => {
              set('status', v);
              if (v === 'published' && !f.publishedAt) set('publishedAt', new Date().toISOString().slice(0, 10));
            }}
          />
          <TextInput label="Date de publication" type="date" value={f.publishedAt} error={e.publishedAt} onInput={(v) => set('publishedAt', v || undefined)} />
        </div>
        <TagInput label="Sujets" items={f.tags} onChange={(v) => set('tags', v)} />
        <ImageField label="Image d'en-tête" value={f.cover} errors={e} prefix="cover" onChange={(v) => set('cover', v)} />
      </section>
      <section class="panel panel--wide" aria-labelledby="a-body">
        <h2 id="a-body">Contenu</h2>
        <MarkdownEditor value={f.body} onInput={(v) => set('body', v)} />
      </section>
      <SeoFields value={f.seo} onChange={(v) => set('seo', v)} errors={e} fallbackTitle={`${f.title} — Clément Plançon`} fallbackDescription={f.excerpt} path={`/articles/${ed.slug || '…'}/`} />
    </EditorShell>
  );
}

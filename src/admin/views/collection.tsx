import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { z } from 'zod';
import { CONTENT_TYPES } from '../../lib/content-types';
import type { Entry } from '../api';
import { go, useStore, useUnsavedGuard } from '../store';
import { confirmDialog, type Errors, Icon, IconButton, issuesToErrors } from '../ui';

export type CollectionType = 'project' | 'experience' | 'article';

export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

export function uniqueId(base: string, taken: string[]) {
  let id = base || 'sans-titre';
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

const sortByOrder = (a: Entry, b: Entry) =>
  ((a.data.order as number) ?? 0) - ((b.data.order as number) ?? 0) || (a.id ?? '').localeCompare(b.id ?? '');

interface ListProps {
  type: CollectionType;
  title: string;
  lead: string;
  base: string; // route segment, e.g. "projets"
  newLabel: string;
  describe: (e: Entry) => { title: string; meta: string; thumb?: ComponentChildren };
  reorderable?: boolean;
  featured?: boolean;
  sort?: (a: Entry, b: Entry) => number;
}

export function CollectionList(p: ListProps) {
  const { data, save } = useStore();
  const entries = useMemo(() => [...(data?.collections[p.type] ?? [])].sort(p.sort ?? sortByOrder), [data, p.type, p.sort]);
  const [order, setOrder] = useState<string[]>(entries.map((e) => e.id!));
  const [dragging, setDragging] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setOrder(entries.map((e) => e.id!)), [entries]);

  const orderChanged = order.join() !== entries.map((e) => e.id).join();
  useUnsavedGuard(orderChanged);
  const byId = new Map(entries.map((e) => [e.id!, e]));
  const list = order.map((id) => byId.get(id)!).filter(Boolean);

  const move = (i: number, d: number) => {
    const n = [...order];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    setOrder(n);
  };
  const saveOrder = async () => {
    setBusy(true);
    const changes = order
      .map((id, i) => ({ e: byId.get(id)!, order: (i + 1) * 10 }))
      .filter(({ e, order: o }) => e.data.order !== o)
      .map(({ e, order: o }) => ({ op: 'put' as const, type: p.type, id: e.id, data: { ...e.data, order: o }, baseSha: e.sha }));
    await save(`Nouvel ordre : ${p.title.toLowerCase()}`, changes, 'Nouvel ordre enregistré.');
    setBusy(false);
  };

  const patch = async (e: Entry, change: Record<string, unknown>, message: string, success: string) => {
    setBusy(true);
    await save(message, [{ op: 'put', type: p.type, id: e.id, data: { ...e.data, ...change }, baseSha: e.sha }], success);
    setBusy(false);
  };

  const duplicate = async (e: Entry) => {
    const id = uniqueId(`${e.id}-copie`, entries.map((x) => x.id!));
    const title = (e.data.title ?? e.data.role) as string;
    const copy = {
      ...e.data,
      ...('title' in e.data ? { title: `${title} (copie)` } : { role: `${title} (copie)` }),
      ...(p.type === 'article' ? { status: 'draft' } : { visible: false, featured: false }),
      order: Math.max(0, ...entries.map((x) => (x.data.order as number) ?? 0)) + 10,
    };
    setBusy(true);
    const err = await save(`Duplication de ${e.id}`, [{ op: 'put', type: p.type, id, data: copy, baseSha: null }], 'Copie créée (masquée).');
    setBusy(false);
    if (!err) go(`${p.base}/${id}`);
  };

  const remove = async (e: Entry) => {
    const name = (e.data.title ?? e.data.role) as string;
    const ok = await confirmDialog({
      title: `Supprimer « ${name} » ?`,
      body: 'Le contenu disparaîtra du site à la prochaine publication. Il reste récupérable dans l’historique Git du dépôt.',
      confirm: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    await save(`Suppression de ${e.id}`, [{ op: 'delete', type: p.type, id: e.id, baseSha: e.sha }], 'Contenu supprimé.');
    setBusy(false);
  };

  return (
    <section class="view">
      <header class="view__head">
        <div>
          <h1>{p.title}</h1>
          <p class="lead">{p.lead}</p>
        </div>
        <a class="btn" href={`#/${p.base}/nouveau`}>
          + {p.newLabel}
        </a>
      </header>

      {p.reorderable && list.length > 1 && (
        <div class={`order-bar${orderChanged ? ' is-dirty' : ''}`} aria-live="polite">
          <span>{orderChanged ? 'Ordre modifié, pas encore enregistré.' : 'Glissez les lignes ou utilisez les flèches pour changer l’ordre d’affichage.'}</span>
          {orderChanged && (
            <>
              <button type="button" class="btn btn--small btn--ghost" onClick={() => setOrder(entries.map((e) => e.id!))}>
                Annuler
              </button>
              <button type="button" class="btn btn--small" disabled={busy} onClick={saveOrder}>
                Enregistrer l'ordre
              </button>
            </>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div class="empty">
          <p>Rien ici pour l'instant.</p>
          <a class="btn" href={`#/${p.base}/nouveau`}>
            + {p.newLabel}
          </a>
        </div>
      ) : (
        <ol class="rows">
          {list.map((e, i) => {
            const d = p.describe(e);
            const hidden = p.type === 'article' ? e.data.status !== 'published' : e.data.visible === false;
            return (
              <li
                key={e.id}
                class={`row${dragging === e.id ? ' is-dragging' : ''}${hidden ? ' is-hidden' : ''}`}
                draggable={p.reorderable}
                onDragStart={() => setDragging(e.id!)}
                onDragEnd={() => setDragging(null)}
                onDragOver={(ev) => {
                  ev.preventDefault();
                  if (!dragging || dragging === e.id) return;
                  const n = order.filter((x) => x !== dragging);
                  n.splice(n.indexOf(e.id!) + (order.indexOf(dragging) < i ? 1 : 0), 0, dragging);
                  setOrder(n);
                }}
              >
                {p.reorderable && (
                  <span class="row__drag" aria-hidden="true">
                    <Icon name="drag" />
                  </span>
                )}
                {d.thumb && <span class="row__thumb">{d.thumb}</span>}
                <a class="row__main" href={`#/${p.base}/${e.id}`}>
                  <strong>{d.title}</strong>
                  <span>{d.meta}</span>
                  {e.error && <span class="error">{e.error}</span>}
                </a>
                <span class={`badge${hidden ? ' badge--muted' : ' badge--ok'}`}>
                  {p.type === 'article' ? (hidden ? 'Brouillon' : 'Publié') : hidden ? 'Masqué' : 'Visible'}
                </span>
                <div class="row-actions">
                  {p.reorderable && (
                    <>
                      <IconButton label="Monter" icon="up" disabled={i === 0} onClick={() => move(i, -1)} />
                      <IconButton label="Descendre" icon="down" disabled={i === list.length - 1} onClick={() => move(i, 1)} />
                    </>
                  )}
                  {p.featured && (
                    <IconButton
                      label={e.data.featured ? 'Retirer de la page d’accueil' : 'Mettre en avant sur la page d’accueil'}
                      icon="star"
                      pressed={!!e.data.featured}
                      disabled={busy}
                      onClick={() => patch(e, { featured: !e.data.featured }, `Mise en avant de ${e.id}`, e.data.featured ? 'Retiré de la page d’accueil.' : 'Mis en avant sur la page d’accueil.')}
                    />
                  )}
                  {p.type === 'article' ? (
                    <IconButton
                      label={hidden ? 'Publier l’article' : 'Repasser en brouillon'}
                      icon={hidden ? 'eyeOff' : 'eye'}
                      disabled={busy}
                      onClick={() =>
                        patch(
                          e,
                          { status: hidden ? 'published' : 'draft', publishedAt: (e.data.publishedAt as string) ?? new Date().toISOString().slice(0, 10) },
                          `Statut de ${e.id}`,
                          hidden ? 'Article marqué publié (en ligne après publication du site).' : 'Article repassé en brouillon.',
                        )
                      }
                    />
                  ) : (
                    <IconButton
                      label={hidden ? 'Afficher sur le site' : 'Masquer du site'}
                      icon={hidden ? 'eyeOff' : 'eye'}
                      disabled={busy}
                      onClick={() => patch(e, { visible: hidden }, `Visibilité de ${e.id}`, hidden ? 'Contenu affiché.' : 'Contenu masqué.')}
                    />
                  )}
                  <IconButton label="Dupliquer" icon="copy" disabled={busy} onClick={() => duplicate(e)} />
                  <IconButton label="Supprimer" icon="trash" danger disabled={busy} onClick={() => remove(e)} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/**
 * Editor state for one collection entry (or a new one).
 * Handles dirty tracking, client-side validation with the shared schema, slug changes and saving.
 */
export function useEntryEditor<T extends Record<string, unknown>>(type: CollectionType, id: string, blank: () => T, titleKey: string) {
  const { data, save } = useStore();
  const isNew = id === 'nouveau';
  const entry = data?.collections[type].find((e) => e.id === id);
  const original = useMemo(() => (entry ? (structuredClone(entry.data) as T) : blank()), [entry?.sha, isNew]);
  const [form, setForm] = useState<T>(original);
  const [slug, setSlug] = useState(isNew ? '' : id);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(original), [original]);

  const dirty = JSON.stringify(form) !== JSON.stringify(original) || (!isNew && slug !== id);
  useUnsavedGuard(dirty);

  const set = <K extends keyof T>(k: K, v: T[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === titleKey && !slugTouched) setSlug(slugify(String(v)));
  };
  const setSlugManual = (v: string) => {
    setSlugTouched(true);
    setSlug(slugify(v));
  };

  const schema = CONTENT_TYPES[type].schema as z.ZodType;
  const submit = async () => {
    const parsed = schema.safeParse(form);
    const errs = parsed.success ? {} : issuesToErrors(parsed.error.issues);
    const taken = (data?.collections[type] ?? []).map((e) => e.id).filter((x) => x !== id);
    if (!slug) errs.slug = 'Adresse requise';
    else if (taken.includes(slug)) errs.slug = 'Cette adresse est déjà utilisée';
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"], .field--error input, .field--error textarea')?.focus();
      return;
    }
    setSaving(true);
    const label = String(form[titleKey] ?? slug);
    const changes = isNew
      ? [{ op: 'put' as const, type, id: slug, data: form, baseSha: null }]
      : slug !== id
        ? [
            { op: 'delete' as const, type, id, baseSha: entry!.sha },
            { op: 'put' as const, type, id: slug, data: form, baseSha: null },
          ]
        : [{ op: 'put' as const, type, id, data: form, baseSha: entry!.sha }];
    const err = await save(`${isNew ? 'Création' : 'Modification'} de « ${label} »`, changes);
    setSaving(false);
    if (err) {
      if (err.details.length) setErrors(issuesToErrors(err.details));
      return;
    }
    if (slug !== id) {
      go(`${type === 'project' ? 'projets' : type === 'experience' ? 'experiences' : 'articles'}/${slug}`, true);
    }
  };

  return {
    isNew,
    missing: !isNew && !entry,
    form,
    set,
    slug,
    setSlug: setSlugManual,
    errors,
    dirty,
    saving,
    submit,
    reset: () => {
      setForm(original);
      setSlug(isNew ? '' : id);
      setErrors({});
    },
  };
}

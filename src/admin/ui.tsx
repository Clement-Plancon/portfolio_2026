import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { mediaUrl } from './api';
import { useStore } from './store';
// Circular with views/media (which uses these fields); safe because only used at render time.
import { MediaPicker } from './views/media';

/* ---------- Form fields ---------- */

export type Errors = Record<string, string>;

export function Field(props: { label: string; hint?: string; error?: string; children: (id: string, describedBy?: string) => ComponentChildren; required?: boolean }) {
  const id = useId();
  const hintId = props.hint ? `${id}-hint` : undefined;
  const errId = props.error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div class={`field${props.error ? ' field--error' : ''}`}>
      <label for={id}>
        {props.label}
        {props.required && <span class="req" aria-hidden="true"> *</span>}
      </label>
      {props.hint && (
        <p class="hint" id={hintId}>
          {props.hint}
        </p>
      )}
      {props.children(id, describedBy)}
      {props.error && (
        <p class="error" id={errId}>
          {props.error}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; hint?: string; error?: string; required?: boolean };

export function TextInput(p: Common & { value?: string; onInput: (v: string) => void; type?: string; maxLength?: number; placeholder?: string; prefix?: string }) {
  return (
    <Field label={p.label} hint={p.hint} error={p.error} required={p.required}>
      {(id, d) => (
        <div class={p.prefix ? 'with-prefix' : undefined}>
          {p.prefix && <span class="prefix">{p.prefix}</span>}
          <input
            id={id}
            type={(p.type ?? 'text') as 'text'}
            value={p.value ?? ''}
            maxLength={p.maxLength}
            placeholder={p.placeholder}
            aria-describedby={d}
            aria-invalid={p.error ? 'true' : undefined}
            required={p.required}
            onInput={(e) => p.onInput(e.currentTarget.value)}
          />
          {p.maxLength && <Counter value={p.value} max={p.maxLength} />}
        </div>
      )}
    </Field>
  );
}

function Counter({ value, max }: { value?: string; max: number }) {
  const n = value?.length ?? 0;
  return <span class={`counter${n > max * 0.9 ? ' counter--warn' : ''}`}>{`${n} / ${max}`}</span>;
}

export function TextArea(p: Common & { value?: string; onInput: (v: string) => void; rows?: number; maxLength?: number; mono?: boolean }) {
  return (
    <Field label={p.label} hint={p.hint} error={p.error} required={p.required}>
      {(id, d) => (
        <div>
          <textarea
            id={id}
            rows={p.rows ?? 4}
            value={p.value ?? ''}
            maxLength={p.maxLength}
            class={p.mono ? 'mono' : undefined}
            aria-describedby={d}
            aria-invalid={p.error ? 'true' : undefined}
            onInput={(e) => p.onInput(e.currentTarget.value)}
          />
          {p.maxLength && <Counter value={p.value} max={p.maxLength} />}
        </div>
      )}
    </Field>
  );
}

export function Select<T extends string>(p: Common & { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Field label={p.label} hint={p.hint} error={p.error}>
      {(id, d) => (
        <select id={id} value={p.value} aria-describedby={d} onChange={(e) => p.onChange(e.currentTarget.value as T)}>
          {p.options.map((o) => (
            <option value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Toggle(p: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div class="toggle">
      <input id={id} type="checkbox" role="switch" aria-checked={p.checked} checked={p.checked} onChange={(e) => p.onChange(e.currentTarget.checked)} />
      <label for={id}>
        <span class="toggle__track" aria-hidden="true" />
        <span>
          {p.label}
          {p.hint && <small>{p.hint}</small>}
        </span>
      </label>
    </div>
  );
}

/** Editable list of short texts (contributions, responsibilities…). */
export function StringList(p: { label: string; hint?: string; items: string[]; onChange: (v: string[]) => void; addLabel: string; error?: string; maxLength?: number }) {
  const set = (i: number, v: string) => p.onChange(p.items.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: number) => {
    const n = [...p.items];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    p.onChange(n);
  };
  return (
    <fieldset class={`list-field${p.error ? ' field--error' : ''}`}>
      <legend>{p.label}</legend>
      {p.hint && <p class="hint">{p.hint}</p>}
      <ol>
        {p.items.map((it, i) => (
          <li key={i}>
            <input
              value={it}
              aria-label={`${p.label} ${i + 1}`}
              maxLength={p.maxLength}
              onInput={(e) => set(i, e.currentTarget.value)}
            />
            <div class="row-actions">
              <IconButton label="Monter" icon="up" disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton label="Descendre" icon="down" disabled={i === p.items.length - 1} onClick={() => move(i, 1)} />
              <IconButton label="Retirer" icon="x" onClick={() => p.onChange(p.items.filter((_, j) => j !== i))} />
            </div>
          </li>
        ))}
      </ol>
      <button type="button" class="btn btn--small btn--ghost" onClick={() => p.onChange([...p.items, ''])}>
        + {p.addLabel}
      </button>
      {p.error && <p class="error">{p.error}</p>}
    </fieldset>
  );
}

/** Tags typed with Enter or comma (technologies, skills). */
export function TagInput(p: { label: string; hint?: string; items: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState('');
  const id = useId();
  const add = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) p.onChange([...p.items, ...parts.filter((x) => !p.items.includes(x))]);
    setDraft('');
  };
  return (
    <div class={`field${p.error ? ' field--error' : ''}`}>
      <label for={id}>{p.label}</label>
      {p.hint && <p class="hint">{p.hint}</p>}
      <div class="tags">
        {p.items.map((t) => (
          <span class="tag" key={t}>
            {t}
            <button type="button" aria-label={`Retirer ${t}`} onClick={() => p.onChange(p.items.filter((x) => x !== t))}>
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder="Ajouter puis Entrée"
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !draft && p.items.length) {
              p.onChange(p.items.slice(0, -1));
            }
          }}
          onBlur={add}
        />
      </div>
      {p.error && <p class="error">{p.error}</p>}
    </div>
  );
}

export function LinkList(p: { items: { label: string; url: string }[]; onChange: (v: { label: string; url: string }[]) => void; errors: Errors; prefix: string }) {
  const set = (i: number, k: 'label' | 'url', v: string) => p.onChange(p.items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <fieldset class="list-field">
      <legend>Liens</legend>
      <p class="hint">Site en ligne, dépôt de code, article… Adresses en https:// uniquement.</p>
      <ol>
        {p.items.map((l, i) => (
          <li key={i} class="link-row">
            <input value={l.label} placeholder="Libellé" aria-label={`Libellé du lien ${i + 1}`} onInput={(e) => set(i, 'label', e.currentTarget.value)} />
            <input value={l.url} type="url" placeholder="https://" aria-label={`Adresse du lien ${i + 1}`} aria-invalid={p.errors[`${p.prefix}.${i}.url`] ? 'true' : undefined} onInput={(e) => set(i, 'url', e.currentTarget.value)} />
            <IconButton label="Retirer le lien" icon="x" onClick={() => p.onChange(p.items.filter((_, j) => j !== i))} />
            {(p.errors[`${p.prefix}.${i}.url`] || p.errors[`${p.prefix}.${i}.label`]) && (
              <p class="error">{p.errors[`${p.prefix}.${i}.url`] ?? p.errors[`${p.prefix}.${i}.label`]}</p>
            )}
          </li>
        ))}
      </ol>
      <button type="button" class="btn btn--small btn--ghost" onClick={() => p.onChange([...p.items, { label: '', url: '' }])}>
        + Ajouter un lien
      </button>
    </fieldset>
  );
}

/* ---------- Buttons & icons ---------- */

const ICONS: Record<string, string> = {
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  x: 'M6 6l12 12M18 6 6 18',
  copy: 'M8 8h11v11H8zM5 16V5h11',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 5.4-1.6',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  drag: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  ext: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg class="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function IconButton(p: { label: string; icon: string; onClick: () => void; disabled?: boolean; pressed?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      class={`icon-btn${p.danger ? ' icon-btn--danger' : ''}${p.pressed ? ' is-on' : ''}`}
      title={p.label}
      aria-label={p.label}
      aria-pressed={p.pressed}
      disabled={p.disabled}
      onClick={p.onClick}
    >
      <Icon name={p.icon} />
    </button>
  );
}

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div class="spinner" role="status">
      <span class="spinner__dot" aria-hidden="true" />
      {label}
    </div>
  );
}

/* ---------- Confirm dialog (native <dialog>, focus handled by the browser) ---------- */

type ConfirmOpts = { title: string; body?: string; confirm: string; danger?: boolean };
let openConfirm: ((o: ConfirmOpts) => Promise<boolean>) | null = null;
export const confirmDialog = (o: ConfirmOpts) => (openConfirm ? openConfirm(o) : Promise.resolve(window.confirm(o.title)));

export function ConfirmHost() {
  const ref = useRef<HTMLDialogElement>(null);
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  useEffect(() => {
    openConfirm = (o) => {
      setOpts(o);
      ref.current?.showModal();
      return new Promise((r) => {
        resolver.current = r;
      });
    };
    return () => {
      openConfirm = null;
    };
  }, []);
  const close = (v: boolean) => {
    ref.current?.close();
    resolver.current?.(v);
  };
  return (
    <dialog ref={ref} class="dialog" aria-labelledby="confirm-title" onCancel={() => resolver.current?.(false)}>
      {opts && (
        <form method="dialog" onSubmit={(e) => (e.preventDefault(), close(true))}>
          <h2 id="confirm-title">{opts.title}</h2>
          {opts.body && <p>{opts.body}</p>}
          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" onClick={() => close(false)}>
              Annuler
            </button>
            <button type="submit" class={`btn ${opts.danger ? 'btn--danger' : ''}`} autofocus>
              {opts.confirm}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

/* ---------- Toasts ---------- */

export function Toasts() {
  const { toasts, dismiss } = useStore();
  return (
    <div class="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div class={`toast toast--${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'} key={t.id}>
          <span>{t.text}</span>
          <button type="button" aria-label="Fermer" onClick={() => dismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Images ---------- */

export function Thumb({ src, alt = '', size = 'md' }: { src: string; alt?: string; size?: 'sm' | 'md' | 'lg' }) {
  const { data } = useStore();
  const sha = data?.mediaFiles.find((m) => m.ref === src)?.sha;
  return <img class={`thumb thumb--${size}`} src={mediaUrl(src, sha)} alt={alt} loading="lazy" />;
}

/** Image field: preview, pick from the media library, alt text. */
export function ImageField(p: {
  label: string;
  value?: { src: string; alt: string; caption?: string };
  onChange: (v: { src: string; alt: string; caption?: string } | undefined) => void;
  withCaption?: boolean;
  errors?: Errors;
  prefix?: string;
}) {
  const [picking, setPicking] = useState(false);
  const { data } = useStore();
  const altFromLibrary = (src: string) =>
    ((data?.singletons.media?.data.items as { file: string; alt: string }[] | undefined) ?? []).find((m) => m.file === src)?.alt ?? '';
  const altError = p.errors?.[`${p.prefix}.alt`];
  return (
    <fieldset class="image-field">
      <legend>{p.label}</legend>
      {p.value ? (
        <div class="image-field__row">
          <Thumb src={p.value.src} size="lg" alt="" />
          <div class="image-field__meta">
            <code>{p.value.src.replace('media/', '')}</code>
            <TextInput
              label="Texte alternatif"
              hint="Décrivez l'image pour les personnes qui ne la voient pas."
              value={p.value.alt}
              maxLength={300}
              error={altError}
              onInput={(alt) => p.onChange({ ...p.value!, alt })}
            />
            {p.withCaption && (
              <TextInput label="Légende (facultatif)" value={p.value.caption} maxLength={300} onInput={(caption) => p.onChange({ ...p.value!, caption: caption || undefined })} />
            )}
            <div class="btn-row">
              <button type="button" class="btn btn--small btn--ghost" onClick={() => setPicking(true)}>
                Changer
              </button>
              <button type="button" class="btn btn--small btn--ghost" onClick={() => p.onChange(undefined)}>
                Retirer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" class="image-field__empty" onClick={() => setPicking(true)}>
          Choisir une image dans la médiathèque
        </button>
      )}
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(src) => {
            p.onChange({ src, alt: p.value?.alt || altFromLibrary(src), caption: p.value?.caption });
            setPicking(false);
          }}
        />
      )}
    </fieldset>
  );
}

export function useField<T extends object>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const set = <K extends keyof T>(k: K, v: T[K]) => setValue((x) => ({ ...x, [k]: v }));
  return [value, set, setValue] as const;
}

export function issuesToErrors(issues: { path: (string | number | symbol)[] | string; message: string }[]): Errors {
  const out: Errors = {};
  for (const i of issues) {
    const k = Array.isArray(i.path) ? i.path.map(String).join('.') : i.path;
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export function FormActions(p: { dirty: boolean; saving: boolean; onSave: () => void; onCancel?: () => void; extra?: JSX.Element; saveLabel?: string }) {
  return (
    <div class="form-actions">
      <div class="form-actions__status" aria-live="polite">
        {p.saving ? 'Enregistrement…' : p.dirty ? 'Modifications non enregistrées' : 'Tout est enregistré'}
      </div>
      {p.extra}
      {p.onCancel && (
        <button type="button" class="btn btn--ghost" disabled={!p.dirty || p.saving} onClick={p.onCancel}>
          Annuler les changements
        </button>
      )}
      <button type="button" class="btn" disabled={!p.dirty || p.saving} onClick={p.onSave}>
        {p.saving ? 'Enregistrement…' : (p.saveLabel ?? 'Enregistrer')}
      </button>
    </div>
  );
}

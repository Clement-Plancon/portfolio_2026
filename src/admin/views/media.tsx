import { useRef, useState } from 'preact/hooks';
import { ApiError, api } from '../api';
import { useStore } from '../store';
import { confirmDialog, Icon, Spinner, TextInput, Thumb } from '../ui';

const ACCEPT = 'image/webp,image/png,image/jpeg,image/avif,application/pdf';
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 2400;

type MediaItem = { file: string; alt: string; width?: number; height?: number; size?: number; uploadedAt?: string };

/** Resizes large images and converts them to WebP in the browser before upload. */
async function prepare(file: File): Promise<{ blob: Blob; name: string; width?: number; height?: number }> {
  if (file.type === 'application/pdf') return { blob: file, name: file.name };
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type)) {
    throw new Error('Format non accepté. Formats acceptés : WebP, PNG, JPEG, AVIF et PDF.');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.86));
  // Keep the original when re-encoding does not help (already small, or WebP unsupported).
  if (!webp || webp.type !== 'image/webp' || (scale === 1 && webp.size >= file.size)) {
    return { blob: file, name: file.name, width, height };
  }
  return { blob: webp, name: file.name.replace(/\.[^.]+$/, '.webp'), width, height };
}

async function toBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

export function useUpload() {
  const { reload, toast, refreshStatus } = useStore();
  const [busy, setBusy] = useState(false);
  const upload = async (file: File, opts: { alt?: string; replace?: string } = {}) => {
    setBusy(true);
    try {
      // Replacing keeps the file name (so every reference stays valid): the format must stay the same.
      const targetExt = opts.replace?.split('.').pop();
      const p = !opts.replace || targetExt === 'webp' ? await prepare(file) : { blob: file, name: file.name };
      const ext = p.name.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg');
      if (targetExt && ext !== targetExt.replace('jpeg', 'jpg')) {
        throw new Error(`Le fichier de remplacement doit être au format .${targetExt}.`);
      }
      if (p.blob.size > MAX_BYTES) throw new Error('Fichier trop lourd, même optimisé (4 Mo maximum).');
      const res = await api.upload({
        fileName: p.name,
        contentBase64: await toBase64(p.blob),
        alt: opts.alt ?? '',
        width: p.width,
        height: p.height,
        replace: opts.replace,
      });
      toast(opts.replace ? 'Image remplacée.' : 'Média ajouté à la médiathèque.');
      await reload();
      refreshStatus();
      return res.ref;
    } catch (e) {
      toast(e instanceof ApiError || e instanceof Error ? e.message : 'Envoi impossible.', 'error');
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy };
}

function useItems(): MediaItem[] {
  const { data } = useStore();
  const manifest = (data?.singletons.media?.data.items as MediaItem[] | undefined) ?? [];
  const files = data?.mediaFiles ?? [];
  // Files present in the repository but missing from the manifest are still listed.
  return files.map((f) => manifest.find((m) => m.file === f.ref) ?? { file: f.ref, alt: '', size: f.size });
}

function DropZone({ onFiles, busy, compact }: { onFiles: (f: File[]) => void; busy: boolean; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    // biome-ignore lint/a11y/useSemanticElements: drop target wrapping a real button; a fieldset would add a misleading legend
    <div
      role="group"
      aria-label="Zone d'envoi de fichiers"
      class={`dropzone${over ? ' is-over' : ''}${compact ? ' dropzone--compact' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...(e.dataTransfer?.files ?? [])]);
      }}
    >
      {busy ? (
        <Spinner label="Optimisation et envoi…" />
      ) : (
        <>
          <p>
            <strong>Déposez une image ici</strong> ou{' '}
            <button type="button" class="linklike" onClick={() => input.current?.click()}>
              choisissez un fichier
            </button>
          </p>
          <p class="hint">WebP, PNG, JPEG, AVIF ou PDF · 4 Mo max · les images sont redimensionnées (2400 px) et converties en WebP.</p>
        </>
      )}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        multiple
        onChange={(e) => {
          onFiles([...(e.currentTarget.files ?? [])]);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
}

export function MediaView() {
  const items = useItems();
  const { upload, busy } = useUpload();
  const [selected, setSelected] = useState<string | null>(null);
  const current = items.find((i) => i.file === selected);
  return (
    <section class="view">
      <header class="view__head">
        <div>
          <h1>Médiathèque</h1>
          <p class="lead">{items.length} fichier{items.length > 1 ? 's' : ''}. Les images sont optimisées au moment de la publication (formats et tailles adaptés à chaque écran).</p>
        </div>
      </header>
      <DropZone busy={busy} onFiles={async (files) => {
        for (const f of files) await upload(f);
      }} />
      {items.length === 0 ? (
        <p class="empty">Aucun média pour l'instant.</p>
      ) : (
        <ul class="media-grid">
          {items.map((m) => (
            <li key={m.file}>
              <button type="button" class={`media-card${selected === m.file ? ' is-selected' : ''}`} onClick={() => setSelected(m.file)} aria-pressed={selected === m.file}>
                {m.file.endsWith('.pdf') ? <span class="media-card__pdf">PDF</span> : <Thumb src={m.file} alt="" />}
                <span class="media-card__name">{m.file.split('/')[1]}</span>
                {!m.alt && !m.file.endsWith('.pdf') && <span class="media-card__warn">Texte alternatif manquant</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {current && <MediaDetails key={current.file} item={current} onClose={() => setSelected(null)} />}
    </section>
  );
}

function MediaDetails({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const { data, save, reload, toast, refreshStatus } = useStore();
  const [alt, setAlt] = useState(item.alt);
  const [saving, setSaving] = useState(false);
  const { upload, busy } = useUpload();
  const replaceInput = useRef<HTMLInputElement>(null);
  const isPdf = item.file.endsWith('.pdf');
  const publicPath = isPdf ? `/${item.file}` : null;

  const saveAlt = async () => {
    const manifest = data!.singletons.media!;
    const items = (manifest.data.items as MediaItem[]).filter((i) => i.file !== item.file);
    items.push({ ...item, alt });
    items.sort((a, b) => a.file.localeCompare(b.file));
    setSaving(true);
    await save(`Texte alternatif de ${item.file}`, [{ op: 'put', type: 'media', data: { items }, baseSha: manifest.sha }], 'Texte alternatif enregistré.');
    setSaving(false);
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: `Supprimer ${item.file.split('/')[1]} ?`,
      body: "Le fichier sera retiré du brouillon. Il restera en ligne jusqu'à la prochaine publication. Un média encore utilisé ne peut pas être supprimé.",
      confirm: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteMedia(item.file);
      toast('Média supprimé.');
      onClose();
      await reload();
      refreshStatus();
    } catch (e) {
      const err = e as ApiError;
      const where = err.details?.length ? ` (${err.details.map((d) => d.path).join(', ')})` : '';
      toast(`${err.message}${where}`, 'error');
    }
  };

  return (
    <aside class="media-details" aria-label="Détails du média">
      <div class="media-details__head">
        <h2>{item.file.split('/')[1]}</h2>
        <button type="button" class="icon-btn" aria-label="Fermer" onClick={onClose}>
          <Icon name="x" />
        </button>
      </div>
      {!isPdf && <Thumb src={item.file} alt={alt} size="lg" />}
      <dl class="meta-list">
        {item.width && (
          <>
            <dt>Dimensions</dt>
            <dd>
              {item.width} × {item.height} px
            </dd>
          </>
        )}
        {item.size !== undefined && (
          <>
            <dt>Poids</dt>
            <dd>{(item.size / 1024).toFixed(0)} Ko</dd>
          </>
        )}
        <dt>Référence</dt>
        <dd>
          <code>{item.file}</code>
        </dd>
        {publicPath && (
          <>
            <dt>Adresse publique</dt>
            <dd>
              <code>{publicPath}</code>
            </dd>
          </>
        )}
      </dl>
      {!isPdf && (
        <>
          <TextInput label="Texte alternatif par défaut" hint="Proposé quand vous choisissez cette image pour un contenu." value={alt} maxLength={300} onInput={setAlt} />
          <button type="button" class="btn btn--small" disabled={alt === item.alt || saving} onClick={saveAlt}>
            {saving ? 'Enregistrement…' : 'Enregistrer le texte alternatif'}
          </button>
        </>
      )}
      <div class="btn-row">
        <button type="button" class="btn btn--small btn--ghost" disabled={busy} onClick={() => replaceInput.current?.click()}>
          {busy ? 'Envoi…' : 'Remplacer le fichier'}
        </button>
        <button type="button" class="btn btn--small btn--danger-ghost" onClick={remove}>
          Supprimer
        </button>
      </div>
      <input
        ref={replaceInput}
        type="file"
        hidden
        accept={ACCEPT}
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          e.currentTarget.value = '';
          if (f) upload(f, { alt: item.alt, replace: item.file });
        }}
      />
    </aside>
  );
}

/** Modal used by image fields to pick (or upload) an image. */
export function MediaPicker({ onPick, onClose }: { onPick: (ref: string) => void; onClose: () => void }) {
  const items = useItems().filter((i) => !i.file.endsWith('.pdf'));
  const { upload, busy } = useUpload();
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <dialog
      class="dialog dialog--wide"
      ref={(el) => {
        ref.current = el;
        if (el && !el.open) el.showModal();
      }}
      onClose={onClose}
      aria-labelledby="picker-title"
    >
      <div class="dialog__head">
        <h2 id="picker-title">Choisir une image</h2>
        <button type="button" class="icon-btn" aria-label="Fermer" onClick={() => ref.current?.close()}>
          <Icon name="x" />
        </button>
      </div>
      <DropZone
        compact
        busy={busy}
        onFiles={async (files) => {
          const r = files[0] && (await upload(files[0]));
          if (r) onPick(r);
        }}
      />
      <ul class="media-grid media-grid--picker">
        {items.map((m) => (
          <li key={m.file}>
            <button type="button" class="media-card" onClick={() => onPick(m.file)}>
              <Thumb src={m.file} alt="" />
              <span class="media-card__name">{m.file.split('/')[1]}</span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}

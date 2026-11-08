import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { type ContentType, contentPath } from '../lib/content-types';
import { ApiError, api, type ContentPayload, type Entry, type SaveChange, type StatusPayload } from './api';

export type Toast = { id: number; kind: 'success' | 'error' | 'info'; text: string };

interface Store {
  email: string;
  data: ContentPayload | null;
  status: StatusPayload | null;
  loadError: string | null;
  reload: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  /** Commits changes; returns null on success or the API error. Updates local state and shas. */
  save: (message: string, changes: SaveChange[], success?: string) => Promise<ApiError | null>;
  applyFiles: (files: Record<string, string | null>) => void;
  toasts: Toast[];
  toast: (text: string, kind?: Toast['kind']) => void;
  dismiss: (id: number) => void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

const COLLECTION_KEY = { project: 'project', experience: 'experience', article: 'article' } as const;

export function StoreProvider({ email, children }: { email: string; children: ComponentChildren }) {
  const [data, setData] = useState<ContentPayload | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 9000 : 4500);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await api.status());
    } catch {
      /* status is informative only */
    }
  }, []);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      setData(await api.content());
      refreshStatus();
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    }
  }, [refreshStatus]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep deploy states fresh while the tab is open (cheap: one GitHub call per minute).
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && refreshStatus(), 60_000);
    return () => clearInterval(t);
  }, [refreshStatus]);

  const applyFiles = useCallback((files: Record<string, string | null>) => {
    setData((d) => {
      if (!d) return d;
      const fix = (e: Entry) => (e.path in files && files[e.path] ? { ...e, sha: files[e.path]! } : e);
      return {
        ...d,
        ref: { ...d.ref, isDraft: true },
        collections: {
          project: d.collections.project.filter((e) => files[e.path] !== null).map(fix),
          experience: d.collections.experience.filter((e) => files[e.path] !== null).map(fix),
          article: d.collections.article.filter((e) => files[e.path] !== null).map(fix),
        },
        singletons: Object.fromEntries(Object.entries(d.singletons).map(([k, e]) => [k, e && fix(e)])),
      };
    });
  }, []);

  const save = useCallback(
    async (message: string, changes: SaveChange[], success = 'Enregistré. Les modifications sont dans le brouillon.') => {
      try {
        const res = await api.save(message, changes);
        setData((d) => {
          if (!d) return d;
          const next = structuredClone(d);
          next.ref.isDraft = true;
          for (const c of changes) {
            const path = contentPath(c.type as ContentType, c.id);
            const sha = res.files[path];
            if (c.type in COLLECTION_KEY) {
              const list = next.collections[c.type as keyof typeof COLLECTION_KEY];
              const i = list.findIndex((e) => e.path === path);
              if (c.op === 'delete') {
                if (i >= 0) list.splice(i, 1);
              } else {
                const entry: Entry = { type: c.type, id: c.id, path, sha: sha!, data: c.data as Record<string, unknown> };
                if (i >= 0) list[i] = entry;
                else list.push(entry);
              }
            } else if (c.op === 'put') {
              next.singletons[c.type as 'profile'] = { type: c.type, path, sha: sha!, data: c.data as Record<string, unknown> };
            }
          }
          return next;
        });
        toast(success);
        refreshStatus();
        return null;
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError(0, 'unknown', 'Enregistrement impossible.');
        toast(err.message, 'error');
        return err;
      }
    },
    [toast, refreshStatus],
  );

  const value = useMemo(
    () => ({ email, data, status, loadError, reload, refreshStatus, save, applyFiles, toasts, toast, dismiss }),
    [email, data, status, loadError, reload, refreshStatus, save, applyFiles, toasts, toast, dismiss],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* Hash router: #/projets/bercy-vert -> ['projets', 'bercy-vert'] */
export function useRoute(): string[] {
  const get = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [route, setRoute] = useState(get);
  useEffect(() => {
    let current = location.hash;
    const on = () => {
      if (location.hash === current) return;
      if (!bypassGuard && hasUnsavedChanges() && !window.confirm('Des modifications ne sont pas enregistrées. Quitter cette page quand même ?')) {
        history.replaceState(null, '', current || '#/');
        return;
      }
      bypassGuard = false;
      current = location.hash;
      setRoute(get());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
let bypassGuard = false;
/** Navigates inside the admin. force skips the unsaved-changes prompt (used right after a save). */
export const go = (path: string, force = false) => {
  bypassGuard = force;
  location.hash = `#/${path}`;
};

/* Unsaved changes guard (tab close + in-app navigation). */
let dirtyCount = 0;
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    dirtyCount++;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      dirtyCount--;
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty]);
}
export const hasUnsavedChanges = () => dirtyCount > 0;

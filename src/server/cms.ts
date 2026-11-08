// CMS operations on top of Git.
// - Every save is a commit on the draft branch (created from main on first save).
// - The draft branch has its own Netlify branch deploy: that is the preview.
// - Publishing merges the draft branch into main, which triggers the production deploy.
// - Writes use optimistic concurrency: the client sends the blob sha it edited; if the file changed since, 409.
import { CONTENT_ROOT, CONTENT_TYPES, type ContentType, contentPath, isContentType, MEDIA_FILE_DIR, MEDIA_IMAGE_DIR, mediaRepoPath, parseContentPath } from '../lib/content-types';
import { type MediaManifest, mediaManifestSchema } from '../lib/schemas';
import { GitHub, GitHubError, gitBlobSha, type TreeEntry } from './github';
import { HttpError } from './http';

export interface CmsConfig {
  branch: string;
  draftBranch: string;
}

export type FileChange = { path: string; content: Uint8Array | null };

export type SaveChange =
  | { op: 'put'; type: ContentType; id?: string; data: unknown; baseSha: string | null }
  | { op: 'delete'; type: ContentType; id?: string; baseSha: string };

type BuildCtx = {
  files: Map<string, string>; // path -> blob sha at the branch head
  readText: (path: string) => Promise<string>;
};

const enc = new TextEncoder();
const toJson = (data: unknown) => enc.encode(`${JSON.stringify(data, null, 2)}\n`);
const MAX_RETRIES = 2;

export class Cms {
  constructor(
    private gh: GitHub,
    private cfg: CmsConfig,
  ) {}

  /** Branch the admin reads from: the draft when it exists, otherwise main. */
  private async workingRef() {
    const draft = await this.gh.getRefSha(this.cfg.draftBranch);
    if (draft) return { branch: this.cfg.draftBranch, sha: draft, isDraft: true };
    const main = await this.gh.getRefSha(this.cfg.branch);
    if (!main) throw new HttpError(500, 'branch_missing', `La branche ${this.cfg.branch} est introuvable.`);
    return { branch: this.cfg.branch, sha: main, isDraft: false };
  }

  async readAll() {
    const ref = await this.workingRef();
    const commit = await this.gh.getCommit(ref.sha);
    const tree = await this.gh.getTree(commit.treeSha);
    const blobs = tree.filter((e) => e.type === 'blob');

    const contentFiles = blobs.filter((e) => e.path.startsWith(`${CONTENT_ROOT}/`) && parseContentPath(e.path));
    const parsed = await Promise.all(
      contentFiles.map(async (e) => {
        const info = parseContentPath(e.path)!;
        const raw = (await this.gh.getBlob(e.sha)).toString('utf8');
        let data: unknown = null;
        let error: string | undefined;
        try {
          data = JSON.parse(raw);
        } catch {
          error = 'Fichier JSON illisible';
        }
        return { ...info, path: e.path, sha: e.sha, data, error };
      }),
    );

    const collections: Record<string, unknown[]> = { project: [], experience: [], article: [] };
    const singletons: Record<string, unknown> = {};
    for (const item of parsed) {
      if (CONTENT_TYPES[item.type].kind === 'collection') collections[item.type].push(item);
      else singletons[item.type] = item;
    }
    const mediaFiles = blobs
      .filter((e) => e.path.startsWith(`${MEDIA_IMAGE_DIR}/`) || (e.path.startsWith(`${MEDIA_FILE_DIR}/`) && e.path.endsWith('.pdf')))
      .map((e) => ({
        ref: e.path.startsWith(MEDIA_IMAGE_DIR) ? `media/${e.path.slice(MEDIA_IMAGE_DIR.length + 1)}` : `files/${e.path.slice(MEDIA_FILE_DIR.length + 1)}`,
        sha: e.sha,
        size: e.size ?? 0,
      }));

    return {
      ref: { branch: ref.branch, sha: ref.sha, isDraft: ref.isDraft, date: commit.date },
      collections,
      singletons,
      mediaFiles,
    };
  }

  /**
   * Commits a set of file changes on the draft branch.
   * `build` is re-run if the branch moved during the commit, so checks always see the latest state.
   */
  async commit(message: string, author: { name: string; email: string }, build: (ctx: BuildCtx) => Promise<FileChange[]>) {
    for (let attempt = 0; ; attempt++) {
      let head = await this.gh.getRefSha(this.cfg.draftBranch);
      if (!head) {
        const main = await this.gh.getRefSha(this.cfg.branch);
        if (!main) throw new HttpError(500, 'branch_missing', `La branche ${this.cfg.branch} est introuvable.`);
        try {
          await this.gh.createRef(this.cfg.draftBranch, main);
        } catch (e) {
          // Created concurrently by another request: fine.
          if (!(e instanceof GitHubError && e.status === 422)) throw e;
        }
        head = (await this.gh.getRefSha(this.cfg.draftBranch))!;
      }
      const commit = await this.gh.getCommit(head);
      const tree: TreeEntry[] = await this.gh.getTree(commit.treeSha);
      const files = new Map(tree.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha]));
      const readText = async (path: string) => {
        const sha = files.get(path);
        if (!sha) throw new HttpError(404, 'not_found', `Fichier introuvable : ${path}`);
        return (await this.gh.getBlob(sha)).toString('utf8');
      };

      const changes = await build({ files, readText });
      if (changes.length === 0) return { commit: head, files: {} as Record<string, string | null> };

      const entries = await Promise.all(
        changes.map(async (c) => ({ path: c.path, sha: c.content ? await this.gh.createBlob(c.content) : null })),
      );
      const newTree = await this.gh.createTree(commit.treeSha, entries);
      const newCommit = await this.gh.createCommit(message, newTree, head, author);
      try {
        await this.gh.updateRef(this.cfg.draftBranch, newCommit, false);
      } catch (e) {
        // Branch moved (another save landed first): retry from the new head.
        if (e instanceof GitHubError && e.status === 422 && attempt < MAX_RETRIES) continue;
        throw e;
      }
      const result: Record<string, string | null> = {};
      for (const c of changes) result[c.path] = c.content ? gitBlobSha(c.content) : null;
      return { commit: newCommit, files: result };
    }
  }

  /** Saves validated content entries. */
  async save(changes: SaveChange[], message: string, author: { name: string; email: string }) {
    const now = new Date().toISOString();
    const prepared = changes.map((c) => {
      if (!isContentType(c.type)) throw new HttpError(400, 'invalid_type', 'Type de contenu inconnu.');
      let path: string;
      try {
        path = contentPath(c.type, c.id);
      } catch {
        throw new HttpError(400, 'invalid_id', 'Identifiant invalide (lettres minuscules, chiffres et tirets).');
      }
      if (c.op === 'delete') {
        if (CONTENT_TYPES[c.type].kind === 'singleton') throw new HttpError(400, 'forbidden', 'Ce contenu ne peut pas être supprimé.');
        return { path, baseSha: c.baseSha, content: null };
      }
      const schema = CONTENT_TYPES[c.type].schema;
      const input = c.type === 'media' ? c.data : { ...(c.data as object), updatedAt: now };
      const r = schema.safeParse(input);
      if (!r.success) {
        throw new HttpError(422, 'validation', 'Certains champs sont invalides.', r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
      }
      return { path, baseSha: c.baseSha, content: toJson(r.data) };
    });

    const paths = new Set<string>();
    for (const p of prepared) {
      if (paths.has(p.path)) throw new HttpError(400, 'duplicate', 'Le même contenu apparaît deux fois.');
      paths.add(p.path);
    }

    return this.commit(message, author, async ({ files }) => {
      for (const p of prepared) {
        const current = files.get(p.path) ?? null;
        if (p.baseSha !== current) {
          if (p.baseSha === null) throw new HttpError(409, 'exists', 'Un contenu avec cet identifiant existe déjà.');
          throw new HttpError(409, 'conflict', "Ce contenu a été modifié ailleurs depuis son ouverture. Rechargez-le avant d'enregistrer.");
        }
      }
      return prepared.map((p) => ({ path: p.path, content: p.content }));
    });
  }

  private async readManifest(ctx: BuildCtx): Promise<MediaManifest> {
    const path = contentPath('media');
    if (!ctx.files.has(path)) return { items: [] };
    return mediaManifestSchema.parse(JSON.parse(await ctx.readText(path)));
  }

  async uploadMedia(
    file: { ref: string; bytes: Uint8Array; alt: string; width?: number; height?: number; replace: boolean },
    author: { name: string; email: string },
  ) {
    const path = mediaRepoPath(file.ref);
    return this.commit(`CMS : ${file.replace ? 'remplacement' : 'ajout'} du média ${file.ref}`, author, async (ctx) => {
      const exists = ctx.files.has(path);
      if (file.replace && !exists) throw new HttpError(404, 'not_found', 'Le média à remplacer est introuvable.');
      if (!file.replace && exists) throw new HttpError(409, 'exists', 'Un média porte déjà ce nom.');
      const manifest = await this.readManifest(ctx);
      const entry = {
        file: file.ref,
        alt: file.alt,
        size: file.bytes.byteLength,
        uploadedAt: new Date().toISOString(),
        ...(file.width && { width: file.width }),
        ...(file.height && { height: file.height }),
      };
      const items = manifest.items.filter((i) => i.file !== file.ref);
      items.push(entry);
      items.sort((a, b) => a.file.localeCompare(b.file));
      return [
        { path, content: file.bytes },
        { path: contentPath('media'), content: toJson(mediaManifestSchema.parse({ items })) },
      ];
    });
  }

  async deleteMedia(ref: string, author: { name: string; email: string }) {
    const path = mediaRepoPath(ref);
    return this.commit(`CMS : suppression du média ${ref}`, author, async (ctx) => {
      if (!ctx.files.has(path)) throw new HttpError(404, 'not_found', 'Média introuvable.');
      // Refuse to delete a file still referenced by content (it would break the build).
      const usedBy: string[] = [];
      for (const p of ctx.files.keys()) {
        if (!p.startsWith(`${CONTENT_ROOT}/`) || p === contentPath('media') || !p.endsWith('.json')) continue;
        if ((await ctx.readText(p)).includes(`"${ref}"`)) usedBy.push(p.slice(CONTENT_ROOT.length + 1));
      }
      if (usedBy.length) {
        throw new HttpError(409, 'in_use', 'Ce média est encore utilisé. Retirez-le de ces contenus avant de le supprimer.', usedBy.map((u) => ({ path: u, message: 'utilise ce média' })));
      }
      const manifest = await this.readManifest(ctx);
      return [
        { path, content: null },
        { path: contentPath('media'), content: toJson({ items: manifest.items.filter((i) => i.file !== ref) }) },
      ];
    });
  }

  async readMedia(ref: string) {
    const { branch } = await this.workingRef();
    return this.gh.getRaw(mediaRepoPath(ref), branch);
  }

  /** Unpublished changes and deploy states of the preview and production. */
  async status() {
    const [main, draft] = await Promise.all([this.gh.getRefSha(this.cfg.branch), this.gh.getRefSha(this.cfg.draftBranch)]);
    if (!main) throw new HttpError(500, 'branch_missing', `La branche ${this.cfg.branch} est introuvable.`);
    const deploy = async (sha: string) => {
      try {
        const s = await this.gh.combinedStatus(sha);
        // Netlify reports its deploys as commit statuses whose context starts with "netlify/".
        const n = s.statuses.find((x) => x.context.startsWith('netlify/') && x.context.endsWith('/deploy-preview')) ?? s.statuses.find((x) => x.context.startsWith('netlify/'));
        return n ? { state: n.state, url: n.target_url, description: n.description, updatedAt: n.updated_at } : null;
      } catch {
        return null;
      }
    };
    const pending = draft ? await this.gh.compare(main, draft) : null;
    return {
      production: { sha: main, deploy: await deploy(main) },
      draft: draft
        ? {
            sha: draft,
            ahead: pending!.ahead,
            behind: pending!.behind,
            files: pending!.files.map((f) => ({ ...f, ...(parseContentPath(f.path) ?? {}) })),
            commits: pending!.commits.slice(-20).reverse(),
            deploy: await deploy(draft),
          }
        : null,
    };
  }

  async publish(author: { email: string }) {
    const draft = await this.gh.getRefSha(this.cfg.draftBranch);
    if (!draft) throw new HttpError(400, 'nothing', 'Aucune modification à publier.');
    let merged: string | null;
    try {
      merged = await this.gh.merge(this.cfg.branch, this.cfg.draftBranch, `CMS : publication par ${author.email}`);
    } catch (e) {
      if (e instanceof GitHubError && e.status === 409) {
        throw new HttpError(409, 'merge_conflict', 'Les modifications entrent en conflit avec la branche principale. Résolvez le conflit sur GitHub ou abandonnez les modifications non publiées.');
      }
      throw e;
    }
    // Realign the draft on main, unless a save happened during the merge (it will be published next time).
    const mainSha = (await this.gh.getRefSha(this.cfg.branch))!;
    if ((await this.gh.getRefSha(this.cfg.draftBranch)) === draft) {
      await this.gh.updateRef(this.cfg.draftBranch, mainSha, true);
    }
    return { published: merged !== null, sha: mainSha };
  }

  async discard() {
    if (await this.gh.getRefSha(this.cfg.draftBranch)) await this.gh.deleteRef(this.cfg.draftBranch);
    return { discarded: true };
  }
}

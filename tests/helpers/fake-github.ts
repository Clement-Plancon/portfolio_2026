// In-memory stand-in for the GitHub API methods used by the CMS (refs, commits, trees, blobs, merges).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { GitHubError, gitBlobSha } from '../../src/server/github';

type Commit = { tree: string; parents: string[]; message: string; date: string };

export class FakeGitHub {
  blobs = new Map<string, Buffer>();
  trees = new Map<string, Map<string, string>>();
  commits = new Map<string, Commit>();
  refs = new Map<string, string>();
  statuses = new Map<string, { context: string; state: string; target_url: string }[]>();
  private n = 0;
  private id(prefix: string) {
    return `${prefix}${(++this.n).toString(16).padStart(8, '0')}`;
  }

  /** Seeds `main` with the given files. */
  constructor(files: Record<string, string | Buffer>) {
    const tree = new Map<string, string>();
    for (const [path, content] of Object.entries(files)) tree.set(path, this.putBlob(Buffer.from(content)));
    const treeId = this.id('t');
    this.trees.set(treeId, tree);
    const c = this.id('c');
    this.commits.set(c, { tree: treeId, parents: [], message: 'init', date: new Date().toISOString() });
    this.refs.set('main', c);
  }

  /** Loads real repository files (e.g. src/content) so tests run against actual content. */
  static fromDir(root: string, dirs: string[]) {
    const files: Record<string, Buffer> = {};
    const walk = (d: string) => {
      for (const name of readdirSync(d)) {
        const p = join(d, name);
        if (statSync(p).isDirectory()) walk(p);
        else files[relative(root, p).replace(/\\/g, '/')] = readFileSync(p);
      }
    };
    for (const d of dirs) walk(join(root, d));
    return new FakeGitHub(files);
  }

  private putBlob(buf: Buffer) {
    const sha = gitBlobSha(buf);
    this.blobs.set(sha, buf);
    return sha;
  }

  files(branch: string) {
    const c = this.commits.get(this.refs.get(branch)!)!;
    return this.trees.get(c.tree)!;
  }
  read(branch: string, path: string) {
    const sha = this.files(branch).get(path);
    return sha ? this.blobs.get(sha)!.toString('utf8') : undefined;
  }

  async getRefSha(branch: string) {
    return this.refs.get(branch) ?? null;
  }
  async createRef(branch: string, sha: string) {
    if (this.refs.has(branch)) throw new GitHubError(422, 'Reference already exists');
    this.refs.set(branch, sha);
  }
  async updateRef(branch: string, sha: string, force = false) {
    const cur = this.refs.get(branch);
    if (!cur) throw new GitHubError(422, 'Reference does not exist');
    if (!force && !this.isAncestor(cur, sha)) throw new GitHubError(422, 'Update is not a fast forward');
    this.refs.set(branch, sha);
  }
  async deleteRef(branch: string) {
    this.refs.delete(branch);
  }
  async getCommit(sha: string) {
    const c = this.commits.get(sha);
    if (!c) throw new GitHubError(404, 'Not Found');
    return { sha, treeSha: c.tree, date: c.date, message: c.message };
  }
  async getTree(treeSha: string) {
    return [...this.trees.get(treeSha)!].map(([path, sha]) => ({
      path,
      sha,
      type: 'blob' as const,
      size: this.blobs.get(sha)!.length,
    }));
  }
  async getBlob(sha: string) {
    return this.blobs.get(sha)!;
  }
  async createBlob(content: Uint8Array) {
    return this.putBlob(Buffer.from(content));
  }
  async createTree(base: string, entries: { path: string; sha: string | null }[]) {
    const t = new Map(this.trees.get(base)!);
    for (const e of entries) {
      if (e.sha === null) t.delete(e.path);
      else t.set(e.path, e.sha);
    }
    const id = this.id('t');
    this.trees.set(id, t);
    return id;
  }
  async createCommit(message: string, tree: string, parent: string) {
    const id = this.id('c');
    this.commits.set(id, { tree, parents: [parent], message, date: new Date().toISOString() });
    return id;
  }
  private ancestors(sha: string): Set<string> {
    const out = new Set<string>();
    const stack = [sha];
    while (stack.length) {
      const s = stack.pop()!;
      if (out.has(s)) continue;
      out.add(s);
      stack.push(...(this.commits.get(s)?.parents ?? []));
    }
    return out;
  }
  private isAncestor(a: string, b: string) {
    return this.ancestors(b).has(a);
  }
  async compare(base: string, head: string) {
    const b = this.refs.get(base) ?? base;
    const h = this.refs.get(head) ?? head;
    const ahead = [...this.ancestors(h)].filter((s) => !this.ancestors(b).has(s));
    const bt = this.trees.get(this.commits.get(b)!.tree)!;
    const ht = this.trees.get(this.commits.get(h)!.tree)!;
    const files = [...new Set([...bt.keys(), ...ht.keys()])]
      .filter((p) => bt.get(p) !== ht.get(p))
      .map((p) => ({ path: p, status: !bt.has(p) ? 'added' : !ht.has(p) ? 'removed' : 'modified' }));
    return { ahead: ahead.length, behind: 0, files: ahead.length ? files : [], commits: [] };
  }
  /** Simplified merge: fails on files changed on both sides, otherwise takes the head's version. */
  async merge(base: string, head: string, message: string) {
    const b = this.refs.get(base)!;
    const h = this.refs.get(head)!;
    if (this.isAncestor(h, b)) return null;
    const tree = new Map(this.trees.get(this.commits.get(b)!.tree)!);
    for (const [p, sha] of this.files(head)) tree.set(p, sha);
    for (const p of [...tree.keys()]) if (!this.files(head).has(p)) tree.delete(p);
    const tid = this.id('t');
    this.trees.set(tid, tree);
    const id = this.id('c');
    this.commits.set(id, { tree: tid, parents: [b, h], message, date: new Date().toISOString() });
    this.refs.set(base, id);
    return id;
  }
  async combinedStatus(ref: string) {
    ref = [...this.refs].find(([, s]) => s === ref)?.[0] ?? ref;
    return { state: 'success', statuses: (this.statuses.get(ref) ?? []).map((s) => ({ ...s, description: null, updated_at: '' })) };
  }
  async getRaw(path: string, ref: string) {
    const sha = this.files(ref).get(path);
    if (!sha) throw new GitHubError(404, 'Not Found');
    const b = this.blobs.get(sha)!;
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  }
}

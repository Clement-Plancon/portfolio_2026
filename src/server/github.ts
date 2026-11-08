// Minimal GitHub REST client for the CMS. Server-side only: the token never reaches the browser.
import { createHash } from 'node:crypto';

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface GitHubOptions {
  token: string;
  repo: string; // "owner/name"
  fetch?: typeof fetch;
}

export type TreeEntry = { path: string; sha: string; type: 'blob' | 'tree'; size?: number };

/** Git blob id of some content, computed locally (same algorithm as `git hash-object`). */
export function gitBlobSha(content: Uint8Array): string {
  return createHash('sha1')
    .update(`blob ${content.byteLength}\0`)
    .update(content)
    .digest('hex');
}

export class GitHub {
  private base: string;
  private f: typeof fetch;

  constructor(private opts: GitHubOptions) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(opts.repo)) throw new Error('GITHUB_REPO invalide');
    this.base = `https://api.github.com/repos/${opts.repo}`;
    this.f = opts.fetch ?? fetch;
  }

  private async req<T>(method: string, path: string, body?: unknown, accept = 'application/vnd.github+json'): Promise<T> {
    const res = await this.f(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.opts.token}`,
        Accept: accept,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'portfolio-cms',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        msg = ((await res.json()) as { message?: string }).message ?? msg;
      } catch {
        /* non-JSON error body */
      }
      throw new GitHubError(res.status, msg);
    }
    if (res.status === 204) return undefined as T;
    if (accept.includes('raw')) return (await res.arrayBuffer()) as T;
    return (await res.json()) as T;
  }

  async getRefSha(branch: string): Promise<string | null> {
    try {
      const r = await this.req<{ object: { sha: string } }>('GET', `/git/ref/heads/${encodeURIComponent(branch)}`);
      return r.object.sha;
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return null;
      throw e;
    }
  }

  async createRef(branch: string, sha: string) {
    await this.req('POST', '/git/refs', { ref: `refs/heads/${branch}`, sha });
  }

  async updateRef(branch: string, sha: string, force = false) {
    await this.req('PATCH', `/git/refs/heads/${encodeURIComponent(branch)}`, { sha, force });
  }

  async deleteRef(branch: string) {
    await this.req('DELETE', `/git/refs/heads/${encodeURIComponent(branch)}`);
  }

  async getCommit(sha: string) {
    const c = await this.req<{ sha: string; tree: { sha: string }; committer: { date: string }; message: string }>(
      'GET',
      `/git/commits/${sha}`,
    );
    return { sha: c.sha, treeSha: c.tree.sha, date: c.committer.date, message: c.message };
  }

  async getTree(treeSha: string): Promise<TreeEntry[]> {
    const t = await this.req<{ tree: TreeEntry[]; truncated: boolean }>('GET', `/git/trees/${treeSha}?recursive=1`);
    if (t.truncated) throw new GitHubError(500, 'Arborescence du dépôt trop grande pour être lue en une fois');
    return t.tree;
  }

  async getBlob(sha: string): Promise<Buffer> {
    const b = await this.req<{ content: string; encoding: string }>('GET', `/git/blobs/${sha}`);
    return Buffer.from(b.content, b.encoding === 'base64' ? 'base64' : 'utf8');
  }

  async createBlob(content: Uint8Array): Promise<string> {
    const r = await this.req<{ sha: string }>('POST', '/git/blobs', {
      content: Buffer.from(content).toString('base64'),
      encoding: 'base64',
    });
    return r.sha;
  }

  async createTree(baseTree: string, entries: { path: string; sha: string | null }[]): Promise<string> {
    const r = await this.req<{ sha: string }>('POST', '/git/trees', {
      base_tree: baseTree,
      tree: entries.map((e) => ({ path: e.path, mode: '100644', type: 'blob', sha: e.sha })),
    });
    return r.sha;
  }

  async createCommit(message: string, tree: string, parent: string, author?: { name: string; email: string }) {
    const r = await this.req<{ sha: string }>('POST', '/git/commits', {
      message,
      tree,
      parents: [parent],
      ...(author && { author: { ...author, date: new Date().toISOString() } }),
    });
    return r.sha;
  }

  async compare(base: string, head: string) {
    const r = await this.req<{
      ahead_by: number;
      behind_by: number;
      files?: { filename: string; status: string }[];
      commits: { sha: string; commit: { message: string; author: { date: string } } }[];
    }>('GET', `/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`);
    return {
      ahead: r.ahead_by,
      behind: r.behind_by,
      files: (r.files ?? []).map((f) => ({ path: f.filename, status: f.status })),
      commits: r.commits.map((c) => ({ sha: c.sha, message: c.commit.message, date: c.commit.author.date })),
    };
  }

  /** Merges head into base. Returns null when there was nothing to merge. Throws 409 on conflict. */
  async merge(base: string, head: string, message: string): Promise<string | null> {
    const r = await this.req<{ sha: string } | undefined>('POST', '/merges', { base, head, commit_message: message });
    return r?.sha ?? null;
  }

  async combinedStatus(ref: string) {
    const r = await this.req<{
      state: string;
      statuses: { context: string; state: string; target_url: string | null; description: string | null; updated_at: string }[];
    }>('GET', `/commits/${encodeURIComponent(ref)}/status`);
    return r;
  }

  async getRaw(path: string, ref: string): Promise<ArrayBuffer> {
    const safe = path.split('/').map(encodeURIComponent).join('/');
    return this.req<ArrayBuffer>('GET', `/contents/${safe}?ref=${encodeURIComponent(ref)}`, undefined, 'application/vnd.github.raw+json');
  }
}

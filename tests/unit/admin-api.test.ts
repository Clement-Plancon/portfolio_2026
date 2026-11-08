// End-to-end tests of the admin API against an in-memory GitHub, seeded with the real content files.
import { beforeEach, describe, expect, it } from 'vitest';
import { Cms } from '../../src/server/cms';
import type { GitHub } from '../../src/server/github';
import { createHandler } from '../../src/server/handler';
import { FakeGitHub } from '../helpers/fake-github';

const ORIGIN = 'https://clementplancon.fr';
const ADMIN = 'admin@example.com';

let gh: FakeGitHub;
let user: { email: string } | null;
let handle: (req: Request) => Promise<Response>;

function req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const mutation = method !== 'GET';
  return new Request(`${ORIGIN}/api/admin${path}`, {
    method,
    headers: {
      ...(mutation ? { origin: ORIGIN, 'x-cms-request': '1', 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const call = async (method: string, path: string, body?: unknown, headers?: Record<string, string>) => {
  const res = await handle(req(method, path, body, headers));
  return { status: res.status, body: res.headers.get('content-type')?.includes('json') ? await res.json() : null };
};

beforeEach(() => {
  gh = FakeGitHub.fromDir(process.cwd(), ['src/content', 'src/assets/media']);
  user = { email: ADMIN };
  handle = createHandler({
    cms: new Cms(gh as unknown as GitHub, { branch: 'main', draftBranch: 'cms-draft' }),
    getUser: async () => user,
    verifyOrigin: (r) => {
      if (r.headers.get('origin') !== new URL(r.url).origin) throw new Error('bad origin');
    },
    adminEmails: [ADMIN],
    log: () => {},
  });
});

describe('access control', () => {
  it('rejects requests without a session', async () => {
    user = null;
    expect((await call('GET', '/content')).status).toBe(401);
  });
  it('rejects accounts that are not in ADMIN_EMAILS', async () => {
    user = { email: 'someone@example.com' };
    const r = await call('GET', '/content');
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('forbidden');
  });
  it('compares e-mails case-insensitively', async () => {
    user = { email: 'Admin@Example.com' };
    expect((await call('GET', '/session')).status).toBe(200);
  });
  it('rejects cross-site mutations', async () => {
    const r = await call('POST', '/discard', {}, { origin: 'https://evil.example' });
    expect(r.status).toBe(403);
  });
  it('rejects mutations without the CMS header', async () => {
    const res = await handle(
      new Request(`${ORIGIN}/api/admin/discard`, { method: 'POST', headers: { origin: ORIGIN }, body: '{}' }),
    );
    expect(res.status).toBe(403);
  });
  it('fails closed when no admin is configured', async () => {
    handle = createHandler({ cms: null, getUser: async () => user, verifyOrigin: () => {}, adminEmails: [], log: () => {} });
    expect((await call('GET', '/session')).status).toBe(503);
  });
});

describe('content editing', () => {
  it('reads all content from main when there is no draft', async () => {
    const r = await call('GET', '/content');
    expect(r.status).toBe(200);
    expect(r.body.ref.isDraft).toBe(false);
    expect(r.body.collections.project).toHaveLength(6);
    expect(r.body.singletons.profile.data.name).toBe('Clément Plançon');
  });

  it('saves a project to the draft branch and the change persists on reload', async () => {
    const before = await call('GET', '/content');
    const p = before.body.collections.project.find((x: { id: string }) => x.id === 'bercy-vert');
    const saved = await call('POST', '/save', {
      message: 'Modification de Bercy Vert',
      changes: [{ op: 'put', type: 'project', id: 'bercy-vert', data: { ...p.data, summary: 'Nouveau résumé.' }, baseSha: p.sha }],
    });
    expect(saved.status).toBe(200);
    // main untouched, draft has the change
    expect(gh.read('main', 'src/content/projects/bercy-vert.json')).not.toContain('Nouveau résumé.');
    expect(gh.read('cms-draft', 'src/content/projects/bercy-vert.json')).toContain('Nouveau résumé.');

    const after = await call('GET', '/content');
    expect(after.body.ref.isDraft).toBe(true);
    const p2 = after.body.collections.project.find((x: { id: string }) => x.id === 'bercy-vert');
    expect(p2.data.summary).toBe('Nouveau résumé.');
    expect(p2.data.updatedAt).toBeTruthy();
    // returned sha matches the stored blob, so the next save does not conflict
    expect(saved.body.files['src/content/projects/bercy-vert.json']).toBe(p2.sha);
  });

  it('detects concurrent edits (stale sha -> 409)', async () => {
    const c = await call('GET', '/content');
    const p = c.body.collections.project[0];
    const change = (summary: string) => ({
      message: 'x',
      changes: [{ op: 'put', type: 'project', id: p.id, data: { ...p.data, summary }, baseSha: p.sha }],
    });
    expect((await call('POST', '/save', change('A'))).status).toBe(200);
    const r = await call('POST', '/save', change('B'));
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('conflict');
  });

  it('validates data on the server', async () => {
    const r = await call('POST', '/save', {
      message: 'x',
      changes: [
        {
          op: 'put',
          type: 'project',
          id: 'nouveau',
          data: { title: '', summary: 'x', category: 'pro', links: [{ label: 'x', url: 'javascript:alert(1)' }] },
          baseSha: null,
        },
      ],
    });
    expect(r.status).toBe(422);
    const paths = r.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toContain('title');
    expect(paths).toContain('links.0.url');
  });

  it('rejects path traversal in ids', async () => {
    const r = await call('POST', '/save', {
      message: 'x',
      changes: [{ op: 'put', type: 'project', id: '../../netlify', data: {}, baseSha: null }],
    });
    expect(r.status).toBe(400);
  });

  it('creates, renames (delete + create) and deletes in single commits', async () => {
    const c = await call('GET', '/content');
    const p = c.body.collections.project.find((x: { id: string }) => x.id === 'safeping');
    const rename = await call('POST', '/save', {
      message: 'Renommage',
      changes: [
        { op: 'delete', type: 'project', id: 'safeping', baseSha: p.sha },
        { op: 'put', type: 'project', id: 'safe-ping', data: p.data, baseSha: null },
      ],
    });
    expect(rename.status).toBe(200);
    expect(gh.read('cms-draft', 'src/content/projects/safeping.json')).toBeUndefined();
    expect(gh.read('cms-draft', 'src/content/projects/safe-ping.json')).toBeDefined();
    const exists = await call('POST', '/save', {
      message: 'x',
      changes: [{ op: 'put', type: 'project', id: 'datametre', data: p.data, baseSha: null }],
    });
    expect(exists.status).toBe(409);
    expect(exists.body.error.code).toBe('exists');
  });

  it('cannot delete singletons', async () => {
    const r = await call('POST', '/save', { message: 'x', changes: [{ op: 'delete', type: 'profile', baseSha: 'x' }] });
    expect(r.status).toBe(400);
  });
});

describe('publication', () => {
  it('publishes the draft to main, then reports nothing pending', async () => {
    const c = await call('GET', '/content');
    const profile = c.body.singletons.profile;
    await call('POST', '/save', {
      message: 'Profil',
      changes: [{ op: 'put', type: 'profile', data: { ...profile.data, location: 'Paris, France' }, baseSha: profile.sha }],
    });
    const s1 = await call('GET', '/status');
    expect(s1.body.draft.ahead).toBe(1);
    expect(s1.body.draft.files[0].type).toBe('profile');

    const pub = await call('POST', '/publish', {});
    expect(pub.status).toBe(200);
    expect(gh.read('main', 'src/content/profile.json')).toContain('Paris, France');
    expect((await call('GET', '/status')).body.draft.ahead).toBe(0);
  });

  it('refuses to publish when there is no draft', async () => {
    expect((await call('POST', '/publish', {})).status).toBe(400);
  });

  it('discards unpublished changes', async () => {
    const c = await call('GET', '/content');
    const s = c.body.singletons.skills;
    await call('POST', '/save', { message: 'x', changes: [{ op: 'put', type: 'skills', data: { groups: [] }, baseSha: s.sha }] });
    expect((await call('POST', '/discard', {})).status).toBe(200);
    const after = await call('GET', '/content');
    expect(after.body.ref.isDraft).toBe(false);
    expect(after.body.singletons.skills.data.groups.length).toBeGreaterThan(0);
  });
});

describe('media', () => {
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

  it('uploads an image, names it safely and records it in the manifest', async () => {
    const r = await call('POST', '/media', { fileName: "Capture d'écran (2).PNG", contentBase64: png.toString('base64'), alt: 'Une capture' });
    expect(r.status).toBe(201);
    expect(r.body.ref).toBe('media/capture-d-ecran-2.png');
    expect(gh.files('cms-draft').has('src/assets/media/capture-d-ecran-2.png')).toBe(true);
    expect(gh.read('cms-draft', 'src/content/media.json')).toContain('Une capture');
  });

  it('rejects files whose bytes are not an accepted format (e.g. SVG, HTML)', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const r = await call('POST', '/media', { fileName: 'x.png', contentBase64: svg.toString('base64') });
    expect(r.status).toBe(415);
  });

  it('refuses to overwrite an existing file unless replacing', async () => {
    const body = { fileName: 'a.png', contentBase64: png.toString('base64') };
    expect((await call('POST', '/media', body)).status).toBe(201);
    expect((await call('POST', '/media', body)).status).toBe(409);
    expect((await call('POST', '/media', { ...body, replace: 'media/a.png' })).status).toBe(201);
  });

  it('refuses to delete a media still used by content', async () => {
    const r = await call('POST', '/media/delete', { ref: 'media/datametre-apercu.webp' });
    expect(r.status).toBe(409);
    expect(r.body.error.details[0].path).toBe('projects/datametre.json');
  });

  it('deletes an unused media and its manifest entry', async () => {
    await call('POST', '/media', { fileName: 'b.png', contentBase64: png.toString('base64') });
    expect((await call('POST', '/media/delete', { ref: 'media/b.png' })).status).toBe(200);
    expect(gh.files('cms-draft').has('src/assets/media/b.png')).toBe(false);
    expect(gh.read('cms-draft', 'src/content/media.json')).not.toContain('media/b.png');
  });

  it('serves media files to the admin and rejects invalid refs', async () => {
    const ok = await handle(req('GET', '/media/file?ref=media/datametre-apercu.webp'));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toBe('image/webp');
    expect((await call('GET', '/media/file?ref=../../.env')).status).toBe(400);
  });
});

// Content in Netlify Blobs: initialisation, drafts, publication, media, backups, concurrency.
// Runs on an in-memory stand-in with the same conditional-write rules as Netlify Blobs.
import { readdirSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { contentPath } from '../../src/lib/content-types';
import { toSiteData, type Snapshot } from '../../src/lib/snapshot';
import { ContentStore, entrySha, HISTORY_KEEP } from '../../src/server/content-store';
import { testCms } from '../helpers/cms';

const repoJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const png = (n: number) => new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, n)]));

let t: ReturnType<typeof testCms>;
beforeEach(() => {
  t = testCms();
});

const project = async (id: string) => {
  const all = await t.cms.readAll();
  return all.collections.project.find((e) => (e as { id: string }).id === id) as { id: string; sha: string; data: Record<string, unknown> };
};

describe('initialisation', () => {
  it('1. imports the repository content into Blobs on first use, with a backup copy', async () => {
    expect(await t.store.get('published')).toBeNull();
    expect((await t.cms.ensureInitialised()).initialised).toBe(true);
    const pub = (await t.snap('published'))!;
    expect(pub.rev).toBe(1);
    expect(await t.store.list('backups/')).toHaveLength(1);
    expect((await t.files.getFile(pub.media['media/datametre-apercu.webp'].sha))?.bytes.byteLength).toBe(readFileSync('src/assets/media/datametre-apercu.webp').byteLength);
  });

  it('20. preserves every existing content exactly (projects, order, texts, links, experiences, profile, skills, SEO, media)', async () => {
    const pub = (await t.cms.published()) as Snapshot;
    for (const dir of ['projects', 'experiences']) {
      for (const f of readdirSync(`src/content/${dir}`)) {
        const path = `src/content/${dir}/${f}`;
        // Same data, field by field (the schema only fills absent optional lists with their defaults).
        expect(pub.entries[path], path).toMatchObject(repoJson(path));
      }
    }
    for (const f of ['profile', 'skills', 'seo', 'media']) expect(pub.entries[`src/content/${f}.json`]).toMatchObject(repoJson(`src/content/${f}.json`));
    const site = toSiteData(pub);
    expect(site.projects.map((p) => p.id)).toEqual(['bercy-vert', 'referentiel-indicateurs', 'saisines-cour-des-comptes', 'veille-strategique', 'safeping', 'datametre']);
    expect(site.projects.find((p) => p.id === 'datametre')?.links.length).toBeGreaterThan(0);
    expect(site.projects.find((p) => p.id === 'bercy-vert')?.technologies).toEqual(repoJson('src/content/projects/bercy-vert.json').technologies);
    expect(site.experiences).toHaveLength(readdirSync('src/content/experiences').length);
  });

  it('2. never re-initialises: a redeploy (new instance, same store) keeps the edited content', async () => {
    const p = await project('safeping');
    await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: 'Modifié.' }, baseSha: p.sha }]);
    await t.cms.publish();
    // A new deployment = a new ContentStore on the same Blobs data.
    const redeployed = new ContentStore({ docs: t.store, files: t.files, log: () => {} });
    expect((await redeployed.ensureInitialised()).initialised).toBe(false);
    expect(((await redeployed.published()).entries[contentPath('project', 'safeping')] as { summary: string }).summary).toBe('Modifié.');
    expect(await t.store.list('backups/')).toHaveLength(1);
  });

  it('two first visits at the same time initialise once', async () => {
    const other = new ContentStore({ docs: t.store, files: t.files, log: () => {} });
    const r = await Promise.all([t.cms.ensureInitialised(), other.ensureInitialised()]);
    expect(r.filter((x) => x.initialised)).toHaveLength(1);
  });
});

describe('drafts and publication', () => {
  it('6-9. create, modify, reorder and delete projects in the draft; the published content does not move', async () => {
    const before = await t.cms.published();
    const base = (await project('safeping')).data;
    await t.cms.save([{ op: 'put', type: 'project', id: 'nouveau', data: { ...base, title: 'Nouveau', order: 99 }, baseSha: null }]);
    const sp = await project('safeping');
    await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...sp.data, title: 'SafePing 2' }, baseSha: sp.sha }]);
    const [a, b] = [await project('bercy-vert'), await project('datametre')];
    await t.cms.save([
      { op: 'put', type: 'project', id: 'bercy-vert', data: { ...a.data, order: b.data.order }, baseSha: a.sha },
      { op: 'put', type: 'project', id: 'datametre', data: { ...b.data, order: a.data.order }, baseSha: b.sha },
    ]);
    const v = await project('veille-strategique');
    await t.cms.save([{ op: 'delete', type: 'project', id: 'veille-strategique', baseSha: v.sha }]);

    const draft = toSiteData((await t.snap('draft'))!, { includeHidden: true });
    expect(draft.projects.map((p) => p.id)).toEqual(['datametre', 'referentiel-indicateurs', 'saisines-cour-des-comptes', 'safeping', 'bercy-vert', 'nouveau']);
    expect(draft.projects.find((p) => p.id === 'safeping')?.title).toBe('SafePing 2');
    expect(await t.snap('published')).toEqual(before);
    const status = await t.cms.status();
    expect(status.draft?.files.map((f) => `${f.status} ${f.id}`).sort()).toEqual(['added nouveau', 'modified bercy-vert', 'modified datametre', 'modified safeping', 'removed veille-strategique']);
  });

  it('10. publishes everything at once, keeps the previous version, then nothing is pending', async () => {
    const p = await project('safeping');
    await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: 'Publié.' }, baseSha: p.sha }]);
    const r = await t.cms.publish();
    expect(r.published).toBe(true);
    expect(await t.read('published', contentPath('project', 'safeping'))).toContain('Publié.');
    expect(await t.store.list('history/')).toEqual(['history/00000001']);
    expect(await t.cms.status()).toMatchObject({ draft: null });
    expect((await t.cms.readAll()).ref.isDraft).toBe(false);
  });

  it('refuses to publish an invalid draft, and publishes nothing of it', async () => {
    await t.cms.ensureInitialised();
    const before = await t.snap('published');
    const p = await project('safeping');
    await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: 'x' }, baseSha: p.sha }]);
    const d = (await t.store.get<Snapshot>('draft'))!;
    // Damaged draft (e.g. edited by hand in Blobs): publication is refused as a whole.
    await t.store.set('draft', { ...d.value, entries: { ...d.value.entries, [contentPath('profile')]: { name: '' } } });
    await expect(t.cms.publish()).rejects.toMatchObject({ status: 422 });
    expect(await t.snap('published')).toEqual(before);
  });

  it('a publication racing with another one fails cleanly, without a partial result', async () => {
    const p = await project('safeping');
    await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: 'A' }, baseSha: p.sha }]);
    const results = await Promise.allSettled([t.cms.publish(), t.cms.publish()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await t.read('published', contentPath('project', 'safeping'))).toContain('"summary": "A"');
  });

  it('keeps at most HISTORY_KEEP previous versions', async () => {
    for (let i = 0; i < HISTORY_KEEP + 3; i++) {
      const p = await project('safeping');
      await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: `v${i}` }, baseSha: p.sha }]);
      await t.cms.publish();
    }
    expect(await t.store.list('history/')).toHaveLength(HISTORY_KEEP);
  });

  it('discard returns the draft to the published content', async () => {
    const p = await project('safeping');
    await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: 'Abandonné.' }, baseSha: p.sha }]);
    await t.cms.discard();
    expect((await project('safeping')).data.summary).not.toBe('Abandonné.');
    expect((await t.cms.status()).draft).toBeNull();
  });
});

describe('concurrent writes', () => {
  it('17. two saves of different projects at the same time both land (no lost update)', async () => {
    const [a, b] = [await project('safeping'), await project('datametre')];
    await Promise.all([
      t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...a.data, summary: 'Onglet A' }, baseSha: a.sha }]),
      t.cms.save([{ op: 'put', type: 'project', id: 'datametre', data: { ...b.data, summary: 'Onglet B' }, baseSha: b.sha }]),
    ]);
    expect(await t.read('draft', contentPath('project', 'safeping'))).toContain('Onglet A');
    expect(await t.read('draft', contentPath('project', 'datametre'))).toContain('Onglet B');
    expect(t.store.conflicts).toBeGreaterThan(0); // the conditional write did refuse one, which was retried
  });

  it('17. two saves of the SAME project from stale pages: the second is refused (409), not silently applied', async () => {
    const a = await project('safeping');
    const r = await Promise.allSettled([
      t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...a.data, summary: 'Premier' }, baseSha: a.sha }]),
      t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...a.data, summary: 'Second' }, baseSha: a.sha }]),
    ]);
    expect(r.map((x) => x.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect((r.find((x) => x.status === 'rejected') as PromiseRejectedResult).reason).toMatchObject({ status: 409 });
  });

  it('many parallel saves: every one is either applied or refused, none lost', async () => {
    const ids = ['bercy-vert', 'referentiel-indicateurs', 'saisines-cour-des-comptes', 'veille-strategique', 'safeping', 'datametre'];
    const entries = await Promise.all(ids.map(project));
    const r = await Promise.allSettled(entries.map((e) => t.cms.save([{ op: 'put', type: 'project', id: e.id, data: { ...e.data, summary: `p-${e.id}` }, baseSha: e.sha }])));
    const draft = (await t.snap('draft'))!;
    ids.forEach((id, i) => {
      const applied = (draft.entries[contentPath('project', id)] as { summary: string }).summary === `p-${id}`;
      expect(applied).toBe(r[i].status === 'fulfilled');
    });
    expect(r.filter((x) => x.status === 'fulfilled').length).toBeGreaterThanOrEqual(5);
  });
});

describe('media', () => {
  it('13. imports a file: stored by hash, private until published', async () => {
    await t.cms.uploadMedia({ ref: 'media/capture.png', bytes: png(1), contentType: 'image/png', alt: 'Capture', replace: false });
    expect(await t.hasMedia('draft', 'media/capture.png')).toBe(true);
    expect(await t.hasMedia('published', 'media/capture.png')).toBe(false);
    await expect(t.cms.readMedia('media/capture.png', 'published')).rejects.toMatchObject({ status: 404 });
    expect((await t.cms.readMedia('media/capture.png', 'working')).bytes).toEqual(png(1));
    await t.cms.publish();
    expect((await t.cms.readMedia('media/capture.png', 'published')).bytes).toEqual(png(1));
  });

  it('replacing a file keeps the published bytes until the next publication', async () => {
    await t.cms.uploadMedia({ ref: 'media/capture.png', bytes: png(1), contentType: 'image/png', alt: 'v1', replace: false });
    await t.cms.publish();
    await t.cms.uploadMedia({ ref: 'media/capture.png', bytes: png(2), contentType: 'image/png', alt: '', replace: true });
    expect((await t.cms.readMedia('media/capture.png', 'published')).bytes).toEqual(png(1));
    expect((await t.cms.readMedia('media/capture.png', 'working')).bytes).toEqual(png(2));
    await t.cms.publish();
    expect((await t.cms.readMedia('media/capture.png', 'published')).bytes).toEqual(png(2));
  });

  it('14. refuses to delete a media used by content, then deletes it once unused', async () => {
    await expect(t.cms.deleteMedia('media/datametre-apercu.webp')).rejects.toMatchObject({ status: 409, code: 'in_use' });
    await t.cms.uploadMedia({ ref: 'media/libre.png', bytes: png(3), contentType: 'image/png', alt: '', replace: false });
    await t.cms.deleteMedia('media/libre.png');
    expect(await t.hasMedia('draft', 'media/libre.png')).toBe(false);
    expect(await t.read('draft', contentPath('media'))).not.toContain('media/libre.png');
  });

  it('removes unreferenced files after publication, keeps those of kept versions', async () => {
    await t.cms.uploadMedia({ ref: 'media/a.png', bytes: png(4), contentType: 'image/png', alt: '', replace: false });
    await t.cms.publish();
    await t.cms.deleteMedia('media/a.png');
    await t.cms.publish();
    // Still referenced by the previous version in history/.
    expect(await t.files.list('')).toContain((await import('../../src/server/content-store')).fileSha(png(4)));
  });
});

describe('backup and restore', () => {
  it('15. exports the editorial data (and, on request, the media files)', async () => {
    const b = await t.cms.exportBackup();
    expect(b).toMatchObject({ format: 'clementplancon-cms-backup', version: 1, source: 'published' });
    expect(Object.keys(b.snapshot.entries)).toContain(contentPath('profile'));
    expect(b).not.toHaveProperty('files');
    const full = await t.cms.exportBackup({ withFiles: true });
    expect(Object.keys(full.files!)).toEqual([b.snapshot.media['media/datametre-apercu.webp'].sha]);
  });

  it('16. restores a backup into the draft (validated, previous draft saved), then publishes it', async () => {
    const backup = JSON.parse(JSON.stringify(await t.cms.exportBackup()));
    const p = await project('safeping');
    await t.cms.save([{ op: 'put', type: 'project', id: 'safeping', data: { ...p.data, summary: 'Après sauvegarde' }, baseSha: p.sha }]);
    const rev = (await t.cms.readAll()).ref.sha;
    const r = await t.cms.restoreBackup(backup, rev);
    expect(r).toMatchObject({ restored: true, projects: 6, media: 1 });
    expect((await project('safeping')).data.summary).not.toBe('Après sauvegarde');
    expect((await t.store.list('backups/')).some((k) => k.endsWith('avant-restauration'))).toBe(true);
    expect((await t.cms.status()).draft).toBeNull(); // identical to what is published
  });

  it('16. refuses invalid, foreign or stale backups, and changes nothing', async () => {
    const good = JSON.parse(JSON.stringify(await t.cms.exportBackup()));
    const before = await t.snap('draft');
    const bad = [
      null,
      { hello: 'world' },
      { ...good, format: 'autre' },
      { ...good, version: 2 },
      { ...good, snapshot: { ...good.snapshot, entries: { ...good.snapshot.entries, [contentPath('profile')]: { name: 42 } } } },
      { ...good, snapshot: { ...good.snapshot, entries: { ...good.snapshot.entries, '../../etc/passwd': {} } } },
      { ...good, snapshot: { ...good.snapshot, media: { 'media/x.png': { sha: 'a'.repeat(64), size: 1, contentType: 'image/png' } } } },
    ];
    for (const b of bad) await expect(t.cms.restoreBackup(b, undefined)).rejects.toMatchObject({ status: expect.any(Number) });
    await expect(t.cms.restoreBackup(good, '999')).rejects.toMatchObject({ status: 409 });
    expect(await t.snap('draft')).toEqual(before);
  });

  it('restores media files carried by a full backup, after checking their hash', async () => {
    await t.cms.uploadMedia({ ref: 'media/b.png', bytes: png(5), contentType: 'image/png', alt: '', replace: false });
    const full = JSON.parse(JSON.stringify(await t.cms.exportBackup({ withFiles: true })));
    const fresh = testCms();
    await fresh.cms.restoreBackup(full, undefined);
    expect((await fresh.cms.readMedia('media/b.png')).bytes).toEqual(png(5));
    const sha = full.snapshot.media['media/b.png'].sha;
    const corrupted = { ...full, files: { ...full.files, [sha]: Buffer.from('autre').toString('base64') } };
    await expect(testCms().cms.restoreBackup(corrupted, undefined)).rejects.toMatchObject({ status: 422 });
  });

  it('the restore never touches authentication data (separate store)', async () => {
    await t.cms.ensureInitialised();
    const keysBefore = (await t.store.list('')).filter((k) => !k.startsWith('backups/') && !k.startsWith('history/'));
    await t.cms.restoreBackup(JSON.parse(JSON.stringify(await t.cms.exportBackup())), undefined);
    const keysAfter = (await t.store.list('')).filter((k) => !k.startsWith('backups/') && !k.startsWith('history/'));
    expect(new Set(keysAfter)).toEqual(new Set([...keysBefore, 'draft']));
  });
});

it('entry fingerprints are stable', () => {
  expect(entrySha({ a: 1 })).toBe(entrySha({ a: 1 }));
  expect(entrySha({ a: 1 })).not.toBe(entrySha({ a: 2 }));
});

it('the node:fs seed used by browser tests matches the bundled seed', async () => {
  const { fsSeed } = await import('../helpers/seed-fs');
  const { seedSnapshot } = await import('../../src/lib/seed');
  const a = (await fsSeed()).snapshot;
  const b = seedSnapshot();
  expect(a.entries).toEqual(b.entries);
  expect(a.media).toEqual(b.media);
});

// The real content files must satisfy the schemas (the build relies on it) and stay truthful.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contentPath, parseContentPath } from '../../src/lib/content-types';
import { experienceSchema, mediaManifestSchema, profileSchema, projectSchema, seoSettingsSchema, skillsSchema } from '../../src/lib/schemas';
import { slugifyFileName, sniff } from '../../src/server/media';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const dir = (d: string) => readdirSync(d).filter((f) => f.endsWith('.json'));

describe('content files', () => {
  it('validates singletons', () => {
    expect(profileSchema.safeParse(read('src/content/profile.json')).success).toBe(true);
    expect(skillsSchema.safeParse(read('src/content/skills.json')).success).toBe(true);
    expect(seoSettingsSchema.safeParse(read('src/content/seo.json')).success).toBe(true);
    expect(mediaManifestSchema.safeParse(read('src/content/media.json')).success).toBe(true);
  });

  it('keeps exactly the six historical projects (no invented ones)', () => {
    const ids = dir('src/content/projects').map((f) => f.replace('.json', '')).sort();
    expect(ids).toEqual(['bercy-vert', 'datametre', 'referentiel-indicateurs', 'safeping', 'saisines-cour-des-comptes', 'veille-strategique']);
    for (const f of dir('src/content/projects')) {
      const r = projectSchema.safeParse(read(`src/content/projects/${f}`));
      expect(r.success, f).toBe(true);
    }
  });

  it('validates experiences', () => {
    for (const f of dir('src/content/experiences')) {
      expect(experienceSchema.safeParse(read(`src/content/experiences/${f}`)).success, f).toBe(true);
    }
  });

  it('rejects end dates before start dates', () => {
    const r = experienceSchema.safeParse({ role: 'x', organisation: 'y', start: '2024', end: '2022' });
    expect(r.success).toBe(false);
  });
});

describe('content paths', () => {
  it('maps types to files and back', () => {
    expect(contentPath('project', 'bercy-vert')).toBe('src/content/projects/bercy-vert.json');
    expect(parseContentPath('src/content/projects/bercy-vert.json')).toEqual({ type: 'project', id: 'bercy-vert' });
    expect(parseContentPath('src/content/profile.json')).toEqual({ type: 'profile' });
    expect(parseContentPath('src/content/projects/../x.json')).toBeNull();
  });
  it('rejects unsafe ids', () => {
    expect(() => contentPath('project', '../secret')).toThrow();
    expect(() => contentPath('project', 'A B')).toThrow();
  });
});

describe('media helpers', () => {
  it('detects formats from bytes', () => {
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('png');
    expect(sniff(Buffer.from('RIFF0000WEBPVP8 '))).toBe('webp');
    expect(sniff(Buffer.from('%PDF-1.7 0000000'))).toBe('pdf');
    expect(sniff(Buffer.from('<svg>000000000000'))).toBeNull();
  });
  it('slugifies file names', () => {
    expect(slugifyFileName('Écran Principal (v2).png')).toBe('ecran-principal-v2');
    expect(slugifyFileName('../../etc/passwd')).toBe('etc-passwd');
    expect(slugifyFileName('***.png')).toBe('media');
  });
});

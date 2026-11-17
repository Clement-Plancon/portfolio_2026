// The rollback script writes a backup back to exactly the repository files it came from.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { testCms } from '../helpers/cms';

it('backup-to-files restores src/content byte for byte from a backup of the initial content', async () => {
  const t = testCms();
  const backup = await t.cms.exportBackup({ withFiles: true });
  const dir = mkdtempSync(join(tmpdir(), 'restore-'));
  cpSync('src/content', join(dir, 'src/content'), { recursive: true });
  cpSync('src/assets', join(dir, 'src/assets'), { recursive: true });
  writeFileSync(join(dir, 'backup.json'), JSON.stringify(backup));
  execFileSync('node', [join(process.cwd(), 'scripts/backup-to-files.mjs'), 'backup.json'], { cwd: dir });
  for (const p of ['src/content/projects/datametre.json', 'src/content/profile.json', 'src/content/media.json']) {
    expect(JSON.parse(readFileSync(join(dir, p), 'utf8'))).toEqual(JSON.parse(JSON.stringify(backup.snapshot.entries[p])));
  }
  expect(readFileSync(join(dir, 'src/assets/media/datametre-apercu.webp'))).toEqual(readFileSync('src/assets/media/datametre-apercu.webp'));
});

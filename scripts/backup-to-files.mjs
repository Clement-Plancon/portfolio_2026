#!/usr/bin/env node
// Writes an admin backup back into the repository files:
//   node scripts/backup-to-files.mjs clementplancon-sauvegarde-AAAA-MM-JJ[-avec-fichiers].json
// Uses: keep a copy of the content in Git, or roll back to the former static site (which read src/content).
// Only paths of the content model are written (src/content/**.json); media files are written to
// src/assets/media (images) and public/files (PDF) when the backup includes them.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage : node scripts/backup-to-files.mjs <sauvegarde.json>');
  process.exit(1);
}
const backup = JSON.parse(readFileSync(file, 'utf8'));
if (backup.format !== 'clementplancon-cms-backup' || backup.version !== 1) {
  console.error("Ce fichier n'est pas une sauvegarde de l'administration.");
  process.exit(1);
}
const SAFE = /^src\/content\/(?:[a-z]+\.json|(?:projects|experiences)\/[a-z0-9]+(?:-[a-z0-9]+)*\.json)$/;
let n = 0;
for (const [path, data] of Object.entries(backup.snapshot.entries)) {
  if (!SAFE.test(path)) throw new Error(`Chemin refusé : ${path}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  n++;
}
let m = 0;
for (const [ref, f] of Object.entries(backup.snapshot.media ?? {})) {
  const b64 = backup.files?.[f.sha];
  if (!b64) continue;
  const name = ref.split('/').pop();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.(webp|png|jpe?g|avif|pdf)$/.test(name)) throw new Error(`Nom de fichier refusé : ${ref}`);
  const out = ref.startsWith('files/') ? `public/files/${name}` : `src/assets/media/${name}`;
  writeFileSync(out, Buffer.from(b64, 'base64'));
  m++;
}
console.log(`${n} fichiers de contenu écrits, ${m} médias écrits.`);
console.log('Les projets ou expériences supprimés depuis ne sont pas effacés : vérifiez avec `git status` avant de committer.');

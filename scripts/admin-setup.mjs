#!/usr/bin/env node
// Generates the administrator secrets on your own computer (Windows, macOS, Linux):
//   npm run admin:setup                 → new password hash + new session secret
//   npm run admin:setup -- --password   → new password hash only (change of password)
//   npm run admin:setup -- --secret     → new session secret only (rotation)
// The password is typed without being shown, checked, then hashed with Argon2id. Nothing is written to
// disk: copy the printed values into Netlify (Site configuration → Environment variables).
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { argon2id, argon2Verify } from 'hash-wasm';

/** RFC 9106 second recommended option: 64 MiB of memory, 3 passes, 1 lane. */
export const ARGON2 = { memorySize: 65536, iterations: 3, parallelism: 1, hashLength: 32 };
const COMMON = ['password', 'motdepasse', 'azerty', 'qwerty', 'admin', 'administrateur', 'clement', 'plancon', 'portfolio', 'netlify', 'soleil', 'bonjour', 'secret'];

/** Returns the reasons a password is too weak (empty when it is acceptable). */
export function checkPassword(pw) {
  const problems = [];
  const chars = [...pw];
  if (chars.length < 14) problems.push('14 caractères minimum (une phrase de 4 mots ou plus est idéale).');
  if (chars.length > 256) problems.push('256 caractères maximum.');
  if (new Set(chars).size < 8) problems.push('Trop peu de caractères différents.');
  if (/(.)\1{3,}/u.test(pw)) problems.push('Pas plus de 3 fois le même caractère d’affilée.');
  if (/(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|azer|qwer)/i.test(pw)) problems.push('Évitez les suites (1234, abcd, azer…).');
  // Common words and your own names count for little: what remains without them must be substantial.
  const plain = pw.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  let rest = plain;
  for (const w of COMMON) rest = rest.split(w).join(' ');
  if (rest !== plain && rest.replace(/[\d\s\W_]/g, '').length < 12) {
    problems.push('Trop proche d’un mot de passe courant ou de vos noms (clement, plancon, admin…).');
  }
  // Rough entropy estimate from the character classes used.
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[ ]/.test(pw)) pool += 1;
  if (/[^a-zA-Z\d ]/.test(pw)) pool += 33;
  if (chars.length * Math.log2(Math.max(pool, 2)) < 70) problems.push('Pas assez imprévisible : allongez-le ou variez les caractères.');
  return problems;
}

export async function hashPassword(pw) {
  return argon2id({ password: pw, salt: randomBytes(16), ...ARGON2, outputType: 'encoded' });
}

export const generateSecret = () => randomBytes(32).toString('base64url');

/** Reads a line from the terminal without echoing it (works in PowerShell, cmd and Windows Terminal). */
function promptHidden(question) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error(
      'Ce terminal ne permet pas de masquer la saisie. Lancez la commande dans PowerShell, l’Invite de commandes ou Windows Terminal ' +
        '(avec Git Bash : winpty npm.cmd run admin:setup).',
    );
  }
  stdout.write(question);
  return new Promise((resolve, reject) => {
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const done = (err) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
      err ? reject(err) : resolve(value);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return done();
        if (ch === '\u0003') return done(new Error('Annulé.'));
        if (ch === '\u007f' || ch === '\b') value = [...value].slice(0, -1).join('');
        else if (ch >= ' ') value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    console.log('npm run admin:setup [-- --password | -- --secret]');
    return;
  }
  const wantPassword = !args.has('--secret');
  const wantSecret = !args.has('--password');
  const out = [];

  if (wantPassword) {
    console.log('Choisissez le mot de passe de l’administration (il ne s’affiche pas pendant la saisie).');
    console.log('14 caractères minimum ; une phrase de plusieurs mots est idéale. Rangez-le dans un gestionnaire de mots de passe.\n');
    let pw;
    for (;;) {
      pw = await promptHidden('Mot de passe : ');
      const problems = checkPassword(pw);
      if (problems.length) {
        console.log(`Mot de passe refusé :\n${problems.map((p) => `  - ${p}`).join('\n')}\n`);
        continue;
      }
      if ((await promptHidden('Confirmez : ')) !== pw) {
        console.log('Les deux saisies ne correspondent pas.\n');
        continue;
      }
      break;
    }
    process.stdout.write('Calcul du hachage Argon2id… ');
    const hash = await hashPassword(pw);
    if (!(await argon2Verify({ password: pw, hash }))) throw new Error('Vérification du hachage impossible.');
    console.log('fait.');
    out.push(['ADMIN_PASSWORD_HASH', hash]);
  }
  if (wantSecret) out.push(['ADMIN_SESSION_SECRET', generateSecret()]);

  const line = '─'.repeat(72);
  console.log(`\n${line}\nÀ copier dans Netlify → Site configuration → Environment variables`);
  console.log('Pour chaque variable : Scopes = « Functions » uniquement, cocher « Contains secret values ».\n');
  for (const [k, v] of out) console.log(`${k}\n${v}\n`);
  console.log(line);
  console.log('Copiez chaque valeur telle quelle (sans espace ni guillemet), puis redéployez le site.');
  console.log('Ces valeurs ne sont enregistrées nulle part : fermez ce terminal une fois la copie faite.');
  if (wantPassword || wantSecret) console.log('Après le redéploiement, toutes les sessions ouvertes sont fermées.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`\n${e.message}`);
    process.exit(1);
  });
}

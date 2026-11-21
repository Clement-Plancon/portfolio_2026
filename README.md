# clementplancon.fr

Portfolio de **Clément Plançon**, ingénieur logiciel et Tech Lead à Paris — avec son administration privée.

- **Site public** : une seule page (`/`), rendue à la demande par Astro (SSR sur Netlify) et gardée en cache par le CDN jusqu'à la publication suivante. Direction artistique « Fils » : six fils, un par projet, noués dans l'introduction (on les peigne au pointeur ou au doigt), dénoués par le défilement, chacun dessinant le motif de son projet, puis rassemblés sous l'adresse de contact. Le contenu est en HTML ; les fils sont dessinés en SVG par le serveur, puis par une scène WebGL2 sans bibliothèque (7,6 Ko compressé), chargée après la page, qui se retire si l'appareil ne suit pas.
- **Administration** (`/admin/`) : projets, expériences, profil, compétences, médias, référencement ; brouillon, aperçu privé, **publication immédiate** (sans build ni commit), sauvegarde et restauration.
- **Contenus** : stockés dans **Netlify Blobs** (aucune base de données, aucun jeton GitHub). `src/content/` contient le contenu d'origine, copié dans Blobs à la première visite et plus lu ensuite.
- **Hébergement** : Netlify (fonction SSR, CDN, Netlify Blobs). GitHub ne sert qu'au code source et aux déploiements techniques.
- **Authentification** : un seul administrateur, mot de passe vérifié côté serveur (hachage Argon2id), session signée dans un cookie `HttpOnly`, révocable. Aucun service d'identité externe.

## Démarrer

```bash
npm install
npm run dev
```

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement (http://localhost:4321) |
| `npx netlify serve --offline` | build de production servi comme sur Netlify, Blobs émulé (http://localhost:8888) |
| `npm run build` | build de production (`dist/` + fonction SSR dans `.netlify/`) |
| `npm run check` | vérification des types |
| `npm run lint` | lint (Biome) |
| `npm test` | tests unitaires et API (Vitest) |
| `npm run admin:setup` | génère sur votre ordinateur le hachage du mot de passe et le secret de session à copier dans Netlify (Windows, macOS, Linux) |
| `npm run test:e2e` | tests navigateur (Playwright) : 10 résolutions, accessibilité axe (clair et sombre), SEO, clavier, historique, sans JS, mouvement réduit, parcours admin. Si le Chromium de Playwright manque : `CHROMIUM_PATH=/chemin/vers/chromium npm run test:e2e` |

## Documentation

- [docs/art-direction.md](docs/art-direction.md) — échecs précédents, recherche (observations vérifiées), le concept « Fils », matériau et lumière, la tranche verticale et sa critique (`docs/prototypes/v5/`)
- [docs/interaction-system.md](docs/interaction-system.md) — architecture HTML → SVG → WebGL, mouvements, navigation, responsive, dégradation
- [docs/captures/](docs/captures/) — captures desktop, tablette et mobile, avec et sans WebGL, et les versions précédentes (`avant-*.jpg`)
- [docs/ux-review.md](docs/ux-review.md) — revue visuelle, corrections, ce qui est testé et ce qui ne l'est pas
- [docs/performance-review.md](docs/performance-review.md) — mesures Lighthouse et choix de performance
- [docs/research/](docs/research/) — planches des références observées ; [docs/creative-research.md](docs/creative-research.md) et [docs/design-research.md](docs/design-research.md) : recherches des directions précédentes
- [docs/architecture.md](docs/architecture.md) — architecture (SSR, Netlify Blobs), données, publication, cache, médias, sauvegarde, sécurité, design system
- [docs/netlify-deployment.md](docs/netlify-deployment.md) — mise en ligne, Netlify Blobs, initialisation, cache, variables, retour arrière, vérifications
- [docs/admin-guide.md](docs/admin-guide.md) — mode d'emploi de l'administration, changement de mot de passe, récupération d'accès, rotation des secrets

## Mise en place de l'administration (résumé)

1. Sur votre PC : `npm install`, puis `npm run admin:setup` (le mot de passe ne s'affiche pas pendant la saisie).
2. Dans Netlify, ajoutez `ADMIN_PASSWORD_HASH` et `ADMIN_SESSION_SECRET` (portée *Functions*, *Contains secret values*). Ce sont les seules variables.
3. Redéployez, ouvrez `/admin/` et saisissez votre mot de passe. Modifiez, **Voir l'aperçu**, **Publier** : le site est à jour aussitôt.

Détails : [docs/netlify-deployment.md](docs/netlify-deployment.md). Aucun secret n'est versionné : `.env` est ignoré par Git, et la commande n'écrit rien sur le disque.

## Contenu, sauvegardes et retour arrière

- Le contenu en ligne est dans Netlify Blobs. Modifier `src/content/` dans Git n'a **plus d'effet** une fois le site initialisé.
- **Sauvegardes** : administration → Paramètres. `node scripts/backup-to-files.mjs <sauvegarde.json>` réécrit une sauvegarde dans `src/content`, pour en garder une copie versionnée.
- **Retour arrière** : les 20 dernières versions publiées sont conservées. Pour la procédure de retour à l'ancien fonctionnement (site statique et CMS par GitHub), voir [docs/netlify-deployment.md](docs/netlify-deployment.md#retour-arrière).

## Référencement

`sitemap-index.xml` et `robots.txt` sont générés au build (une seule adresse : la page unique ; les anciennes pages redirigent en 301 vers leur section). Le HTML de la page, ses balises SEO et ses données structurées sont rendus côté serveur à partir du contenu publié. Pour Google Search Console / Bing Webmaster Tools : vérifier la propriété par DNS (aucune balise à ajouter au code), puis soumettre `https://clementplancon.fr/sitemap-index.xml`.

## Licences

Polices Bricolage Grotesque, Geist, Newsreader, Instrument Sans et Mona Sans : SIL Open Font License 1.1 (`public/fonts/`).

# clementplancon.fr

Portfolio de **Clément Plançon**, ingénieur logiciel et Tech Lead à Paris — avec son administration privée.

- **Site public** : une seule page (`/`), rendue à la demande par Astro (SSR sur Netlify) et gardée en cache par le CDN jusqu'à la publication suivante. Direction artistique « Affiches » : chaque projet est une affiche composée à partir de ses données (numéro, titre, nature, technologies, couleur, et sa capture réelle quand il en a une). L'introduction pose une pile de ces affiches sur le nom en capitales géantes : on les déplace, on les mélange, on les ouvre. Quatre parties en aplats francs (cobalt, papier, encre, vermillon), une seule fonte à largeur variable (Archivo), aucun canvas : HTML et CSS, et un script de 8 Ko (3 Ko compressé) pour le mouvement.
- **Administration** (`/admin/`) : la source unique du contenu. Une section **Site** (accueil, sections et navigation, projets et parcours, à propos, contact, apparence), des fiches projet et expérience réduites à l'essentiel (le reste en « Paramètres avancés »), un **aperçu multi-écrans** du brouillon. Le design s'adapte seul à 0, 1 ou 30 projets, à 1 ou 20 postes, aux textes longs et aux médias de toutes proportions ([docs/systeme-adaptatif.md](docs/systeme-adaptatif.md)). Aussi : projets, expériences, profil, compétences, médias, référencement ; brouillon, aperçu privé, **publication immédiate** (sans build ni commit), sauvegarde et restauration.
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
| `npm run test:e2e` | tests navigateur (Playwright) : 10 résolutions, accessibilité axe, SEO, clavier, historique, sans JS, mouvement réduit, parcours admin, **scénarios de contenu** (A minimal → E vide, 4 écrans) et **critères de réussite** (tout modifier depuis l'admin, publier, vérifier). Si le Chromium de Playwright manque : `CHROMIUM_PATH=/chemin/vers/chromium npm run test:e2e` |

## Documentation

- [docs/art-direction.md](docs/art-direction.md) — pourquoi quitter « Fils », recherche, le concept « Affiches », compositions, couleurs, typographie, évaluation avant / après
- [docs/comparaison/](docs/comparaison/README.md) — captures avant / après (ordinateur, tablettes, téléphone), interactions, scénarios (12 projets, 8 postes, cas limites, vide)
- [docs/systeme-adaptatif.md](docs/systeme-adaptatif.md) — un site 100 % administrable dont la composition tient quel que soit le contenu : règles, scénarios de test, critères de réussite
- [docs/interaction-system.md](docs/interaction-system.md) — pile d'affiches, titres qui s'étirent, articles, bande, mouvement réduit et réglage « Sobre »
- [docs/captures/](docs/captures/) — captures des directions précédentes (« Fils » et avant), gardées pour l'historique
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

Polices Archivo, Bricolage Grotesque, Geist, Newsreader, Instrument Sans et Mona Sans : SIL Open Font License 1.1 (`public/fonts/`).

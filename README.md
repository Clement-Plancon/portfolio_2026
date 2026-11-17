# clementplancon.fr

Portfolio de **Clément Plançon**, ingénieur logiciel et Tech Lead à Paris — avec son administration privée.

- **Site public** : une seule page (`/`) pré-rendue par Astro : couverture, À propos, Projets, Parcours, Compétences, Contact. Direction artistique « Expliquer » (*explicare* : déplier) : la page est un dépliant dont chaque entrée et chaque détail est un pli, en CSS 3D. 4,5 Ko de JavaScript (1,9 Ko compressé), lisible sans, thème clair/sombre automatique.
- **Administration** (`/admin/`) : projets, expériences, profil, compétences, médias, référencement ; brouillon, aperçu réel et publication.
- **Contenus** : fichiers JSON versionnés dans ce dépôt (`src/content/`), écrits par l'administration via l'API GitHub.
- **Hébergement** : Netlify (site statique + une fonction serverless + Netlify Blobs pour les sessions).
- **Authentification** : un seul administrateur, mot de passe vérifié côté serveur (hachage Argon2id), session signée dans un cookie `HttpOnly`, révocable. Aucun service d'identité externe.

## Démarrer

```bash
npm install
npm run dev
```

| Commande | Rôle |
|---|---|
| `npm run dev` | site en local (http://localhost:4321) |
| `npm run build` | build de production dans `dist/` |
| `npm run check` | vérification des types |
| `npm run lint` | lint (Biome) |
| `npm test` | tests unitaires et API (Vitest) |
| `npm run admin:setup` | génère sur votre ordinateur le hachage du mot de passe et le secret de session à copier dans Netlify (Windows, macOS, Linux) |
| `npm run test:e2e` | tests navigateur (Playwright) : 8 largeurs d'écran, accessibilité axe, SEO, clavier, sans JS, mouvement réduit, parcours admin |

## Documentation

- [docs/art-direction.md](docs/art-direction.md) — les trois concepts prototypés (`docs/prototypes/v3/`), le choix « Expliquer » et son système
- [docs/interaction-system.md](docs/interaction-system.md) — plis, états (sans JS, mouvement réduit), clavier, mobile
- [docs/captures/](docs/captures/) — captures des vues principales (desktop, mobile, sombre)
- [docs/ux-review.md](docs/ux-review.md) — revue UX, corrections, limites
- [docs/performance-review.md](docs/performance-review.md) — mesures Lighthouse et choix de performance
- [docs/creative-research.md](docs/creative-research.md) et [docs/design-research.md](docs/design-research.md) — recherche de références
- [docs/architecture.md](docs/architecture.md) — architecture, publication, sécurité, design system
- [docs/netlify-deployment.md](docs/netlify-deployment.md) — mise en ligne, secrets de l'administration, jeton GitHub, variables, vérifications
- [docs/admin-guide.md](docs/admin-guide.md) — mode d'emploi de l'administration, changement de mot de passe, récupération d'accès, rotation des secrets

## Mise en place de l'administration (résumé)

1. Sur votre PC : `npm install`, puis `npm run admin:setup` (le mot de passe ne s'affiche pas pendant la saisie).
2. Dans Netlify, ajoutez `ADMIN_PASSWORD_HASH` et `ADMIN_SESSION_SECRET` (portée *Functions*, *Contains secret values*), ainsi que les variables GitHub de `.env.example`.
3. Redéployez, ouvrez `/admin/` et saisissez votre mot de passe.

Détails : [docs/netlify-deployment.md](docs/netlify-deployment.md). Aucun secret n'est versionné : `.env` est ignoré par Git, et la commande n'écrit rien sur le disque.

## Modifier le contenu sans l'administration

Les fichiers de `src/content/` peuvent aussi être édités à la main : ils sont validés au build (un fichier invalide fait échouer le build et la production garde la version précédente).

## Référencement

`sitemap-index.xml` et `robots.txt` sont générés au build (une seule adresse : la page unique ; les anciennes pages redirigent en 301 vers leur section). Pour Google Search Console / Bing Webmaster Tools : vérifier la propriété par DNS (aucune balise à ajouter au code), puis soumettre `https://clementplancon.fr/sitemap-index.xml`.

## Licences

Polices Mona Sans, Newsreader et Instrument Sans : SIL Open Font License 1.1 (`public/fonts/`).

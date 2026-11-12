# clementplancon.fr

Portfolio de **Clément Plançon**, ingénieur logiciel et Tech Lead à Paris — avec son administration privée.

- **Site public** : Astro, pages statiques pré-rendues, direction artistique « Révélateur » (cyanotypes générés au build), 4 Ko de JavaScript (1,75 Ko compressé), thème clair/sombre automatique.
- **Administration** (`/admin/`) : projets, expériences, articles, profil, compétences, médias, référencement ; brouillon, aperçu réel et publication.
- **Contenus** : fichiers JSON versionnés dans ce dépôt (`src/content/`), écrits par l'administration via l'API GitHub.
- **Hébergement** : Netlify (site statique + une fonction serverless + Netlify Identity).

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
| `npm run test:e2e` | tests navigateur (Playwright) : 8 largeurs d'écran, accessibilité axe, SEO, parcours admin |

## Documentation

- [docs/art-direction.md](docs/art-direction.md) — les trois concepts prototypés, le choix « Révélateur » et son système
- [docs/interaction-system.md](docs/interaction-system.md) — développement des tirages, galerie, transitions
- [docs/captures/](docs/captures/) — captures des vues principales (desktop, mobile, sombre)
- [docs/ux-review.md](docs/ux-review.md) — revue UX, corrections, limites
- [docs/performance-review.md](docs/performance-review.md) — mesures Lighthouse et choix de performance
- [docs/creative-research.md](docs/creative-research.md) et [docs/design-research.md](docs/design-research.md) — recherche de références
- [docs/architecture.md](docs/architecture.md) — architecture, publication, sécurité, design system
- [docs/netlify-deployment.md](docs/netlify-deployment.md) — mise en ligne, Identity, jeton GitHub, variables, vérifications
- [docs/admin-guide.md](docs/admin-guide.md) — mode d'emploi de l'administration

## Modifier le contenu sans l'administration

Les fichiers de `src/content/` peuvent aussi être édités à la main : ils sont validés au build (un fichier invalide fait échouer le build et la production garde la version précédente).

## Référencement

`sitemap-index.xml` et `robots.txt` sont générés au build (les pages masquées et brouillons en sont exclus). Pour Google Search Console / Bing Webmaster Tools : vérifier la propriété par DNS (aucune balise à ajouter au code), puis soumettre `https://clementplancon.fr/sitemap-index.xml`.

## Licences

Polices Newsreader et Instrument Sans : SIL Open Font License 1.1 (`public/fonts/`).

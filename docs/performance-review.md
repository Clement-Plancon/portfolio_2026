# Revue de performance

Mesures faites le 12 novembre 2026 sur le build de production (`npm run build`) servi par `astro preview`, avec Lighthouse 12 en configuration mobile par défaut (Moto G Power simulé, 4G lente simulée, CPU ralenti ×4). Ce sont des mesures de laboratoire en local, pas encore sur Netlify.

## Résultats

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | 98 | 100 | 100 | 100 | 1,5 s | 2,3 s | 0,014 | 0 ms |
| `/projets/` | 98 | 100 | 100 | 100 | 1,5 s | 2,3 s | 0 | 0 ms |
| `/projets/bercy-vert/` | 98 | 100 | 100 | 100 | 1,5 s | 2,3 s | 0 | 0 ms |

Mesures précédentes avec les feuilles de style externes : performance 96 à 98, LCP 2,3 à 2,5 s (`/projets/datametre/` 97, `/parcours/` 98).

Objectifs du cahier des charges : performance ≥ 90, accessibilité / bonnes pratiques / SEO ≥ 95, LCP ≤ 2,5 s, CLS ≤ 0,1. INP n'est pas mesurable en laboratoire ; le seul script public ne fait que des écritures de propriétés CSS, sans calcul lourd.

## Ce qui a été fait

- **CSS dans la page** (`build.inlineStylesheets: 'always'`, la CSP autorise déjà les styles en ligne) : cinq petites feuilles bloquaient le rendu. Effet mesuré : FCP de 1,8 à 1,5 s, LCP de 2,5 à 2,3 s.
- **Polices** auto-hébergées et réduites avec fontTools au latin et à la ponctuation française. Newsreader romain : 105 Ko, avec les axes graisse (300–500) et taille optique (14–72) limités à ce que le design utilise ; il est préchargé. Italique : 55 Ko. Instrument Sans : 28 Ko. `font-display: swap`.
- **Tirages** générés au build en SVG en ligne : pas d'image à télécharger pour les photogrammes.
- **Animation** du développement en opacité seule ; galerie déplacée par `transform` ; aucune animation de propriété de mise en page.
- **JavaScript public** : 4,0 Ko (1,75 Ko compressé), aucune dépendance ajoutée. GSAP, Three.js ou une bibliothèque de défilement n'apportaient rien que CSS, `IntersectionObserver` et View Transitions ne fassent déjà.
- **Captures réelles** : Astro produit WebP et plusieurs largeurs (480, 800, 1200) ; la même URL sert la version cyanotype et la version en couleurs (un seul téléchargement).
- **Poids des pages** : 203 à 239 Ko au total, dont environ 190 Ko de polices (mises en cache d'une page à l'autre).

## Points de vigilance

- Les **filtres SVG** (flou des objets, virage des captures) sont calculés au premier affichage de chaque tirage. Sans ralentissement visible en Chromium, mais non mesuré sur un vrai téléphone d'entrée de gamme.
- Le **grain du papier** est une couche fixe en `mix-blend-mode` : peu coûteux, mais c'est le premier élément à retirer si un appareil montrait des saccades au défilement.
- Le **LCP** dépend surtout du serveur (TTFB simulé 450 ms en local) ; sur le CDN de Netlify il devrait baisser.

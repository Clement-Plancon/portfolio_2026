# Revue de performance — « Affiches »

Mesuré le 21 novembre 2026 sur le build servi par `netlify serve --offline` (fonction SSR réelle), avec Lighthouse 12.8.2 et le Chromium de l'environnement. Pas de compression HTTP en local (Netlify compresse en production) : l'audit « compression du texte » est donc un artefact du serveur local.

## Résultats (page d'accueil, contenu réel)

| | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile (simulé, 4G lente) | 99 | 100 (96 avant correction) | 100 | 100 | 1,8 s | 0 | 0 ms |
| Ordinateur | 100 | 100 | 100 | 100 | 0,4 s | 0,045 | 0 ms |

Correction après la première mesure : les compteurs (« 06 », « 02 ») en vermillon sur papier n'atteignaient que 3,0:1 ; ils passent en vermillon foncé `#C4301A` (4,7:1), vérifié par le test axe de `tests/e2e/public.spec.ts`. Mesure mobile relancée après correction : accessibilité 100.

## Poids

- **Script du site** : 8 Ko (3,1 Ko compressé). Plus de module WebGL (l'ancien moteur faisait 7,6 Ko compressé et n'était chargé que sur les appareils capables).
- **Police** : une seule, Archivo variable, 78 Ko, préchargée (avant : Bricolage 67 Ko + Geist 25 Ko).
- **Page** : 231 Ko transférés au total en local, image de Datametre comprise.
- **DOM** : 886 éléments (les articles des six projets sont dans le HTML, pour l'indexation et le fonctionnement sans script).

## Ce qui rend la page rapide

- Le LCP est du texte HTML (le nom sur ordinateur, la phrase de présentation sur téléphone), peint au premier rendu.
- Aucun canvas, aucune bibliothèque : les affiches sont du HTML et du CSS (container queries), les formes sont des `div` arrondies.
- Une seule boucle `requestAnimationFrame` au défilement, qui ne touche que les projets proches de l'écran ; les animations portent sur `translate`, `rotate`, `scale`, `transform` et `clip-path`.
- Les vidéos ne sont lues qu'à l'écran, jamais dans les petites affiches.

## Limites

- **CLS 0,045 sur ordinateur** : le nom change légèrement de largeur quand Archivo remplace la police de secours. Sous le seuil de 0,1 ; il pourrait être annulé par une police de secours ajustée (`size-adjust`).
- La largeur des titres qui s'étirent provoque une mise en page à chaque image pendant le défilement, limitée aux 1 à 2 titres visibles. Aucune longue tâche mesurée ici ; non vérifié sur un téléphone d'entrée de gamme réel.
- Mesures faites en local, pas sur la prévisualisation Netlify.

# Système d'interaction — « Fils »

Principe : **deux expériences dans la même page**. Le visiteur curieux explore la scène ; le visiteur pressé lit et navigue normalement. Rien n'est caché derrière une interaction, et rien n'attend la scène.

## Architecture : HTML d'abord, dessin ensuite

1. **HTML rendu par le serveur** : tout le contenu, les liens, les articles des projets (dialogues), indexables.
2. **SVG rendu par le serveur** (`ThreadSvg.astro`) : les mêmes fils, dessinés à plat, visibles aussitôt, avec une lumière peinte en CSS.
3. **Scène WebGL2** (`src/scripts/scene/engine.ts`, chargée après l'événement `load`, quand le navigateur est libre) : quand elle a dessiné sa première image, elle remplace les SVG en fondu (`html.gl-on`).

Elle ne démarre pas, et le SVG reste, dans ces cas :
- mouvement réduit demandé ;
- économie de données ;
- moins de 3 Go de mémoire ou moins de 4 cœurs ;
- pas de WebGL2 ;
- **rendu logiciel** (SwiftShader, llvmpipe : pas de GPU) ;
- adresse `?nogl`.

Si elle démarre mais que l'appareil ne suit pas :
- si la médiane des 14 premières images dépasse 45 ms, elle s'arrête ;
- ensuite, si la médiane dépasse 26 ms, la résolution baisse (× 0,75, jusqu'à 0,75 px par pixel CSS), puis la scène s'arrête.

Elle se met en pause quand l'onglet est caché ou qu'un article est ouvert.

## Comment la scène suit la page

- Chaque section porte `data-scene` (`hero`, `project`, `warp`, `gather`) et un élément `[data-stage]` qui donne l'emplacement et la taille du dessin. **Les fils sont attachés au HTML** : ils défilent avec lui, au défilement natif, sans le détourner ni le lisser.
- Entre deux sections, les fils passent d'un état à l'autre point par point, **avec un retard le long du fil** : ils se dénouent depuis un bout au lieu de se transformer d'un coup. Un léger amorti (constante de temps d'environ 110 ms) leur donne du poids.
- Le halo de lumière se déplace vers la scène active et prend la teinte de son projet.

## Les mouvements

| Où | Quoi | Durée, courbe |
|---|---|---|
| Arrivée | Le nom monte, puis le reste apparaît. Seule la transformation est animée, après la première peinture. | 1,2 s, `cubic-bezier(.22,.8,.12,1)` |
| Introduction, pointeur ou doigt | **Le peigne** : sous le pointeur, les fils s'alignent en lignes parallèles. Ils se renouent quand on s'en éloigne. | amorti d'environ 140 ms |
| Défilement | Le nœud se dénoue, se défait et devient le motif du premier projet ; puis chaque fil cède la place au suivant. | continu, lié à la position |
| Projets, pointeur | Les fils s'écartent du pointeur, la capture réelle se redresse. | 1,2 s |
| Ouverture d'un projet | L'article **grandit depuis le bloc de texte** du projet (découpe `clip-path`) ; son motif apparaît en tournant légèrement. | 800 ms, `cubic-bezier(.65,0,.25,1)` |
| Fermeture | L'article se rétracte dans le bloc de texte. | 600 ms |
| Blocs de contenu | Ils montent de 32 px une fois, à l'entrée dans l'écran. | 950 ms |
| Sans WebGL, avec mouvement | Les fils SVG se dessinent (tracé progressif). | 2,6 s |

## Navigation

- **Toujours visible** :
  - en haut sur ordinateur et tablette (Projets, Parcours, À propos, Contact, ce dernier en bouton) ;
  - **en bas sur téléphone**, sous le pouce, avec des cibles de 44 px au moins (vérifié par test).
- **Repère de position** : l'acte en cours et le projet à l'écran (« 02 — Exploration · Datametre ») dans l'en-tête, dès 1200 px. Sur téléphone, il s'affiche en petit à côté du nom.
- **Galerie** :
  - un index des six projets sous le titre, pour ouvrir un projet directement ;
  - sur ordinateur, un **rail** à droite (six points teints) qui montre le projet à l'écran et y mène.
- **Articles** :
  - ce sont des liens réels `#projet-…`, partageables, et le dialogue est modal ;
  - précédent / suivant, « Projet suivant » en fin d'article ;
  - Échap ferme et rend le focus au titre du projet ; le bouton **Retour** du navigateur ferme aussi ;
  - une adresse `#projet-…` ouvre le projet à l'arrivée.
- **Clavier** : lien d'évitement, focus visible (braise), ordre de tabulation naturel. La scène est `aria-hidden`.

## Responsive

| Format | Composition |
|---|---|
| Ordinateur (1280–1920) | Introduction : texte à gauche, nœud à droite, les bouts libres s'effacent derrière le texte. Projets : texte et scène alternent à gauche et à droite. Rail. |
| Tablette paysage (1024 × 768) | Comme l'ordinateur, sans rail ; peigne au toucher. |
| Tablette portrait (768–820) | Le nœud en bandeau au-dessus du nom ; chaque projet a sa scène au-dessus de son texte. |
| Téléphone (320–430) | Le nœud au-dessus du nom. Chaque projet : motif carré, puis texte, puis boutons pleine largeur. Barre de navigation en bas. Résolution du rendu plafonnée à 1,5. Fils de fond plus fins et plus discrets. |

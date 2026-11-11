# Système d'interaction

Principe : **le site est immobile, sauf quand une information change**. Comme un panneau d'affichage : on ne bouge que pour annoncer quelque chose. Aucun fondu au défilement, aucune animation décorative.

## 1. Le tableau à palettes (interaction signature)

**Où** : accueil (tous les projets) et page Projets (un tableau par catégorie).

**Ce qui se passe** : quand le tableau entre à l'écran, chaque lettre des noms de projets fait défiler des caractères avant de se fixer sur la bonne, de gauche à droite et avec une légère irrégularité, comme un tableau mécanique.

**Pourquoi c'est utile et pas seulement décoratif** :
- il annonce « voici l'information principale » : les projets ;
- il installe l'identité dès la première seconde, sans écran d'entrée ni chargement ;
- c'est le même geste qu'un vrai tableau d'information qui se met à jour, donc il se comprend sans explication.

**Réglages et garde-fous** (`src/scripts/flap.ts`, `src/scripts/site.ts`) :
- une seule boucle `requestAnimationFrame` pour toutes les cases, une mise à jour toutes les 55 ms ; l'animation dure de 0,5 à 1,8 s selon la longueur du nom ;
- cases à largeur fixe : le texte change sans décaler la mise en page (CLS mesuré à 0) ;
- **une fois par page et par visite** (`sessionStorage`) : revenir à l'accueil depuis un projet ne rejoue pas l'animation ;
- **désactivée** avec `prefers-reduced-motion`, sur les appareils à 2 cœurs ou moins et en mode « économie de données » ;
- **sans JavaScript**, le tableau s'affiche directement avec les bons noms (les cases sont rendues côté serveur).

**Accessibilité** : le vrai nom du projet est un titre `h3` masqué visuellement ; les cases animées sont `aria-hidden`. Un lecteur d'écran lit « Bercy Vert », jamais « B E R C Y ». Un test Playwright le vérifie.

## 2. La bande d'information

**Où** : sous le tableau, sur grand écran avec souris.

**Ce qui se passe** : survoler ou focaliser une ligne affiche le résumé du projet dans la bande, avec l'indice de ligne coloré ; la bande bascule (rotation de 70° sur 180 ms) à chaque changement.

**Pourquoi** : le résumé est accessible sans alourdir chaque ligne du tableau.

**Équivalents** :
- **Clavier** : le focus d'une ligne met la bande à jour, comme le survol.
- **Tactile et écrans < 1024 px** : pas de survol possible, donc pas de bande. Chaque ligne porte son propre résumé (2 lignes).
- **Lecteur d'écran** : la bande est décorative (`aria-hidden`) ; le résumé est dans la page projet et dans la ligne sur mobile.

## 3. De la ligne à la page projet

**Ce qui se passe** : en cliquant une ligne, l'indice de couleur (BV, RI…) **voyage** jusqu'à l'en-tête de la page projet, où il devient le grand indice du panneau de ligne. Le reste de la page fait un fondu court.

**Technique** : View Transitions natives entre documents (`@view-transition { navigation: auto }`) et un `view-transition-name` partagé (`line-<id>`). Aucune librairie, aucun JavaScript. Les navigateurs qui ne les gèrent pas changent simplement de page.

**Pourquoi** : on garde le repère visuel (« je suis sur la ligne BV ») d'une page à l'autre ; c'est la transition qui relie l'index aux détails.

## 4. Le plan de ligne (page projet)

**Ce qui se passe** : les sections de la page (Contexte, Contributions, Technologies…) sont les arrêts d'une ligne dans la couleur du projet. L'arrêt en cours de lecture passe en jaune (« vous êtes ici »). Cliquer un arrêt y amène.

**Desktop** : colonne collée à gauche, verticale.
**Mobile** : rangée horizontale collée en haut, défilable du doigt ; l'arrêt actif se recentre automatiquement.
**Accessibilité** : c'est une `nav` nommée « Sections de la page », avec des liens d'ancre ; l'arrêt actif porte `aria-current="location"`.

## 5. « Vous êtes ici »

La page courante est toujours le panneau jaune de la navigation (en haut sur desktop, dans la barre du bas sur mobile), avec `aria-current="page"`. C'est le seul usage du jaune dans la navigation : on sait toujours où on est.

## 6. La flèche

Une seule marque d'action : la flèche jaune dans un carré sombre. Au survol ou au focus, elle avance de 4 px. Partout où il y a une flèche, on peut cliquer ; partout où on peut aller ailleurs, il y a une flèche.

## 7. Le panneau de sortie

Chaque page se termine sur le panneau jaune « Écrire à Clément » : la sortie, au sens signalétique. Bouton « Copier l'adresse » avec confirmation visible et annoncée (`role="status"`).

## Durées et courbe

| Usage | Durée |
|---|---|
| Couleur, survol | 140 ms |
| Flèches, plaques de navigation | 260 ms |
| Bande d'information | 180 ms |
| Transition de page (indice) | 420 ms |
| Une case de palette | 55 ms par étape |

Courbe unique : `cubic-bezier(0.2, 0.7, 0.2, 1)` (départ franc, arrivée douce).

## Focus

Anneau jaune de 3 px doublé d'un halo sombre de 5 px : visible sur fond clair, sur panneau noir et sur panneau jaune.

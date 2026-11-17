# Système d'interaction

Tout part d'une règle : **le contenu est déjà là, déplié**. Le HTML envoyé par le serveur contient chaque section et chaque détail de projet, ouverts. Le script (`src/scripts/fold.ts`, 4,5 Ko) replie d'abord ce qui doit l'être, puis anime les dépliages. S'il ne se charge pas, rien ne manque.

## États

| Situation | Rendu |
|---|---|
| Sans JavaScript | Tout est à plat. Les six détails de projets sont ouverts, en une colonne. Le menu mobile n'est pas replié (la navigation reste visible). |
| `prefers-reduced-motion: reduce` | Tout est à plat dès l'arrivée, et la bande de couverture n'est pas pliée. Les détails s'ouvrent et se ferment sans animation. |
| Mouvement autorisé | Les plis s'ouvrent une seule fois, à l'entrée dans l'écran (IntersectionObserver). La bande de couverture suit le défilement. |

Les classes `html.js` et `html.motion` portent ces états. Aucun contenu n'est masqué par défaut dans le CSS.

## Gestes

| Élément | Geste | Détail |
|---|---|---|
| Titres de section | Basculent de −62° vers l'avant | Une fois, à l'entrée dans l'écran. |
| Bande de couverture | Accordéon dont l'angle va de 70° à 0° sur la première moitié d'écran de défilement | Calcul en `requestAnimationFrame`, sans bloquer le défilement. Légère inclinaison sous un pointeur fin (souris), aucune au doigt. Chaque feuille ouvre son projet. La bande est décorative pour les lecteurs d'écran (`aria-hidden`, hors tabulation) : les mêmes projets sont accessibles dans la carte. |
| Volets de projets | Pli d'entrée par colonne | Colonne 1 sur l'axe horizontal ; colonnes 2 et 3 comme une page, avec un décalage. En mobile, sur l'axe horizontal. |
| Détail d'un projet | Se déplie sous sa rangée (hauteur de 0 à auto et rotation de −86° à 0°, 0,9 s) | Un seul ouvert à la fois. L'adresse devient `/#projet-…` (`history.replaceState`), donc un lien partagé ouvre ce projet. Fin du détail : « ↑ Replier » (rend le focus au volet) et « Volet suivant : … → ». |
| Triptyque du parcours | Les volets latéraux s'ouvrent comme des portes (±68°) | En mobile, les trois volets se déplient l'un sous l'autre. |
| Principes (À propos) | Accordéon de feuilles claires | Horizontal en desktop, vertical en mobile. |
| Carte de contact | Le recto vermillon se retourne (−178° → 0°) et découvre le verso | Bouton « Copier l'adresse » avec message `role="status"`. |
| Navigation | La section active est soulignée, avec un coin vermillon | En mobile, le bouton « Sommaire » déplie la navigation (−92° → 0°). Échap la ferme et rend le focus. |

## Clavier et lecteurs d'écran

- Le titre de chaque volet est un `<button aria-expanded aria-controls>` dont le nom ne change pas à l'ouverture. La zone cliquable couvre tout le volet (pseudo-élément), mais un seul élément reçoit le focus.
- Les détails fermés sont `inert` : ils sont hors tabulation et hors arbre d'accessibilité, tout en restant dans le HTML pour l'indexation.
- Le lien d'évitement mène à `#contenu`. Les ancres de section sont stables : `#a-propos`, `#projets`, `#parcours`, `#competences`, `#contact`.
- Dans la couverture, la phrase latine est balisée `lang="la"`.

## Mobile

Rien ne dépend du survol. Le coin corné des volets apparaît aussi au focus et à l'ouverture, et l'indication « Déplier / Replier » est toujours visible. Tous les accordéons deviennent verticaux sous 48 rem, parce qu'un pli horizontal sur 390 px rendrait les feuilles illisibles. Les boutons (déplier, replier, copier, sommaire) font au moins 44 px ; un volet entier est cliquable.

## Durées

- 0,9 s (`--dur-3`) pour les plis et l'ouverture d'un détail, 1,3 s pour les accordéons, avec une courbe `--ease-fold` (`cubic-bezier(.32,.72,0,1)`) qui ralentit fortement à la fin, comme du papier qui retombe.
- 180 et 420 ms (`--dur-1`, `--dur-2`) pour les retours d'état (survol, focus, coin corné).

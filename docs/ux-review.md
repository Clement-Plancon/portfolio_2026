# Revue UX

Revue menée le 12 novembre 2026 sur le build de production servi localement. Captures dans Chromium (Playwright) à 320, 390, 768, 1024, 1440 et 1920 px, en paysage mobile (844 × 390), à 720 × 450 (équivalent d'un zoom 200 % sur 1440 × 900) et en mode sombre. Les 8 largeurs demandées (320 à 1920) sont aussi vérifiées automatiquement (débordement horizontal, navigation atteignable). Les captures finales sont dans `docs/captures/`.

Ce document distingue ce qui a été **vérifié automatiquement**, ce qui a été **examiné à l'œil sur captures**, et ce qui **n'a pas été testé** : aucun test n'a été mené avec de vraies personnes.

## Boucle de critique

### Prototypes (avant de choisir la direction)
| Prototype | Défauts observés sur captures | Correction |
|---|---|---|
| B Révélateur | Bord « au pinceau » trop haché (effet glitch) ; tirages plus hauts que l'écran ; capture Datametre délavée ; en-tête mélangé aux tirages | Bruit plus doux, tirages dimensionnés sur la hauteur, capture inversée (texte blanc sur bleu), en-tête sur fond papier |
| A Fil rouge | Le fil se dessinait en retard sur le défilement : la figure du premier projet était vide | Calcul du tracé selon la position verticale réelle du chemin |
| C Récit | Passages cliquables cassant la ligne sur mobile ; fiche dépliée hors champ | Affichage en ligne et défilement vers la fiche. Le défaut de fond reste : un bouton dans un paragraphe ne se comporte pas comme du texte |

### Site (direction retenue)
| Tour | Défaut observé | Correction |
|---|---|---|
| 1 | Bords d'émulsion en dents de scie (papier déchiré plutôt que pinceau) | 90 points par côté, bruit lissé, fines « fibres » de pinceau |
| 1 | Fougères régulières comme des sapins | Folioles alternées, longueurs et angles variés, frondes qui divergent |
| 1 | Galerie épinglée : le titre « Tirages » passait sous l'en-tête | Hauteur des tirages calculée pour que titre, tirage et légende tiennent dans l'écran |
| 1 | Espace parasite avant les virgules (« Paris , Ministère ») | Organisation et rattachement assemblés en une seule chaîne |
| 2 | Capture Datametre recadrée au centre : le titre était coupé (« …prendre la ») | Cadrage en haut à gauche, là où les interfaces placent leur titre |
| 2 | Sur mobile, le tirage arrivait après tout le texte de la page projet | Le tirage passe en tête (c'est l'image que le visiteur vient de toucher) |
| 2 | Page 404 avec un rectangle plat | Même bord brossé que les tirages |
| 2 | Image de partage : fougères en sapin, contenu décentré | Nouvelles frondes, centrage vertical |

## Scénarios d'usage (vérifiés en navigateur automatisé, pas par des personnes)

**Recruteur**
- Comprendre le poste : le nom et le poste sont la première ligne du titre principal ; « En poste » et l'organisation sont au premier écran (vérifié en captures et par le test « short screens »).
- Trouver les projets : lien « Voir les projets ↓ » au premier écran, galerie au deuxième, entrée « Projets » dans la navigation.
- Lire une réalisation : un tirage ouvre sa page (test « gallery … keyboard opens a project ») ; sommaire, contexte, contributions, technologies.
- Consulter l'expérience : version courte sur l'accueil, page Parcours complète.
- Trouver le contact : bloc contact en bas de chaque page, entrée « Contact » dans la navigation, bouton « Copier l'adresse ».

**Visiteur curieux**
- Explorer : la galerie avance avec le défilement ; chaque tirage réagit au survol ; la page projet propose le tirage suivant.
- Revenir en arrière : « ← Tous les projets » en haut de chaque projet ; le bouton Précédent du navigateur fonctionne (pages statiques, pas de routage JavaScript).
- Savoir où il est : page courante en bleu avec un point (desktop) ou inversée (mobile) ; sommaire qui suit la lecture ; compteur « 02 / 06 » dans la galerie.

**Téléphone**
- Tout le contenu est présent (aucun contenu réservé au desktop ; test sans débordement de 320 à 430 px).
- Une main : navigation en bas d'écran ; galerie au balayage.
- Pas de dépendance au survol : les légendes sont toujours visibles ; les couleurs réelles d'une capture s'obtiennent par un bouton.

## Accessibilité
- axe (WCAG 2.1 AA) sans violation sur 7 pages en clair et 4 en sombre.
- Un seul `h1` par page ; titres hiérarchisés ; liens explicites.
- Contraste : encre `#14203f` sur papier `#f1ede3` ≈ 13,7:1 ; texte secondaire `#47506a` ≈ 6,8:1 ; liens et italiques `#1c3e8c` ≈ 8,5:1 ; papier sur bleu de Prusse ≈ 12:1 ; en sombre, texte secondaire ≈ 9,4:1.
- Focus visible partout (contour bleu ; sur les tirages, contour autour du papier).
- Mouvement réduit : voir [interaction-system.md](interaction-system.md).

## Limites connues
- **Captures réelles** : seul Datametre en a une. Les cinq autres projets n'ont que des photogrammes, présentés comme tels. La qualité perçue des pages projet dépendra des captures ajoutées dans l'administration.
- **Contenu des projets** : plusieurs projets n'ont qu'un contexte et une liste de technologies ; leurs pages sont courtes.
- **Pas de test utilisateur réel**, pas de test avec un vrai lecteur d'écran (NVDA, VoiceOver).
- **Safari** n'a pas été testé (Chromium uniquement). Les filtres SVG appliqués aux images et les View Transitions entre documents s'y comportent différemment : les tirages et la navigation restent fonctionnels, mais le rendu exact n'a pas été vérifié.
- **Netlify** : rien n'a été testé sur le déploiement réel (Identity, GitHub, aperçu de branche).

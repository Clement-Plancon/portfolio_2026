# Système adaptatif — un site administrable qui reste beau

Le site est un produit éditorial : tout ce qu'il affiche vient de l'administration, et la qualité de la composition ne dépend ni du nombre de projets, ni du nombre de postes, ni de la longueur des textes, ni de la présence d'une image. Ce document dit **comment**, et **comment c'est vérifié**.

## 1. Une seule source : l'administration

| Contenu | Stockage (Netlify Blobs) | Édité dans |
|---|---|---|
| Nom, titre, présentation, biographie, photo, CV, principes, e-mail, liens | `profile` | Site → Accueil, À propos, Contact |
| Accueil (ligne au-dessus du nom, boutons, image ou vidéo, invitation), sections (ordre, visibilité, nom dans le menu, titre, introduction), sélection des projets, chapitres du parcours, textes du contact, ambiance, scène | `site` (nouveau) | Site → tous les onglets |
| Projets, expériences, compétences, référencement, médias | inchangés | Projets, Expériences, Compétences, Référencement, Médias |

Aucun texte personnel n'est écrit dans les composants publics. Ils ne contiennent que des **valeurs de secours** quand un champ est vide : « Explorer les projets », « Tirons le fil ensemble. », etc. Chacune est affichée sous son champ dans l'administration (« Vide : … »).

**Compatibilité avec le contenu publié** :
- Le bloc `site` est entièrement facultatif. Le contenu déjà publié dans Netlify Blobs ne l'a pas, et la page le rend alors exactement comme avant (testé : `tests/unit/site-resolve.test.ts`).
- Les nouveaux champs des projets (`cover.video`, `cover.variant`, `cover.motif`) et des expériences (`featured`) sont facultatifs, avec une valeur par défaut. Aucune migration n'est nécessaire, rien n'est réécrit ni supprimé.
- Le bloc `site` est créé à la première sauvegarde d'un onglet de **Site**.

## 2. Les règles de composition (`src/lib/site.ts`)

Une seule fonction, `resolveSite`, décide de ce que la page montre. Aucun composant ne compte les éléments pour son propre compte.

| Situation | Règle |
|---|---|
| **Projets** | Les N premiers projets visibles (6 par défaut), ou seulement les projets mis en avant (N au plus), ont chacun leur écran. Les autres visibles passent dans **« Autres réalisations »**, une grille de cartes qui s'ouvrent sur le même article. La page ne s'allonge pas avec le nombre de projets. Si aucun projet n'est mis en avant alors que le réglage l'exige, tous les projets sont mis en scène, et l'administration le signale. |
| **Aucun projet** | La section, son entrée de menu et le bouton de l'accueil qui y menait disparaissent. |
| **Un seul projet** | Pas de rail ni d'index : un seul écran. |
| **Fils** | Le nombre de fils de la scène va de 3 à 8, quel que soit le nombre de projets. Un projet dessine son motif avec le fil n° (i modulo ce nombre), **teint de sa propre couleur**. La scène n'a aucun cas particulier par projet : un même moteur, sept motifs génériques. |
| **Parcours** | Les postes actuels, puis ceux mis en avant, sont racontés en entier (3 par défaut). Les autres sont dans « Tout le parcours », une liste qui s'ouvre. Avec 1 poste ou 20, la section garde sa longueur. |
| **Sections** | Ordre, visibilité et noms viennent de l'administration ; le contact reste en dernier. Une section masquée ou vide disparaît de la page et du menu, sans laisser de trou. Les numéros d'actes (01, 02…) sont recalculés ; les compétences qui suivent le parcours partagent son acte. |
| **Compétences, principes** | Grilles `auto-fill` / `auto-fit` : de 1 à 12 groupes, de 1 à 8 principes, sans colonne vide. |

## 3. Les règles des composants

- **Titres longs** :
  - corps réduit au-delà de 22 caractères, puis de 40 ;
  - coupure entre les mots seulement (pas de césure automatique dans les grands titres) ;
  - le repère de position et les noms du menu s'arrêtent sur des points de suspension plutôt que de déborder.
- **Textes longs** :
  - une description de projet est limitée à 7 lignes sur l'écran du projet et à 3 sur une carte ; le texte complet est dans l'article ;
  - au-delà de 8 technologies, un « +N » renvoie à l'article ;
  - les compteurs de l'administration indiquent les longueurs conseillées.
- **Médias** (`Media.astro`) :
  - l'orientation (portrait, paysage, carré) est déduite des dimensions enregistrées à l'envoi ;
  - un média portrait est placé plus étroit, un média carré plus petit ;
  - jamais de déformation (rapport de proportions conservé, `object-fit` maîtrisé) ;
  - la vidéo est muette, en boucle, avec un bouton pause ; elle n'est jouée qu'à l'écran et pas du tout si le mouvement est réduit, et une image d'aperçu peut être choisie.
- **Absences** :
  - **sans image**, le projet garde son fil et son motif ;
  - **sans lien**, sans dates, sans nature ou sans organisation, la ligne correspondante n'est pas rendue (pas de séparateur orphelin) ;
  - **sans date de fin**, le poste est « aujourd'hui ».
- **Accents et caractères** : la police d'affichage (Bricolage Grotesque) contient le latin étendu (é, è, ç, œ, Œ…), vérifié dans le scénario D.

## 4. Scénarios de contenu

Des jeux de données **fictifs et isolés** (`src/scenarios/data.ts`) rendent la page avec les vrais composants, à l'adresse `/__scenarios/<a|b|c|d|e>`.

**Isolement** :
- Cette adresse n'existe que dans les builds faits avec `CONTENT_SCENARIOS=1`, c'est-à-dire les tests navigateur (`playwright.config.ts`).
- Un build de production ne contient ni la route ni les données (vérifié par recherche dans le build).
- Rien n'est écrit dans `src/content` ni dans Netlify Blobs.
- Les médias de test (`tests/fixtures/scenarios/media/`) portent la mention « Image de test » ou « Vidéo de test ».

| Scénario | Contenu |
|---|---|
| **A — minimal** | 1 projet sans média ni lien, 1 poste actuel, aucun principe |
| **B — normal** | 4 projets (image paysage, portrait, carrée, aucune), 3 postes, un lien |
| **C — enrichi** | 12 projets dont 5 mis en avant (5 écrans + 7 cartes), 8 postes (3 chapitres + 5 dans la liste), descriptions longues, 10 technologies, vidéos paysage et portrait, galerie |
| **D — cas limites** | Titre de 104 caractères, accents et guillemets, projet sans image, sans lien, sans dates, sans nature ; projet masqué ; poste actuel sans date de fin, intitulé de 90 caractères ; compétences vides ; sections réordonnées et renommées ; titre de contact long ; vidéo à l'accueil ; ambiance « Nuit » |
| **E — vide** | Aucun projet, aucun poste, aucune compétence |

**Vérification automatique** (`tests/e2e/scenarios.spec.ts`) : chaque scénario à 390 × 844, 820 × 1180, 1024 × 768 et 1440 × 900, soit 20 cas. Pour chacun :
- pas de défilement horizontal ;
- pas d'erreur de script ;
- le menu liste exactement les sections visibles, avec leurs noms ;
- aucun titre, texte, bouton ou pastille ne déborde de son bloc ;
- aucune image ni vidéo n'est déformée ;
- chaque projet ouvre et ferme son article, sans débordement.

**Revue visuelle** : captures examinées dans [`captures/scenarios/`](captures/scenarios/). Défauts trouvés et corrigés :

| Défaut | Correction |
|---|---|
| Le repère de position débordait sur le menu avec un titre de projet très long. | Largeur bornée, points de suspension. |
| La césure automatique coupait « pilo-tage » dans un grand titre. | Coupure entre les mots seulement. |
| Le motif par défaut était légendé « Motif — motif par défaut ». | « Nœud — relier ». |
| Le bandeau de l'aperçu masquait la barre de navigation sur téléphone. | Posé au-dessus de la barre. |

## 5. Les critères de réussite, testés

`tests/e2e/criteria.spec.ts` fait, dans l'interface de l'administration, ce qu'une personne ferait :
1. se connecter ;
2. modifier des textes visibles ;
3. remplacer le média de l'accueil ;
4. ajouter un projet (six champs) ;
5. le mettre en avant ;
6. le réordonner ;
7. ajouter un poste ;
8. modifier le poste actuel ;
9. masquer une section et en renommer une autre ;
10. prévisualiser (avec les tailles d'écran) ;
11. publier ;
12. vérifier la page publique sur téléphone, tablette et ordinateur.

Ce test s'exécute après tous les autres (il modifie le contenu publié) et remet ensuite le contenu dans son état initial (sauvegarde, restauration, publication).

## 6. Limites

- **Variantes visuelles** : elles sont contrôlées, pas libres. Trois ambiances, sept motifs, deux dispositions et six teintes. C'est voulu : une liberté totale (couleurs, polices, tailles) permettrait de dégrader la direction artistique depuis l'administration.
- **Ordre des sections** : l'accueil reste en premier et le contact en dernier, pour garder le récit.
- **Longueurs** : les longueurs conseillées ne sont pas imposées. Un texte très long reste lisible (coupure, réduction, article complet), mais la composition est pensée pour les longueurs conseillées.
- **Aperçu multi-écrans** : il simule la taille de l'écran, pas l'appareil (toucher, densité de pixels, performances).
- **Navigateurs** : la vérification a été faite dans Chromium seulement.

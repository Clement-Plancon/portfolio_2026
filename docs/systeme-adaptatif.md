# Système adaptatif — un site administrable qui reste beau

Le site est un produit éditorial : tout ce qu'il affiche vient de l'administration, et la qualité de la composition ne dépend ni du nombre de projets, ni du nombre de postes, ni de la longueur des textes, ni de la présence d'une image. Ce document dit **comment**, et **comment c'est vérifié**.

## 1. Une seule source : l'administration

| Contenu | Stockage (Netlify Blobs) | Édité dans |
|---|---|---|
| Nom, titre, présentation, biographie, photo, CV, principes, e-mail, liens | `profile` | Site → Accueil, À propos, Contact |
| Accueil (ligne au-dessus du nom, boutons, image ou vidéo, invitation), sections (ordre, visibilité, nom dans le menu, titre, introduction), sélection des projets, chapitres du parcours, textes du contact, couleur de l'accueil, mouvement | `site` (nouveau) | Site → tous les onglets |
| Projets, expériences, compétences, référencement, médias | inchangés | Projets, Expériences, Compétences, Référencement, Médias |

Aucun texte personnel n'est écrit dans les composants publics. Ils ne contiennent que des **valeurs de secours** quand un champ est vide : « Voir les projets », « Travaillons ensemble. », etc. Chacune est affichée sous son champ dans l'administration (« Vide : … »).

**Compatibilité avec le contenu publié** :
- Le bloc `site` est entièrement facultatif. Le contenu déjà publié dans Netlify Blobs ne l'a pas, et la page le rend alors exactement comme avant (testé : `tests/unit/site-resolve.test.ts`).
- Les nouveaux champs des projets (`cover.video`, `cover.variant`, `cover.poster`) et des expériences (`featured`) sont facultatifs, avec une valeur par défaut. `cover.motif` (direction « Fils ») reste accepté et n'est plus affiché. Aucune migration n'est nécessaire, rien n'est réécrit ni supprimé.
- Les valeurs d'apparence gardent leurs noms d'origine : `ambiance` `braise` / `nuit` / `foret` = accueil cobalt / encre / vert ; `scene` `auto` / `svg` = mouvement complet / sobre.
- Le bloc `site` est créé à la première sauvegarde d'un onglet de **Site**.

## 2. Les règles de composition (`src/lib/site.ts`)

Une seule fonction, `resolveSite`, décide de ce que la page montre. Aucun composant ne compte les éléments pour son propre compte.

| Situation | Règle |
|---|---|
| **Projets** | Par défaut, les projets mis en avant (4 au plus) sont présentés en grand ; ou bien les N premiers projets visibles. Les autres visibles passent dans **« Autres réalisations »**, une bande horizontale de petites affiches qui s'ouvrent sur le même article : la page ne s'allonge pas avec le nombre de projets. Si aucun projet n'est mis en avant, les premiers projets visibles sont présentés en grand, et l'administration le signale. |
| **Aucun projet** | La section, son entrée de menu et le bouton de l'accueil qui y menait disparaissent. |
| **Un seul projet** | Une seule affiche dans la pile (pas de bouton « Mélanger »), pas de précédent / suivant dans l'article. Aucun projet : une affiche faite du titre professionnel tient la pile. |
| **Affiches** | La pile de l'accueil montre les projets en grand (5 au plus). Chaque affiche est composée de ses données (`src/lib/poster.ts`) : image ou vidéo s'il y en a, sinon numéro, titre ou grille. Aucun cas particulier par projet. |
| **Parcours** | Raconté dans « À propos », en lignes (années, poste, organisation). Les postes actuels, puis ceux mis en avant, sont listés d'emblée (3 par défaut) ; les autres sont dans « Tout le parcours », qui s'ouvre. Avec 1 poste ou 20, la partie garde sa longueur. |
| **Sections** | Ordre, visibilité et noms viennent de l'administration ; le contact reste en dernier. Le parcours et les compétences sont racontés dans « À propos » (avec leur titre et leur phrase) ; ils n'ont leur propre partie que si « À propos » est masqué ou vide. Une section masquée ou vide disparaît de la page et du menu, sans laisser de trou ; les numéros du menu sont recalculés. |
| **Compétences, principes** | Les trois premiers groupes de compétences sont les domaines d'expertise (1 à 3 colonnes) ; les suivants sont dans « Toutes les compétences ». Les principes sont repliés avec la biographie (« En savoir plus »). |

## 3. Les règles des composants

- **Titres longs** :
  - la taille des grands titres est calculée depuis leur texte : le mot le plus long tient dans la largeur, un titre long reste sur environ trois lignes (`displaySize`, `lineSize`) ;
  - coupure entre les mots seulement (pas de césure automatique dans les grands titres) ;
  - les noms du menu s'arrêtent sur des points de suspension plutôt que de déborder.
- **Textes longs** :
  - la description courte s'affiche en entier à côté de l'affiche ; le détail est dans l'article ;
  - une affiche montre trois technologies au plus ; la liste complète est dans l'article ;
  - les compteurs de l'administration indiquent les longueurs conseillées.
- **Médias** (`Media.astro`) :
  - l'orientation (portrait, paysage, carré) est déduite des dimensions enregistrées à l'envoi ;
  - un média portrait est placé plus étroit, un média carré plus petit ;
  - jamais de déformation (rapport de proportions conservé, `object-fit` maîtrisé) ;
  - la vidéo est muette, en boucle, avec un bouton pause ; elle n'est jouée qu'à l'écran et pas du tout si le mouvement est réduit, et une image d'aperçu peut être choisie.
- **Absences** :
  - **sans image**, l'affiche est typographique ou géométrique ;
  - **sans lien**, sans dates, sans nature ou sans organisation, la ligne correspondante n'est pas rendue (pas de séparateur orphelin) ;
  - **sans date de fin**, le poste est « aujourd'hui ».
- **Accents et caractères** : la police (Archivo) contient le latin étendu (é, è, ç, œ, Œ…), vérifié dans le scénario D.

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
| **C — enrichi** | 12 projets dont 5 mis en avant, maximum 4 (4 en grand + 8 dans la bande), 8 postes (3 listés + 5 dans « Tout le parcours »), descriptions longues, 10 technologies, vidéos paysage et portrait, galerie |
| **D — cas limites** | Titre de 104 caractères, accents et guillemets, projet sans image, sans lien, sans dates, sans nature ; projet masqué ; poste actuel sans date de fin, intitulé de 90 caractères ; compétences vides ; sections réordonnées et renommées ; titre de contact long ; vidéo à l'accueil ; accueil « Encre » ; parcours replié dans « À propos » |
| **E — vide** | Aucun projet, aucun poste, aucune compétence |

**Vérification automatique** (`tests/e2e/scenarios.spec.ts`) : chaque scénario à 390 × 844, 820 × 1180, 1024 × 768 et 1440 × 900, soit 20 cas. Pour chacun :
- pas de défilement horizontal ;
- pas d'erreur de script ;
- le menu liste exactement les parties visibles, avec leurs noms ;
- le nombre de projets en grand et dans la bande est celui attendu ;
- le nom, les grands titres et l'adresse e-mail ne sortent jamais de l'écran ;
- aucun titre, texte, bouton ou pastille ne déborde de son bloc ;
- aucune image ni vidéo n'est déformée ;
- chaque projet ouvre et ferme son article, sans débordement.

**Revue visuelle** (direction « Affiches ») : captures examinées dans [`comparaison/apres/scenarios/`](comparaison/apres/scenarios/). Défauts trouvés et corrigés :

| Défaut | Correction |
|---|---|
| « PROJETS » et « TRAVAILLONS » coupés en fin de mot sur téléphone. | Taille calculée depuis le mot le plus long (`displaySize`). |
| « Ma démarche, en quelques mots » occupait tout un écran (5 lignes géantes). | Un titre long reste sur environ trois lignes. |
| Les affiches « titre » laissaient un grand aplat vide au-dessus d'un titre long. | Le titre est répété en contour jusqu'à remplir l'affiche ; les mots courts sont groupés. |
| Le nom dépassait la marge à 1440 px (« CLÉMENT », lettres larges). | Largeur moyenne des capitales corrigée. |
| Le bouton « Mélanger » chevauchait le titre professionnel sur téléphone. | Marge sous la pile agrandie. |
| Accent du É coupé en haut des affiches « titre ». | Marge intérieure en haut. |
| Sur les petites affiches, une image portrait recouvrait le titre (styles de `Media` plus spécifiques que ceux de l'affiche). | Styles de base de `Media` sans spécificité (`:where`). |
| Compteurs en vermillon sur papier sous le contraste AA (axe, Lighthouse). | Vermillon foncé `#C4301A` pour les petits textes sur papier. |

Revue de la direction précédente : [`captures/scenarios/`](captures/scenarios/).

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

- **Variantes visuelles** : elles sont contrôlées, pas libres. Trois couleurs d'accueil, deux niveaux de mouvement, trois compositions d'affiche, deux dispositions et six couleurs de projet. C'est voulu : une liberté totale (couleurs, polices, tailles) permettrait de dégrader la direction artistique depuis l'administration.
- **Ordre des sections** : l'accueil reste en premier et le contact en dernier, pour garder le récit. Le parcours et les compétences sont dans « À propos » : leur position dans la liste n'a d'effet que si « À propos » est masqué.
- **Longueurs** : les longueurs conseillées ne sont pas imposées. Un texte très long reste lisible (coupure, réduction, article complet), mais la composition est pensée pour les longueurs conseillées.
- **Aperçu multi-écrans** : il simule la taille de l'écran, pas l'appareil (toucher, densité de pixels, performances).
- **Navigateurs** : la vérification a été faite dans Chromium seulement.

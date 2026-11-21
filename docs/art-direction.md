# Direction artistique — « Fils »

Novembre 2026. Remplace « Sommaire » (éditorial, commit `0ffca51`), qui remplaçait « Expliquer » (le dépliant). Le contenu, le CMS, les schémas et la sécurité ne changent pas.

## 1. Pourquoi les versions précédentes ne suffisaient pas

| Version | Ce qui manquait |
|---|---|
| Tableau de bord | Noir et jaune agressifs, projets en tableaux, monospace, aucune mise en scène. |
| « Expliquer » | La métaphore (le pli) dictait tout ; les projets n'étaient que des aplats de couleur. |
| « Sommaire » | Élégant mais trop minimaliste : fond uni, phrase géante, beaucoup de vide, des projets qui restaient un index. On aurait dit un modèle éditorial haut de gamme, pas une expérience. |

## 2. Recherche (observations vérifiées et hypothèses)

Les sites de référence ont été ouverts dans Chromium et observés **dans le temps** : captures à 1,5 s, 4 s et 8 s, après un mouvement du pointeur, après défilement, en 1440 × 900 et en 390 × 844. Le rendu WebGL de ce navigateur est logiciel (pas de GPU), donc plus lent qu'en réalité.

**Vérifié** (ce que le navigateur a effectivement reçu et affiché) :

| Site | Constat |
|---|---|
| bruno-simon.com | 4 à 8 s d'écran sombre avant la scène ; 5 caractères de texte dans le DOM ; tout le contenu est dans le canvas. |
| activetheory.net | « Your browser is not supported » : 29 caractères, aucun lien, aucun contenu de repli. |
| lusion.co | Un compteur de chargement (« 002 », « 004 ») encore visible après 4 s ; la page sature le rendu (captures impossibles). |
| unseen.co | Un écran « Enter » avec un choix d'audio avant le contenu. |
| immersive-g.com | Un écran gris presque vide après 8 s, alors que 2 361 caractères de contenu sont dans le DOM. |
| locomotive.ca | Plusieurs secondes de lettres brouillées en introduction, puis un hero vidéo très fort ; le contenu reste dans le HTML (2 247 caractères, 54 liens). |
| resn.co.nz | 17 caractères de texte ; il faut interagir pour découvrir. |
| awwwards.com | Refuse le navigateur automatisé (23 caractères). |

**Hypothèses** (non vérifiables ici) : sur un vrai GPU, les temps d'attente de Lusion ou de Bruno Simon sont plus courts ; leur force tient à la lumière et au matériau de quelques objets plutôt qu'au nombre d'effets.

**Ce que j'en retiens** :
- **Leur force** : un seul objet, éclairé et composé ; un mouvement lent et intentionnel ; des contrastes d'échelle forts ; une interaction qui a un sens (on conduit, on touche, on tourne).
- **Leur faiblesse**, que je ne reproduis pas : le contenu est retenu derrière un chargement, un bouton « Enter » ou une interaction.
- **Ma règle** : le HTML arrive d'abord et il est complet. Le dessin est servi en SVG par le serveur et visible aussitôt. La scène WebGL arrive ensuite, le remplace, et se retire si l'appareil ne suit pas.

## 3. Le concept : des fils

Le site est un espace sombre, éclairé, où **six fils** (un par projet, teint de la couleur du projet) racontent le travail : **« Je rends lisible ce qui est complexe »**.

| Acte | Ce que font les fils | Ce que l'on lit |
|---|---|---|
| 1. Découverte | Ils entrent par la gauche, se nouent ensemble, ressortent à droite. **Sous le pointeur (ou le doigt), ils se peignent en lignes parallèles**, lisibles, puis se renouent. | Le nom, le métier, la phrase de présentation, deux actions. |
| 2. Exploration | En défilant, le nœud se dénoue. Chaque projet a sa scène : son fil dessine **son motif**, dans sa lumière ; les autres fils passent derrière, calmes, comme sur un métier à tisser. | Le projet, son résumé, ses technologies, ses captures réelles ; « Ouvrir le projet » mène à l'article complet. |
| 3. Expertise | Les fils sont tendus côte à côte (la chaîne du métier) derrière les titres. | Les postes en chapitres (« Aujourd'hui », « En parallèle », « Avant »), les compétences. |
| 4. Approche | Les fils traversent la phrase gardée de la biographie. | Introduction, biographie, principes. |
| 5. Contact | Les six fils se rejoignent et n'en font plus qu'un, qui souligne l'adresse e-mail. | « Tirons le fil ensemble. » L'e-mail, GitHub et LinkedIn. |

**Les motifs** sont des signes abstraits du domaine de chaque projet. Ce ne sont jamais des images de l'application, et le site le dit (« Motif — … », et une note dans l'article).

| Projet | Motif | Lien avec le projet |
|---|---|---|
| Bercy Vert | feuille | transition écologique |
| Référentiel Indicateurs | courbe et seuil | indicateurs, alertes sur seuils critiques |
| Saisines de la Cour des comptes | arborescence | orienter et structurer des demandes |
| Veille Stratégique | spirale | collecte multi-sources, synthèse |
| SafePing | onde | signal, alerte |
| Datametre | barres | données chiffrées ; sa capture réelle est posée devant |

Un nouveau projet prend le motif « nœud » ; le champ **Motif du fil** de l'administration permet de le choisir.

**Ce qui a été refusé** :
- la sphère, la planète, les particules, la grille 3D, les cubes ;
- le curseur personnalisé, le glitch, le défilement détourné, l'écran « Enter », le chargement bloquant ;
- de fausses captures d'écran.

## 4. Matériau, lumière, couleur

- **Le fil** : un tube extrudé sur le GPU, éclairé comme de la soie. Le reflet est anisotrope (Kajiya-Kay), étiré le long de la fibre : un reflet blanc fin et un reflet coloré plus large. Des stries enroulées donnent l'aspect d'un cordon torsadé. L'arrière d'un nœud s'enfonce dans l'ombre, et un liseré de lumière souligne les bords.
- **La lumière** : une lumière principale chaude venue d'en haut à gauche, et un halo derrière la scène active. Ce halo prend la teinte du projet (vert pour Bercy Vert, ardoise pour Référentiel, prune pour Saisines…) : chaque projet a sa couleur d'ambiance. Le fond porte un vignettage et un grain de film léger.
- **La palette** :
  - un fond brun-noir chaud (`#0f0e0d`) et un texte os (`#f1ebe2`) ;
  - six teintures de fils, issues du champ « teinte » du CMS : vermillon `#e0532f`, vert sapin `#3f9a6c`, ardoise `#6383b3`, ocre `#dea235`, prune `#b0507f`, sable `#d4bd8f` ;
  - une seule couleur d'action hors des projets, la braise `#ff8a5c`.
  - Pas de violet ni de cyan, pas de dégradé « SaaS ». Le texte n'utilise jamais une teinture brute : elle est éclaircie pour garder le contraste AA (vérifié par axe).
- **La typographie** :
  - **Bricolage Grotesque**, une grotesque expressive et légèrement irrégulière, réduite à 67 Ko (graisse et largeur variables). Elle sert aux noms, aux titres et aux chapitres, en très étroit et très gras pour le nom, plus ouverte pour les rôles.
  - **Geist** sert au texte courant et aux étiquettes.

## 5. La tranche verticale et sa critique

La tranche (introduction, galerie, navigation) a été construite dans le vrai site, puis inspectée dans le navigateur à 1440 × 900, 820 × 1180 et 390 × 844, avant de construire le reste. Captures : [`docs/prototypes/v5/`](prototypes/v5/).

**Défauts vus, puis corrigés** :

| Itération | Défaut | Correction |
|---|---|---|
| 1 | Le nœud ressemblait à une **pelote** dense, pastel, presque enfantine. | Fils ouverts (ils traversent le nœud), nœud plus lâche et étiré, teintures plus profondes, assombrissement en profondeur. |
| 1 | Des fils traversaient le nom et le métier. | Les bouts libres s'effacent vers la gauche (WebGL), avec un masque équivalent en SVG. |
| 1 | Le halo brun était boueux et envahissait l'écran. | Halo plus sombre et plus concentré. |
| 1 | Le motif de Bercy Vert était coupé par l'en-tête. | Motif réduit à 80 % de sa scène. |
| 1 | L'interaction au pointeur était imperceptible. | Remplacée par le **peigne** (voir §3), qui a un sens. |
| 2 | Les lignes peignées étaient trop serrées. | Écart élargi. |
| 3 | La citation se cassait mot à mot. | Largeur mesurée dans la bonne unité. |
| 3 | Les outils des postes s'affichaient en liste brute. | Style partagé. |
| 3 | Le contact ne montrait qu'un fil : l'éventail était hors de l'écran. | L'éventail s'ouvre à droite, dans l'espace libre. |
| 3 | Les fils traversaient les cartes de compétences en diagonale. | Les compétences ont leur propre scène. |
| 3 | Débordement horizontal de 632 px ; la barre mobile sortait de l'écran. | Débordement coupé ; la barre est vérifiée par test. |
| 4 | La capture de Datametre cachait ses barres. | Capture plus petite, décalée : le graphique se dresse derrière l'écran. |
| 4 | Le repère de position chevauchait le menu à 1024 px ; le nom du projet en cours, dans le rail, chevauchait le texte. | Repère affiché dès 1200 px ; noms du rail au survol seulement. |

**Critique sévère de l'état final**

Notes sur 10, d'après les captures :

| Critère | Note | Constat |
|---|---|---|
| Identité | 8 | Le fil porte le sens du site ; aucune scène ne ressemble à une démonstration de bibliothèque. |
| Composition | 7,5 | Les scènes de projets alternent bien ; le premier écran mobile est fort. Sur tablette portrait, l'introduction garde un peu de vide entre le nœud et le texte. |
| Lumière et matériau | 7 | Le reflet de soie et la lumière teintée par projet fonctionnent. Il n'y a ni ombre portée ni profondeur de champ : la scène reste un peu « posée sur fond ». |
| Mouvement | 7 | Dénouage au défilement, peigne, ouverture d'article depuis la scène : cohérents. Le passage entre deux projets reste parfois confus à mi-course (deux fils qui se croisent). |
| Lisibilité et ergonomie | 8,5 | Navigation toujours visible, repère de position, rail, index des projets, articles avec précédent / suivant, Retour et Échap. |
| Mobile | 7,5 | Même signature, composition propre. Le motif de SafePing (onde) se lit moins bien en 3D qu'en SVG. |

Ce que je n'ai **pas** pu juger : le rendu sur un vrai GPU, la fluidité réelle (tout a été vu en rendu logiciel) et le toucher sur un appareil physique.

## 6. Médias

- **Captures réelles** :
  - Datametre est la seule capture publiée (`media/datametre-apercu.webp`, 640 × 400 en ligne).
  - Une capture plus nette du site en ligne, en 1440 × 900, est dans `docs/prototypes/v4/media/datametre-desktop.webp`. On peut la mettre à la place depuis l'administration.
- **Projets du ministère** : ils n'ont pas de capture publique, donc leur motif suffit.
- **Nouvelles captures** : quand elles seront ajoutées dans le CMS, elles s'afficheront d'elles-mêmes :
  - grande, inclinée, devant le motif, dans la scène du projet ;
  - en tête de l'article ;
  - dans la galerie de l'article.

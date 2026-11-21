# Direction artistique — « Affiches »

Novembre 2026. Remplace « Fils » (scène WebGL de fils dans un espace sombre, commit `649ea35`), qui remplaçait « Sommaire » (éditorial) et « Expliquer » (le dépliant). Le contenu, l'administration, les schémas, le stockage (Netlify Blobs) et la sécurité ne changent pas.

Captures avant / après, interactions et scénarios : [`docs/comparaison/`](comparaison/README.md).

## 1. Pourquoi abandonner « Fils »

« Fils » était techniquement abouti, mais son langage tenait à un seul procédé : des lignes lumineuses sur fond presque noir. Les projets y étaient des signes abstraits (motifs), jamais des objets qu'on a envie de regarder ; le site ressemblait à une démo WebGL sombre comme il en existe beaucoup. Toute variante (recoloriser les fils, les transformer en orbites ou en lignes) aurait gardé la même famille. La refonte part donc d'un autre matériau.

## 2. Recherche

Références ouvertes dans Chromium, observées à 1,5 s, 4 s et 8 s, après un mouvement du pointeur et après défilement, en 1440 × 900 et 390 × 844 (planches : `docs/comparaison/recherche/`).

| Site | Constat (vérifié dans les captures) | Ce que j'en retiens |
|---|---|---|
| Studio Dumbar | Fond noir, un objet 3D monumental, la vidéo en plein écran ; très peu de texte (≈ 200 caractères). | La force d'un seul objet à grande échelle ; mais la 3D sombre, c'est exactement ce que je quitte. |
| Experimental Jetset | Quatre mots en très grand sur blanc, rien d'autre (≈ 130 caractères). | La typographie seule peut être l'image ; mais seule, elle redevient « une phrase géante sur fond uni ». |
| Order | Index très dense (566 liens), affiches de typographie « GROOVE » empilées et inclinées. | **L'affiche empilée, inclinée, comme objet** : c'est l'idée de départ. Leur index est à éviter. |
| Collins | Une phrase serif centrée, puis des études de cas en couleurs franches. | Les couleurs franches des projets portent l'émotion mieux que des effets. |
| Cuberto, Basement | Agence : grands blocs vidéo sombres, logos clients, beaucoup d'effets de curseur. | À éviter : le « studio sombre » générique. |
| Dogstudio, Hello Monday | Canvas WebGL plein écran, contenu peu lisible pendant le chargement. | À éviter : le contenu retenu derrière la scène. |
| Mama Studio | Mise en page de cabinet (cartes, badges, icônes). | À éviter : l'esthétique SaaS. |

Ce que je garde : **un objet fort et tangible, des couleurs franches et plates, une typographie qui fait image, une interaction qui a un sens physique**. Ce que je refuse : le fond sombre avec lumière, la 3D gratuite, l'écran de chargement, les cartes SaaS.

## 3. Le concept : un mur d'affiches

Chaque projet est **une affiche**, composée à partir de ses propres données : son numéro, son titre, sa nature, son année, ses technologies, dans sa couleur. Quand il a une image ou une vidéo réelle, l'affiche la montre ; sinon, elle est purement typographique ou géométrique. **Aucune fausse interface, aucune image inventée.**

Le site est une affiche lui-même : des aplats de couleur pleine, une seule famille de caractères dont la largeur varie, des éléments inclinés posés les uns sur les autres. Pas de dégradé, pas de flou, pas de lueur.

### Les quatre parties

| Partie | Champ de couleur | Composition |
|---|---|---|
| Introduction | Cobalt `#1F3BD6` (réglable : cobalt, encre, vert) | Le nom en capitales très larges, sur toute la largeur ; **une pile d'affiches** des projets posée dessus, qu'on déplace à la main, qu'on mélange, qui ouvre chaque projet ; le titre, une phrase, deux boutons. |
| Projets | Papier `#F5F4F0` | Titre géant + nombre de projets. Chaque projet en grand : son affiche inclinée d'un côté, de l'autre son titre en capitales qui **s'étire à l'entrée**, sa phrase, ses boutons ; les côtés alternent. Les autres projets : **une bande d'affiches** qui défile horizontalement. |
| À propos | Encre `#111111` | Titre géant, la présentation en grand, « Aujourd'hui » (le poste actuel), trois domaines d'expertise numérotés, le parcours en lignes ; biographie et principes repliés (« En savoir plus »). |
| Contact | Vermillon `#FF4B2B` | Titre géant, une phrase, **l'adresse e-mail sur toute la largeur**, copier, GitHub, LinkedIn, CV. |

### Les compositions d'affiche (`src/lib/poster.ts`, `Poster.astro`)

- **Image ou vidéo** : la capture réelle occupe le centre, la couleur du projet l'encadre comme un passe-partout.
- **Numéro** : le numéro du projet en chiffres étroits, aussi grand que l'affiche le permet.
- **Titre** : le titre en capitales larges, une ligne par mot (les mots courts groupés), chaque ligne à la largeur de l'affiche, puis répété en contour jusqu'à la remplir.
- **Grille** : 3 × 4 modules de formes (disques, demi-disques, quarts, barres), tirées de l'identifiant du projet : chaque projet garde toujours les mêmes.

Sans réglage, la composition varie d'un projet à l'autre ; elle se choisit dans l'administration (Projets → Paramètres avancés → Présentation). Les affiches sont dimensionnées par leur conteneur (`container queries`) : la même affiche sert dans la pile, en grand, en petit et dans l'article.

### Couleurs

Six couleurs de projet, chacune avec son encre (texte ≥ 4,5:1) et une seconde couleur pour les grands chiffres et les formes (≥ 3:1) — testées dans `tests/unit/site.test.ts`.

| Nom (contenu) | Fond | Encre | Seconde |
|---|---|---|---|
| vermillon | `#FF4B2B` | encre | papier |
| sapin (Vert) | `#0B7450` | papier | ocre |
| ardoise (Bleu ciel) | `#9DB2FF` | encre | cobalt |
| ocre | `#F4B32C` | encre | cobalt |
| prune | `#8E1F55` | papier | ocre |
| sable | `#EADBC1` | encre | cobalt |

Les noms sont ceux du contenu existant : aucun projet publié n'a besoin d'être modifié.

### Typographie

**Archivo** variable (graisse 100–900, largeur 62–125 %), une seule fonte de 78 Ko. La largeur est l'outil : capitales à 125 % pour les titres (le nom, les sections, les projets), chiffres à 62 % pour les numéros, 80 % pour les étiquettes, 100 % pour le texte courant. Les tailles des titres sont calculées depuis leur texte (`displaySize`, `lineSize`) : le mot le plus long tient toujours dans la largeur, un titre long reste sur environ trois lignes. Rien n'est coupé.

## 4. Mouvement

Peu d'animations, toutes physiques : arrivée des affiches qui tombent en place, pile qui suit le pointeur, affiche qu'on déplace, affiche qui passe sous la pile, titres qui s'étirent, article qui s'ouvre depuis l'affiche. Détail dans [`interaction-system.md`](interaction-system.md). Avec « mouvement réduit » (préférence du système) ou le réglage « Sobre » de l'administration, la même page est immobile.

## 5. Évaluation contre l'ancienne direction (étape 4)

| | « Fils » | « Affiches » |
|---|---|---|
| Fond | Presque noir partout, halo de lumière | Quatre aplats francs : cobalt, papier, encre, vermillon |
| Image des projets | Un fil qui dessine un motif abstrait | Une affiche par projet, avec sa capture réelle quand elle existe |
| Typographie | Bricolage étroite + Geist | Archivo très large, capitales, largeur variable |
| Matière | Lignes lumineuses en 3D (WebGL2) | Papier, aplats, ombres portées, inclinaisons ; aucun canvas |
| Interaction | Survoler pour démêler | Prendre, déplacer, mélanger, ouvrir |
| Autres projets | Cartes avec motif | Bande d'affiches horizontale |

Mis côte à côte (`docs/comparaison/avant/` et `apres/`), aucune capture n'appartient à la même famille : ni couleur, ni typographie, ni procédé en commun. Le prototype n'a donc pas été recommencé ; il a été corrigé (titres coupés sur mobile, affiches « titre » trop vides, nom trop large) puis étendu à toute la page.

## 6. Limites connues

- Le déplacement à la main est réservé à la souris et au stylet ; au doigt, toucher une affiche ouvre le projet et le bouton « Mélanger » mélange (le doigt fait défiler la page).
- Les captures des affiches « image » dépendent de la qualité des images fournies : une capture très claire sur fond clair (sable) a peu de contraste avec le passe-partout.
- Le décalage de mise en page à l'arrivée de la fonte (CLS 0,045 sur ordinateur) est sous le seuil de 0,1 mais non nul.

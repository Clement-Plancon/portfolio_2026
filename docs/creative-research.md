# Recherche créative

Deuxième recherche, menée le 10 novembre 2026 pour la refonte « signature ». Elle complète [design-research.md](design-research.md) (16 portfolios étudiés le 8 novembre) en élargissant vers les studios créatifs, la typographie, la signalétique, l'édition et les interfaces de produits.

Méthode : chaque site a été chargé dans Chromium (Playwright) en 1440 × 900 puis 390 × 844 (émulation tactile), avec une capture après défilement. Les bannières de cookies ont été refusées quand un bouton « refuser » existait. Une capture ne montre ni le son ni toutes les interactions : je l'indique quand c'est une limite.

## Ce que je n'ai pas pu consulter (ou seulement en partie)

| Site | Ce qui s'est passé |
|---|---|
| Active Theory — activetheory.net | Page « Your browser is not supported » dans Chromium sans écran. Je n'ai vu que l'écran d'accueil 3D (logo en verre, particules). |
| Unseen Studio — unseen.co | Écran d'entrée seulement (« Enter » / « Enter without audio »). Le site n'a pas été exploré au-delà. |
| Resn — resn.co.nz | Desktop : objet 3D facetté sur fond noir et « Resn · Creative Studio, Est. 2004 ». Mobile : une illustration de personnage. Pas de navigation explorée. |
| Experimental Jetset | Page vide dans le navigateur automatisé, deux essais. Non analysé. |
| New York Times (graphics) | Bloqué comme robot. Non analysé. |
| Awwwards | Liste « Portfolio » consultée après refus des cookies (vignettes uniquement). Je n'ai pas ouvert les sites lauréats un par un. |

## Studios créatifs

### Locomotive — locomotive.ca
- **Qualité principale** : contraste entre une photo plein cadre très saturée (rouge monochrome) et une typographie serif condensée, fine, très élégante.
- **Concept** : agence « digital-first » ; les projets sont une liste de noms en très grand corps, séparés par des filets, avec une petite vignette accolée au survol.
- **Interactions** : défilement doux, vignette qui apparaît à côté du nom survolé.
- **Mémorable** : la liste de projets typographique pleine largeur — sobre et luxueuse.
- **Ergonomie** : texte d'accroche sur photo, contraste moyen ; la liste n'indique ni date ni nature des projets.
- **À adapter** : un index de projets peut être la pièce maîtresse s'il est composé avec autorité ; filets comme structure.

### Basement Studio — basement.studio
- **Qualité principale** : une scène 3D de leur propre local (escalier, borne d'arcade, chien) en ouverture ; mur de logos clients en grille noire.
- **Concept** : studio « qui fait des choses cool et performantes », ton décalé, bascule HUMAN / MACHINE en bas d'écran.
- **Interactions** : bascule de mode, compteurs dans la navigation (Showcase 26, Blog 25), voyant « Online ».
- **Mémorable** : l'identité tient à des détails d'interface (compteurs, voyant, bascule) plus qu'à la 3D.
- **Ergonomie** : 3D sombre peu lisible sur mobile ; la grille de logos ne dit rien du travail.
- **À adapter** : des micro-informations « vivantes » dans la navigation (compteur, état) donnent un caractère de produit.

### Hello Monday — hellomonday.com
- **Qualité principale** : dessins au trait animés en ouverture, serif à empattements typewriter pour les titres de projets.
- **Concept** : « We make digital (and magical)… » suivi d'un mot qui change (Products, Experiences…).
- **Interactions** : mot central qui défile ; grille de projets en quinconce.
- **Mémorable** : le mélange illustration naïve + rigueur typographique.
- **Ergonomie** : écran d'accueil presque vide avant les projets.
- **À adapter** : une grille en quinconce casse la monotonie des cartes alignées.

### Active Theory, Resn, Unseen Studio
Consultés partiellement (voir tableau). Point commun observé : un **écran d'entrée** (3D, porte « Enter », choix audio) avant tout contenu. C'est l'exact inverse de ce qu'il faut ici : un recruteur doit voir du travail en quelques secondes.

### Pentagram — pentagram.com
- **Qualité principale** : un projet à la fois en plein écran (identité Pfizer en très grand), puis une grille éditoriale dense.
- **Concept** : un sélecteur en phrase — « We design [Brand Identity ▾] for [Health ▾] » — qui filtre le travail.
- **Interactions** : la phrase est le filtre ; carrousel à points.
- **Mémorable** : le filtre rédigé comme une phrase.
- **Ergonomie** : menus déroulants petits, peu visibles sur l'image.
- **À adapter** : un filtre qui se lit comme une phrase est plus humain qu'une barre de pastilles.

### Studio Dumbar — studiodumbar.com
- **Qualité principale** : motion typographique (lettrage déformé en perspective, « CLOSE YOUR EYES » lumineux).
- **Concept** : chaque projet arrive comme une animation d'identité.
- **Ergonomie** : le texte en mouvement n'est pas lisible en capture fixe ; écrans presque vides entre deux animations.
- **À adapter** : un langage de mouvement propre (pas le fondu générique) suffit à rendre un site reconnaissable.

### DIA — dia.tv
- **Qualité principale** : la page d'accueil est un **mur de centaines de vignettes** en noir et blanc, filtrables, avec navigation entre crochets « [ Filter ] ».
- **Concept** : l'archive comme identité ; la quantité devient une texture.
- **Mémorable** : densité extrême, monochromie, crochets typographiques.
- **Ergonomie** : vignettes minuscules, impossible de savoir quoi ouvrir sans survoler.
- **À adapter** : un détail typographique répété (crochets) peut signer toute une interface.

## Typographie et édition

### Commercial Type — commercialtype.com
- **Qualité principale** : bandes pleine largeur de couleurs franches (turquoise, bleu, prune, rose), chacune montrant une famille en très grand.
- **Concept** : le catalogue est un empilement de spécimens ; la navigation est une rangée d'étiquettes noires collées en haut.
- **Mémorable** : les étiquettes noires « collées » et le rythme des bandes.
- **Ergonomie** : très bon sur mobile (les bandes s'empilent naturellement).
- **À adapter** : une couleur par élément, dans un système cohérent ; l'étiquette noire comme marqueur d'interface.

### Klim Type Foundry — klim.co.nz
- **Qualité principale** : photographie flash très singulière (bouchers, portraits) mise en face des caractères ; spécimens « listes d'objets » en colonnes.
- **Mémorable** : le décalage entre l'image et le produit.
- **Ergonomie** : on ne comprend pas immédiatement ce qu'on regarde.
- **À adapter** : le spécimen sous forme de liste (colonnes de mots alignés) — une liste peut être belle.

### The Pudding — pudding.cool
- **Qualité principale** : chaque essai visuel a sa couverture colorée, son numéro (#228) et sa date ; titres en serif condensé gras.
- **Concept** : publication d'essais explicatifs, chaque histoire a sa personnalité dans un cadre commun.
- **Mémorable** : numérotation et couleurs franches par article ; illustrations faites main.
- **Ergonomie** : très claire ; mobile en une colonne sans perte.
- **À adapter** : « chaque projet identifiable, système cohérent » — c'est exactement leur équation.

### Swissted — swissted.com
- **Qualité principale** : affiches de concerts punk refaites en style suisse (Akzidenz, formes géométriques, couleurs primaires).
- **Mémorable** : un système graphique strict appliqué à des contenus très différents.
- **À adapter** : une grammaire graphique limitée (cercle, carré, bande) peut générer une couverture différente pour chaque projet sans fausse capture.

### Readymag — readymag.com
- **Qualité principale** : collage dense de réalisations clientes ; carte blanche au centre pour le message.
- **Ergonomie** : beaucoup de bruit autour de l'appel à l'action.
- **À adapter** : rien de spécifique, c'est un contre-exemple de surcharge.

## Signalétique et produits

### Mijksenaar — mijksenaar.com
- **Qualité principale** : photographie de panneaux de signalisation (vert, jaune, flèche, pictogrammes) et typographie claire.
- **Concept** : « wayfinding experts empowering millions of people to move confidently ».
- **Mémorable** : la flèche et le pictogramme comme langage universel.
- **Ergonomie** : site lui-même assez classique ; bannière de cookies persistante.
- **À adapter** : les principes de la signalétique (un seul message par panneau, contraste maximal, flèche = action, « vous êtes ici ») sont exactement les principes d'une bonne navigation.

### Teenage Engineering — teenage.engineering
- **Qualité principale** : produit photographié sur fond noir avec une lumière de studio, navigation en pictogrammes dessinés + petites légendes techniques.
- **Concept** : le site a la même identité que les objets : précis, ludique, industriel.
- **Mémorable** : pictogrammes au trait dans la navigation, légendes en petit corps.
- **Ergonomie** : navigation iconique qui demande de lire les petites légendes.
- **À adapter** : une identité « d'instrument » — étiquettes, états, voyants — crédible pour un ingénieur.

### Are.na — are.na
- **Qualité principale** : sobriété presque documentaire ; liste a. b. c. ; police système.
- **À adapter** : la confiance qu'inspire une interface qui ne cherche pas à impressionner. Contre-poids utile à l'ambition graphique.

## Galeries
- **Awwwards (Portfolio)** : vignettes dominées par la 3D sombre, les portraits du créateur intégrés à des scènes, les titres géants. Beaucoup se ressemblent entre eux : la « créativité Awwwards » est devenue un genre à part entière.
- **Godly, SiteInspire, CSS Design Awards** : voir design-research.md.

## Portfolios déjà étudiés (rappel)
Brittany Chiang, Rauno Freiberg, Emil Kowalski, Paco Coursey, Bruno Simon (partiel), Josh W. Comeau, Anthony Fu, Maxime Heckel, Robin Rendle, Zach Leatherman, Frank Chimero, Lee Robinson, Tobias Ahlin, Jhey Tompkins, Delba de Oliveira, Cassie Evans (site fermé). Détails dans [design-research.md](design-research.md).

## Synthèse

1. **Les sites les plus mémorables ont un système, pas un effet.** Pentagram (la phrase-filtre), Commercial Type (bandes + étiquettes), DIA (le mur + les crochets), The Pudding (couvertures numérotées), Teenage Engineering (l'interface d'instrument). Chacun se reconnaît sans logo.
2. **Les écrans d'entrée et la 3D d'ouverture sont un coût, pas une signature** (Active Theory, Unseen, Resn, Basement sur mobile). Ils retardent le contenu et vieillissent vite.
3. **La liste peut être spectaculaire** (Locomotive, Klim) si elle est composée avec autorité et porte de l'information.
4. **La signalétique est le modèle d'UX le plus éprouvé qui soit** (Mijksenaar) : lisible de loin, pressé, en mouvement, par tout le monde. C'est aussi un langage graphique fort et peu utilisé dans les portfolios web.
5. **Un système graphique strict peut produire une image honnête par projet** (Swissted, The Pudding) : c'est la réponse aux projets sans captures.
6. **Le caractère « produit »** (états, compteurs, voyants, étiquettes — Basement, Teenage Engineering) rend crédible un profil d'ingénieur, à condition de ne rien inventer.

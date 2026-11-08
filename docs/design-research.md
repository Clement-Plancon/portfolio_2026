# Recherche design

Étude menée le 8 novembre 2026, avant la refonte. Chaque site a été chargé dans un vrai navigateur (Chromium via Playwright) en 1440 × 900 et 390 × 844 (émulation tactile), avec une capture après défilement. Les observations ci-dessous viennent de ces captures et de la navigation, pas de souvenirs.

## Sites consultés

### 1. Brittany Chiang — https://brittanychiang.com/
- **Composition** : deux colonnes ; identité et ancres fixes à gauche, contenu qui défile à droite. Sur mobile, tout passe en une colonne.
- **Couleurs et typo** : bleu nuit, texte gris clair, accent turquoise. Une seule sans-serif.
- **Projets** : liste dense (dates, titre, tags en pastilles, petite vignette).
- **Ce qui marche** : on comprend le profil en trois secondes ; contenu très scannable.
- **Piège** : layout copié des milliers de fois. Les pastilles de tags sont devenues la signature du « portfolio de développeur ». À ne pas reproduire.

### 2. Rauno Freiberg — https://rauno.me/
- **Composition** : défilement horizontal de grandes planches blanches sur fond gris ; un mini-indicateur de position en haut.
- **Couleurs et typo** : sans-serif noire très grande, aplats saturés (jaune, orange) en formes simples.
- **Interactions** : c'est le site lui-même qui est l'œuvre ; le geste de défilement est inhabituel.
- **Ce qui marche** : identité immédiate, maîtrise typographique, couleur franche.
- **Piège** : navigation à apprendre. Sur mobile, la planche devient minuscule. Bien pour un designer d'interaction, mauvais pour un recruteur pressé.

### 3. Emil Kowalski — https://emilkowal.ski/
- **Composition** : une colonne étroite, petites sections (Today, Projects, Writing, More).
- **Typo** : petite taille, gris doux, très peu de contraste de hiérarchie.
- **Ce qui marche** : honnêteté, aucune décoration, chaque ligne mène à quelque chose de réel.
- **Piège** : sans contexte, la sobriété ressemble à un site inachevé (le défaut des refontes précédentes de ce portfolio).

### 4. Paco Coursey — https://paco.me/
- **Composition** : colonne étroite, puis une grille de trois colonnes Building / Projects / Writing.
- **Typo** : une italique serif glissée dans une sans-serif (« *Crafting interfaces.* »).
- **Ce qui marche** : un seul détail typographique suffit à donner une voix. Les listes en colonnes donnent de la densité sans cartes.
- **Piège** : sur mobile, la grille de trois colonnes déborde à droite (texte coupé sur la capture en 390 px).

### 5. Bruno Simon — https://bruno-simon.com/
- **Consultation partielle** : seul l'écran de chargement WebGL (anneau lumineux sur grille 3D) s'est affiché pendant les 30 s de l'essai. Je n'ai pas pu explorer le monde 3D lui-même.
- **Ce que j'en retiens** : l'expérience impose un temps de chargement et une mécanique de jeu avant tout contenu. Mémorable, mais à l'opposé de l'objectif ici (comprendre un profil en quelques secondes).

### 6. Josh W. Comeau — https://www.joshwcomeau.com/
- **Composition** : en-tête illustré (nuages, arc-en-ciel, avatar 3D), liste d'articles + colonne latérale de catégories et contenus populaires.
- **Couleurs** : bleu ciel, magenta en capitales espacées pour les surtitres.
- **Interactions** : boutons son et thème, micro-animations partout.
- **Ce qui marche** : personnalité très forte et cohérente ; hiérarchie claire titre / sous-titre / extrait.
- **Piège** : identité fondée sur l'illustration et la 3D sur mesure ; inimitable sans ce travail, et hors sujet pour un profil de Tech Lead.

### 7. Anthony Fu — https://antfu.me/
- **Composition** : colonne de texte, navigation en icônes en haut à droite, fond avec dessins génératifs très discrets.
- **Ce qui marche** : les noms de projets intégrés dans des phrases avec leurs logos (« Creator of Vitest, Slidev… ») : on lit un parcours, pas une grille.
- **Piège** : la navigation en icônes seules oblige à survoler pour comprendre.

### 8. Maxime Heckel — https://blog.maximeheckel.com/
- **Composition** : grand visuel génératif (ruban de particules) sur dégradé bleu électrique → noir, texte en deux colonnes dessous, barre de navigation flottante centrée.
- **Ce qui marche** : le visuel est fait avec la technique qu'il enseigne (shaders) : l'effet *est* la preuve de compétence.
- **Piège** : sans ce lien, le même visuel serait un « blob lumineux » décoratif. Exactement ce qu'il faut éviter ici.

### 9. Robin Rendle — https://robinrendle.com/
- **Composition** : interface de type explorateur de fichiers (arborescence à gauche, grille de photos, barre d'état avec date et heure).
- **Ce qui marche** : métaphore cohérente et assumée jusqu'au bout ; mobile retravaillé (l'arborescence disparaît, la grille passe à deux colonnes).
- **Piège** : métaphore d'interface = coût d'apprentissage ; l'utilisateur doit comprendre qu'il navigue dans des « dossiers ».

### 10. Zach Leatherman — https://www.zachleat.com/
- **Composition** : texte de présentation très grand (≈ 22 px) avec logos et liens inline, colonne latérale de navigation, listes d'articles avec compteurs.
- **Ce qui marche** : la présentation se lit comme un paragraphe de biographie ; police d'en-tête condensée très reconnaissable.
- **Piège** : densité d'informations secondaires (badges de statistiques, avatars) qui dilue la hiérarchie.

### 11. Frank Chimero — https://frankchimero.com/
- **Composition** : texte en monospace minuscule, cinq liens, fond vert-gris uni.
- **Ce qui marche** : radicalité et cohérence ; une couleur de fond suffit à créer une ambiance.
- **Piège** : contraste faible des textes secondaires ; zones tactiles minuscules sur mobile.

### 12. Lee Robinson — https://leerob.com/
- **Composition** : texte à gauche (bio, notes, articles datés), grande illustration verticale à droite ; onglets « Default / Long » pour la bio.
- **Typo** : serif de texte, liste d'articles avec date alignée à droite et filets fins.
- **Ce qui marche** : listes datées très lisibles ; l'illustration donne de la chaleur sans gêner.
- **Piège** : sur mobile l'illustration disparaît, l'identité devient générique.

### 13. Tobias Ahlin — https://tobiasahlin.com/
- **Composition** : nom réparti sur trois lignes décalées autour d'un monogramme dessiné en lignes parallèles ; articles en grands blocs pleine largeur colorés (bleu ardoise, prune…), chacun avec une petite démo animée.
- **Ce qui marche** : les blocs de couleur donnent un rythme fort ; chaque article a une « couverture » qui illustre son sujet.
- **Piège** : blocs qui prennent tout l'écran, peu d'éléments visibles à la fois.

### 14. Jhey Tompkins — https://jhey.dev/
- **Composition** : petite colonne, grille de fond très légère, objet animé suspendu, signature manuscrite.
- **Typo** : sans-serif grasse pour le nom, petites capitales espacées pour la navigation.
- **Ce qui marche** : un objet ludique unique (la lampe qui pend) et une signature : personnel sans être bruyant.
- **Piège** : petites capitales en gris clair, peu lisibles.

### 15. Delba de Oliveira — https://delba.dev/
- **Composition** : colonne serif, portrait rond, listes à puces avec liens soulignés.
- **Ce qui marche** : appel à l'action clair (« Let's talk ») dès le haut ; chaque projet = une phrase utile.
- **Piège** : aspect « document Word » ; aucune mise en scène des projets.

### 16. Cassie Evans — https://www.cassie.codes/
- **Consulté, mais plus un portfolio** : la page affiche désormais un message de fermeture sur un fond animé. Je ne l'utilise pas comme référence de portfolio.

## Galeries parcourues

- **Godly** — https://godly.website/ : sélection très orientée agences et marques ; beaucoup de sites sombres, de 3D et de visuels plein cadre.
- **SiteInspire, catégorie Portfolio** — https://www.siteinspire.com/websites?categories=19 : portfolios de designers et d'architectes, souvent sur fond clair, grandes photos, typographie sobre.
- **CSS Design Awards, galerie** — https://www.cssdesignawards.com/website-gallery?cat=portfolio : beaucoup de héros spectaculaires (planète, crâne 3D) ; peu de portfolios lisibles en 5 secondes.
- **Awwwards, catégorie Portfolio** — https://www.awwwards.com/websites/portfolio/ : **non exploitée**. Une fenêtre de consentement aux cookies recouvrait la page ; je ne l'ai pas acceptée et je n'ai pas analysé les sites listés.

## Ce qui ressort

**Ce qui fonctionne**
1. Identité portée par **un** choix fort et cohérent (Rauno : la typo et l'aplat ; Chimero : la couleur ; Paco : une italique ; Jhey : un objet).
2. Hiérarchie immédiate : nom, rôle, une phrase, puis le travail. Les meilleurs sites montrent du contenu réel au-dessus de la ligne de flottaison.
3. Les projets lus comme une **liste éditoriale** (titre fort, une ligne de contexte, une date) sont plus rapides à parcourir que des grilles de cartes.
4. Les couvertures colorées par sujet (Tobias Ahlin) rythment la page sans faux contenu.
5. Mobile retravaillé, pas réduit (Robin Rendle supprime le panneau latéral et réorganise la grille).

**Pièges**
1. Métaphores d'interface et défilements inhabituels qui demandent un apprentissage (Rauno, Robin Rendle, Bruno Simon).
2. Effets spectaculaires sans lien avec le métier (dégradés lumineux, 3D, particules).
3. Minimalisme sans hiérarchie : petites tailles, gris pâles, contrastes insuffisants (Emil, Chimero, Jhey).
4. Tags en pastilles et layout deux colonnes « à la Brittany Chiang », devenus génériques.
5. Grilles qui débordent sur mobile (Paco).

## Principes retenus pour ce portfolio

1. **Une signature typographique, pas un effet.** Le nom est composé en très grand dans une grotesque variable ; seule la cédille du « ç » de Plançon est dans la couleur d'accent. C'est un détail qui n'appartient qu'à ce nom.
2. **Une couleur franche, utilisée rarement.** Fond papier chaud, encre presque noire, un vermillon de signalétique pour ce qui guide (lien actif, cédille, état « en poste »). Un vert sapin profond pour les zones de contact.
3. **Contenu réel dès le premier écran.** Le héros montre le poste actuel et l'activité parallèle ; la liste des projets commence juste en dessous.
4. **Les projets comme un index + une visionneuse.** Sur grand écran avec souris : une liste typographique à gauche et un panneau qui montre la couverture, le résumé et les technologies du projet survolé ou focalisé. Sur écran tactile : des fiches compactes avec la couverture visible, sans dépendre du survol.
5. **Couvertures honnêtes.** Capture réelle quand elle existe (Datametre). Sinon, une couverture typographique colorée qui affiche le titre et la nature du projet ; jamais de fausse capture d'écran.
6. **Navigation classique et visible.** Barre en haut avec libellés texte, état actif, bouton contact ; sur mobile, une barre basse au pouce. Pas de navigation à deviner.
7. **Mouvement court et fonctionnel.** Transitions de page natives (View Transitions) pour garder le repère de la couverture entre liste et détail ; apparitions de 200 à 400 ms ; tout est coupé avec `prefers-reduced-motion`.
8. **Lisibilité d'abord.** Contrastes AA mesurés, corps de texte à 17–18 px, zones tactiles ≥ 44 px.

# Revue visuelle et UX — « Affiches »

Ce qui a été réellement inspecté, sur captures prises par Playwright et regardées une à une (dossier [`comparaison/apres/`](comparaison/apres/)) :

- **Écrans** : 1440 × 900, 1180 × 820 (tablette paysage), 820 × 1180 (tablette portrait), 390 × 844 (téléphone), sur la page réelle ; 1440 × 900 et 390 × 844 sur les scénarios A, B, C, D et E.
- **Interactions** (captures à des instants choisis) : arrivée des affiches, pile qui suit le pointeur, affiche déplacée à la souris, mélange en cours et terminé, pile qui s'écarte au défilement, titre étroit à l'entrée puis étiré, survol d'une affiche, ouverture de l'article depuis l'affiche, article, bande des autres réalisations, « En savoir plus », adresse copiée, focus clavier, toucher d'une affiche sur téléphone, mouvement réduit.
- **Mesure de l'effet d'étirement** : largeur du titre de « Référentiel Indicateurs » à trois positions de défilement : 329 px (80 %), 386 px (98 %), 456 px (116 %).

## Défauts trouvés et corrigés

Voir le tableau de [`systeme-adaptatif.md`](systeme-adaptatif.md#4-scénarios-de-contenu) : titres coupés sur téléphone, titres longs trop hauts, affiches « titre » vides, nom trop large, bouton « Mélanger » qui chevauchait le titre, accent coupé, contraste des compteurs, nom lu « ClémentPlançon » sans espace par les lecteurs d'écran (les mots du `h1` sont maintenant séparés).

## Vérifié automatiquement

- **Navigateur** (`tests/e2e/`) : 10 résolutions de 320 à 1920 px sans débordement ; navigation ; ouverture, précédent / suivant, Échap, Retour ; lien direct `#projet-…` ; pile (glisser sans ouvrir, mélanger, ouvrir) ; bande ; aucun canvas ; mouvement réduit ; sans JavaScript ; menu en bas sur téléphone, cibles ≥ 44 px ; copie de l'adresse ; axe WCAG 2.1 AA (page, article ouvert, 404) ; SEO et données structurées ; les 5 scénarios à 4 tailles ; les 12 critères de l'administration.
- **Unitaires** : contraste de chaque couleur d'affiche (encre ≥ 4,5:1, seconde couleur ≥ 3:1), des trois couleurs d'accueil et des couleurs de texte ; compositions et tailles des affiches ; règles de `resolveSite`.

## Non vérifié

- **Appareils réels** : aucun téléphone ni tablette physique ; le toucher est émulé par Playwright.
- **Safari et Firefox** : `container queries`, `font-stretch` variable, `<dialog>` et `clip-path` animé y sont pris en charge, mais rien n'a été ouvert dans ces navigateurs.
- **Lecteurs d'écran réels** (VoiceOver, NVDA) : seule l'analyse axe et la structure (titres, noms des liens) ont été vérifiées.

# Revue visuelle et UX — « Fils »

Revue menée le 21 novembre 2026 sur le build de production, avec Playwright et Chromium.

**Méthode** :
- les scènes sont capturées WebGL actif (`?glforce`, rendu logiciel) et sans WebGL (`?nogl`) ;
- toutes les résolutions demandées sont couvertes, en portrait et en paysage pour les tablettes ;
- le mouvement est examiné par des **suites d'images** : le peigne à plusieurs positions du pointeur, et la transition entre l'introduction et la galerie à 300, 600 et 900 px de défilement.

Les défauts relevés et leurs corrections sont détaillés dans [art-direction.md §5](art-direction.md#5-la-tranche-verticale-et-sa-critique). Captures finales : [`captures/`](captures/). Itérations : [`prototypes/v5/`](prototypes/v5/).

## Vérifié automatiquement

`npm test` (Vitest, 88 tests) et `npm run test:e2e` (Playwright, 39 tests sur le build de production) :

- **Résolutions** : aux 10 résolutions (320 × 568 → 1920 × 1080), pas de débordement horizontal. La navigation est visible, on atteint Projets, on ouvre un projet, l'article ne déborde pas et se ferme.
- **Lisibilité** : nom et métier dans le premier écran sur des écrans bas (1440 × 700, 375 × 560).
- **Accessibilité** : axe (WCAG 2.1 AA), aucune violation, avec un article ouvert ; page 404 comprise.
- **Clavier** : ouvrir, précédent / suivant, Échap, retour du focus ; dialogue modal.
- **Adresses** :
  - `#projet-…` à l'arrivée ouvre le projet ;
  - le bouton **Retour** ferme l'article.
- **Rail** : il indique le projet à l'écran et y mène ; le repère de position suit.
- **Sans WebGL** :
  - les fils sont dessinés par le serveur (6 fils dans l'introduction) ;
  - le module de la scène n'est jamais chargé.
- **Mouvement réduit** : pas de scène, aucun contenu en attente d'animation.
- **Sans JavaScript** : tous les détails sont lisibles.
- **Téléphone** : la navigation est en bas de l'écran, avec des cibles de 44 px au moins.
- **Contact et référencement** : copie de l'adresse ; SEO, données structurées, sitemap, robots.
- **CMS** : toute la chaîne (connexion, brouillon, aperçu, publication, médias, sauvegarde, restauration, déconnexion).
- **Unitaires** : contraste AA des teintes ; régularité de chaque motif, motifs par défaut et motif choisi, bouts ouverts du nœud.

## Non testé

- **Rendu sur un vrai GPU** : fluidité, coût réel, aspect du reflet sur un écran haute densité.
- **Appareils physiques** : iPhone, Android de milieu de gamme, iPad (le toucher a été simulé).
- **Autres navigateurs** : Safari et Firefox. Le WebGL2 et le `<dialog>` y sont pris en charge, mais rien n'a été vérifié.
- **Tests avec de vrais visiteurs** : aucun.

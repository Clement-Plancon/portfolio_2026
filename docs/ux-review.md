# Revue visuelle et UX — « Sommaire »

Revue menée le 21 novembre 2026 sur le build de production (`netlify serve --offline`, fonction SSR réelle, Netlify Blobs émulé). Elle distingue trois niveaux :

- **vérifié automatiquement** : les tests listés plus bas ;
- **examiné à l'œil** : sur des captures prises dans Chromium avec Playwright, aux 10 résolutions demandées, dans les deux thèmes, à mi-animation et à 200 % de zoom ;
- **non testé** : aucun test avec de vraies personnes, aucun appareil physique, ni Safari, ni Firefox.

## Boucle de critique

Chaque ligne correspond à un défaut vu sur une capture, puis corrigé et vérifié à nouveau.

| Défaut observé | Correction |
|---|---|
| Le bouton « Sommaire » (réservé au mobile) apparaissait au centre de l'en-tête sur desktop. | Masqué hors mobile. |
| Dans l'article, la planche débordait de son cadre : elle était dimensionnée sur la largeur d'un cadre très large. | Unités `cqmin` : la planche se dimensionne sur le plus petit côté. |
| Les couches de la planche restaient serrées et l'écart ne se lisait pas. | Écart augmenté et réparti selon le nombre de couches ; la pile est recentrée. |
| Les technologies de chaque couche étaient cachées par la couche du dessus. | Elles sont posées sur le bord avant, la seule partie visible d'une feuille inférieure. |
| L'ouverture d'un article montrait un grand titre seul, et la planche n'apparaissait qu'après défilement. | Sans capture, le chapeau et la planche partagent le premier écran. |
| L'aperçu au survol masquait le titre qu'on lisait. | Il se place au-delà de la fin du titre. |
| Le premier écran ne montrait aucun projet. | L'introduction est raccourcie et le sommaire la suit de près : la section Projets apparaît en bas du premier écran desktop, et ses premières lignes sur tablette portrait. |
| Tablette portrait : la phrase d'accroche était perdue dans un grand vide. | Corps plus grand (jusqu'à 120 px) et introduction plafonnée en hauteur. |
| Mobile : « Aujourd'hui — Laboratoire… » se coupait en quatre lignes alignées à droite. | Empilé et aligné à gauche. |
| À propos : la biographie était étroite et le tiers droit restait vide. | Biographie sur 8 colonnes, la devise en exergue dans la marge gauche. |
| Un voile gris apparaissait pendant l'ouverture et la fermeture des articles (très visible en thème clair). | Plus de voile : l'article grandit par-dessus la page. |
| Image de partage : un titre de projet était tronqué. | Colonne élargie. |

## Vérifié automatiquement

`npm test` (Vitest, 87 tests) et `npm run test:e2e` (Playwright, 38 tests sur le build de production) :

- **Résolutions** : aux 10 résolutions (320 × 568 → 1920 × 1080), pas de débordement horizontal. On atteint la section Projets par le sommaire, on ouvre un projet, son article ne déborde pas, et on le ferme.
- **Premier écran** : nom et rôle visibles sur des écrans bas (1440 × 700, 375 × 560).
- **Accessibilité** : axe (WCAG 2.1 AA), sans aucune violation, en thème clair et en thème sombre, avec un article ouvert ; page 404 comprise.
- **Clavier** :
  - Entrée ouvre l'article, et le focus va sur « Fermer » ;
  - le dialogue est modal ;
  - précédent / suivant fonctionnent ;
  - Échap ferme et rend le focus à la ligne du projet.
- **Adresses** :
  - l'adresse suit l'article ouvert, et *Retour* le ferme ;
  - `/#projet-x` ouvre le projet à l'arrivée ;
  - à la fermeture, on retrouve sa ligne.
- **Sans JavaScript** : tous les détails sont lisibles.
- **Mouvement réduit** : rien n'attend une animation.
- **Mobile** : le sommaire se ferme avec Échap et après un choix.
- **Contact** : l'adresse se copie.
- **Référencement** : SEO, données structurées, sitemap, robots.
- **CMS** : la chaîne complète (connexion, brouillon, aperçu, publication, médias, sauvegarde, restauration, déconnexion).
- **Couleurs** : contraste AA des douze teintes de projets, et classement des technologies sur les planches.

## Examiné à l'œil

- **Mouvement, image par image** :
  - le texte d'arrivée monte et est lisible avant 500 ms ;
  - l'article part bien de la ligne cliquée (120 ms, 300 ms, 520 ms) et s'y referme ;
  - le focus clavier est visible sur la ligne entière.
- **Zoom à 200 %** (720 px de large) : pas de débordement, la navigation passe au sommaire mobile.
- **Thèmes** : le thème clair est dessiné, avec son propre accent bronze, et non obtenu par inversion.

## Limites connues

- **Une seule vraie capture** de projet (Datametre). Les cinq autres projets sont représentés par leur planche, ce qui est honnête mais moins parlant qu'une image. Les vraies captures que l'on pourra publier seront à ajouter depuis l'administration ; la mise en page les prend en charge (grand visuel en tête d'article, feuille du dessus de la planche, aperçu au survol).
- **La planche classe les technologies par couche** à partir d'une table de correspondance (`src/lib/plate.ts`). Une technologie inconnue va dans « Autres ». Il faut compléter la table si de nouveaux noms apparaissent.
- **Navigateurs** : tout a été vérifié dans Chromium uniquement. Le `<dialog>` modal, `clip-path` animé par WAAPI, les unités de conteneur et `:has()` sont pris en charge par Safari 16.4+, Firefox 121+ et Chrome 105+. Il faut tout de même vérifier l'ouverture des articles sur un iPhone réel.
- **Aucun test utilisateur.**

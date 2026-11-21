# Performance — mesures

Mesuré le 21 novembre 2026 sur le build de production servi par `netlify serve --offline` (fonction SSR réelle). **Cet environnement n'a pas de GPU** : le WebGL y est calculé par le processeur (SwiftShader). Les chiffres ci-dessous disent ce qui a été mesuré, et ce qui ne pouvait pas l'être.

## Lighthouse 12.8.2

| | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|
| Mobile (Moto G simulé, 4G lente) | **97** | **100** | **100** | **100** | 2,4 s | 0 | 0 ms | 1,8 s |
| Desktop | **100** | **100** | **100** | **100** | 0,6 s | 0 | 0 ms | 0,5 s |

**À savoir** :
- Lighthouse tourne sans GPU, et la scène détecte un rendu logiciel : elle **ne démarre pas** pendant ces mesures. Elles valent donc pour le HTML, les polices, le SVG et le script, pas pour la scène WebGL.
- Le serveur local ne compresse pas le HTML (167 Ko ; 26 Ko en gzip). Netlify le sert compressé.

**Première mesure, avant corrections** : Performance 48 en mobile et 59 en desktop, avec 38 s de blocage du fil principal. Deux causes ont été corrigées :
- la scène tournait en rendu logiciel ;
- le HTML pesait 530 Ko, à cause de SVG trop détaillés et répétés dans chaque article.

## Coût de la scène (forcée avec `?glforce`)

| | JS par image (médiane) | JS par image (p95) | Tas JS |
|---|---|---|---|
| Desktop 1440 × 900 | 1,0 ms | 1,4 ms | 9,5 Mo |
| Mobile 390 × 844, processeur ralenti × 4 | 3,9 ms | 6,9 ms | 9,5 Mo |

- **Géométrie** : 6 fils × 200 points × 13 côtés, soit 15 600 sommets et 7 appels de dessin par image (fond compris). Deux textures de 200 × 6 points sont mises à jour à chaque image.
- **Fragments** : un passage plein écran pour le fond (dégradé, grain), puis les tubes. La résolution est plafonnée à 1,5 (téléphone, tablette) ou 1,75 (ordinateur).
- **Fréquence d'image** : en rendu logiciel, on mesure 11 à 15 images par seconde, avec des tâches d'environ 100 ms par image. C'est le coût du rendu **sans GPU**, et c'est exactement le cas que la détection exclut désormais. **La fréquence sur un vrai GPU n'a pas été mesurée** : il faut la vérifier sur la prévisualisation Netlify, avec un téléphone de milieu de gamme. Si elle est trop basse, la scène baisse sa résolution, puis se retire d'elle-même.
- **Poids** :
  - module de la scène : 7,6 Ko compressé (moteur 5,6 Ko, géométrie 2 Ko), chargé seulement s'il peut servir ;
  - script de la page : 3,5 Ko compressé ;
  - polices : Bricolage 67 Ko et Geist 25 Ko, préchargées.
  - Aucune bibliothèque 3D.

## Ce qui tient la performance

- Le LCP est du texte HTML (le nom, ou la phrase de présentation sur mobile), peint dès le premier rendu. La scène arrive après l'événement `load`, quand le navigateur est libre.
- Le SVG du serveur donne une image complète tout de suite, et la lumière est peinte en CSS. Rien ne « clignote » au chargement de la scène : elle apparaît en fondu par-dessus.
- Pas de bibliothèque : WebGL2 direct, tubes extrudés dans le shader. Le CPU ne calcule que 1 200 points par image.
- Pause quand l'onglet est caché ou qu'un article est ouvert. Dégradation automatique, puis retrait.

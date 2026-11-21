# Performance — mesures

Mesuré le 21 novembre 2026 avec **Lighthouse 12.8.2** (Chromium sans interface). La cible est le build de production servi par `netlify serve --offline` : la vraie fonction SSR, avec Netlify Blobs émulé.

| | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile (Moto G simulé, 4G lente) | **97** | **100** | **100** | **100** | 2,4 s | 0,002 | 0 ms |
| Desktop | **100** | **100** | **100** | **100** | 0,5 s | 0,004 | 0 ms |

**Limites de la mesure.**
- Le serveur local ne compresse pas le HTML : Lighthouse signale 78 Ko à gagner par compression (la page fait 93 Ko, CSS inclus, et 17 Ko en gzip). Le CDN de Netlify sert en Brotli ou gzip, donc le LCP mobile en ligne devrait être meilleur. **Il reste à le mesurer sur la prévisualisation Netlify.**
- L'INP ne se mesure qu'avec de vrais visiteurs. En laboratoire, aucune tâche longue n'apparaît (TBT 0 ms) ; le script de la page fait 2,6 Ko compressé.

## Ce qui tient la performance

- **HTML rendu côté serveur et mis en cache par le CDN** jusqu'à la publication suivante (inchangé).
- **Polices** : deux fichiers préchargés, Newsreader romain (105 Ko, variable) et Geist (25 Ko, réduite au latin). L'italique (55 Ko) se charge à la demande. Elles s'affichent avec `font-display: swap` sur des polices de repli proches.
- **LCP** : c'est la phrase d'accroche. Son animation ne touche que `transform` (aucune opacité à 0), elle est donc peinte dès le premier rendu.
- **Images** : seule la capture de Datametre est chargée, et seulement à l'ouverture de son article ou à son aperçu (`loading="lazy"`, dimensions déclarées : aucun décalage).
- **Planches** : du CSS (3D, unités de conteneur), sans image ni canvas. Elles ne sont dessinées qu'à l'ouverture d'un article (le `<dialog>` fermé n'est pas rendu).
- **JavaScript** : un module de 6,4 Ko (2,6 Ko compressé), sans dépendance. Aucun écouteur de défilement coûteux : `IntersectionObserver`, plus un écouteur passif regroupé par `requestAnimationFrame` pour l'en-tête. L'animation de l'aperçu ne tourne que pendant le survol.
- **CLS** : la mise en page ne dépend pas du script. Le seul élément ajouté par le script (le bouton « Copier l'adresse ») est déjà réservé dans le flux.

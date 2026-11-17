# Performance

## Mesures (Lighthouse 12.8, local)

Mesuré sur le build de production servi par `astro preview` (sans CDN Netlify ni compression Brotli), avec Chromium 153 sans interface et le profil mobile par défaut de Lighthouse (Moto G Power, 4G lente, CPU ×4) puis le profil desktop.

| Profil | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | CLS | TBT | Poids total |
|---|---|---|---|---|---|---|---|---|---|
| Mobile | 100 | 100 | 100 | 100 | 1,0 s | 1,5 s | 0 | 0 ms | 115 Ko |
| Desktop | 100 | 100 | 100 | 100 | 0,3 s | 0,4 s | 0 | 0 ms | 143 Ko |

Ces chiffres viennent d'une seule exécution par profil, en local. Ils ne garantissent pas les mesures de terrain (Core Web Vitals) une fois en ligne.

Points relevés par Lighthouse sans effet sur la note :

- **Travail du fil principal** : 2,2 s sur mobile avec le CPU ralenti, surtout du calcul de style et de mise en page dû aux transformations 3D des plis. À suivre sur des téléphones d'entrée de gamme.
- **Reflow forcé** : la carte des projets lit `gridTemplateColumns` au chargement pour placer les détails sous leur rangée. C'est une seule lecture, plus une à chaque redimensionnement.

## Choix

- **Une page, une requête HTML** : les styles sont intégrés au HTML (`inlineStylesheets: 'always'`), donc aucune feuille de style ne bloque le rendu.
- **Une seule police** préchargée : Mona Sans variable, réduite au latin et à la ponctuation française (98 → 87 Ko). Ses axes de largeur et de graisse remplacent une seconde famille.
- **JavaScript public** : un seul module de 4,5 Ko (1,9 Ko compressé), sans bibliothèque. Ni GSAP ni WebGL : les plis sont en CSS 3D, et `@property` anime l'angle sans JavaScript.
- **Images** : seuls les projets qui ont une vraie capture chargent une image. Elle est optimisée par Astro (WebP, plusieurs tailles) et chargée en différé.
- **Pas de layout shift** : les plis sont des transformations, qui ne déplacent pas la mise en page. Le nom de la couverture est dimensionné en CSS (`clamp`, `svh`), sans mesure en JavaScript.

# Revue de performance

Mesures faites le 10 novembre 2026 sur le build de production (`npm run build`) servi par `astro preview`, avec Lighthouse 12 en configuration mobile par défaut (Moto G Power simulé, réseau 4G lent simulé, CPU ralenti ×4). Ce sont des mesures de laboratoire en local : les valeurs réelles sur Netlify (CDN, HTTP/2) devraient être proches ou meilleures, mais n'ont pas encore été mesurées.

## Résultats

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Poids |
|---|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 1,5 s | 0 | 0 ms | 77 Ko |
| `/projets/bercy-vert/` | 100 | 100 | 100 | 100 | 1,5 s | 0 | 0 ms | 74 Ko |
| `/parcours/` | 100 | 100 | 100 | 100 | 1,5 s | 0 | 0 ms | 74 Ko |

Objectifs demandés : Performance ≥ 90, Accessibilité ≥ 95, Bonnes pratiques ≥ 95, SEO ≥ 95, LCP ≤ 2,5 s, CLS ≤ 0,1. **Tous atteints.** L'INP n'est pas mesurable en laboratoire ; le TBT nul et l'absence de tâche longue au chargement indiquent un risque très faible.

## Pourquoi c'est léger

- **HTML pré-rendu** par Astro ; aucun framework côté client sur les pages publiques.
- **JavaScript public : un seul fichier de 2,9 Ko (1,5 Ko compressé)** (palettes, bande d'information, plan de ligne, copie de l'e-mail). Preact n'est chargé que sur `/admin/`.
- **Deux polices variables auto-hébergées** (Overpass 39 Ko, Overpass Mono 22 Ko), sous-ensemble latin, préchargées, `font-display: swap`.
- **Aucune image décorative** : pictogrammes en SVG en ligne (quelques centaines d'octets), couleurs en CSS.
- **Images de contenu** optimisées au build (WebP, tailles multiples, `srcset`). La capture de Datametre pèse 3 à 16 Ko selon l'écran.
- **Transitions de page** natives (View Transitions) : zéro octet de JavaScript.
- **Pas d'apparition au défilement** : rien n'est caché au chargement, donc rien ne retarde le LCP.

## L'animation du tableau

- Coût : modification du texte de ~150 cases toutes les 55 ms pendant au plus 1,8 s, dans une seule boucle `requestAnimationFrame`.
- Cases à largeur fixe : aucun décalage de mise en page (CLS 0 mesuré).
- Démarre seulement quand le tableau est visible (`IntersectionObserver`), une fois par visite.
- Alternative légère automatique : désactivée en `prefers-reduced-motion`, en mode économie de données et sur les appareils à 2 cœurs ou moins.

## Cache

`netlify.toml` : fichiers `/_astro/*` et `/fonts/*` en cache immuable d'un an (noms versionnés par contenu) ; HTML revalidé à chaque visite.

## À vérifier après mise en ligne

- Lighthouse / PageSpeed Insights sur `https://clementplancon.fr/` (mesure réseau réelle).
- Données de terrain (Core Web Vitals) dans Search Console après quelques semaines de trafic.

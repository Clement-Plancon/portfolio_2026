# Revue UX

Revue menée le 17 novembre 2026 sur le build de production servi localement.

- **Captures** : dans Chromium (Playwright) à 320, 390, 768, 1024, 1440 et 1920 px, en mode sombre, et à mi-animation (images saisies 120, 380 et 900 ms après le début d'un pli).
- **Contrôles automatiques** : les 8 largeurs demandées (320 à 1920 px) sont testées pour l'absence de débordement horizontal et la navigation.
- **Emplacement** : les captures finales sont dans `docs/captures/`.

Ce document distingue trois niveaux de vérification :

- **vérifié automatiquement** : par les tests ;
- **examiné à l'œil** : sur les captures ;
- **non testé** : en particulier, aucun test n'a été mené avec de vraies personnes.

## Boucle de critique

### Prototypes

| Prototype | Défaut observé | Correction |
|---|---|---|
| A Expliquer | Les feuilles de l'accordéon s'empilaient au lieu de zigzaguer | Sens du pli alterné corrigé (`--dir`) |
| A Expliquer | Une feuille sur deux disparaissait (face arrière masquée) | `backface-visibility` retirée des feuilles |
| A Expliquer | La carte de contact ne s'ouvrait jamais en bas de page (seuil inatteignable) | Seuil d'ouverture revu |
| A Expliquer | En-tête illisible au-dessus des papiers de couleur | Fond plein |

### Site

| Défaut observé | Correction |
|---|---|
| La bande de couverture se lisait de droite à gauche | Pli de gauche à droite, avec un décalage calculé (`cos()`) pour qu'elle reste alignée à droite |
| La couverture dépassait l'écran en 1920 × 900 | Taille du nom calculée aussi sur la hauteur (`21svh`) ; feuilles moins hautes |
| La bande était presque dépliée dès l'arrivée : le geste ne se voyait pas | Formule de défilement réglée : pliée au premier écran, à plat quand elle atteint le haut |
| Débordement horizontal pendant les plis en perspective | `overflow-x: clip` sur les sections |
| Le nom du bouton d'un volet changeait à l'ouverture (« Fermer ») | Nom stable, état porté par `aria-expanded` et un chevron |
| Bande diagonale « pli » sur les volets : ressemblait à un défaut d'affichage | Retirée ; le coin corné suffit |
| Parcours : le poste principal (LPS) était à droite du triptyque | Placé au centre |
| Contact : filet sur toute la largeur de l'écran | Filet limité à la grille |
| À propos sur mobile : feuilles des principes trop hautes | 11 rem |
| À 320 px, « En poste » coupait la ligne avant le « · » | Poste et organisation sur deux lignes |

### Captures à mi-animation

- Les plis restent cohérents : les ombres suivent l'angle, et aucune feuille ne traverse une autre.
- **Défaut restant** : pendant le dépliage de la carte des projets, le bord d'un volet de la troisième colonne passe brièvement par-dessus le texte d'introduction de la section. C'est visible environ 0,4 s, puis tout est à plat.

## Scénarios d'usage (vérifiés en navigateur automatisé, pas par des personnes)

**Recruteur**

| Besoin | Ce que fait le site | Vérification |
|---|---|---|
| Comprendre le poste | Le nom et le rôle forment le `h1` ; le poste actuel et le poste en parallèle sont au premier écran. | Test « short screens » : 1440 × 700 et 375 × 560. |
| Trouver les projets | Lien « Déplier les projets ↓ » au premier écran, entrée « Projets » dans la navigation. | — |
| Lire une réalisation | Un clic ouvre le détail sur place ; « Volet suivant » enchaîne ; « Replier » revient au volet. | Test clavier. |
| Partager un projet | L'adresse `/#projet-datametre` ouvre ce projet. | Test. |

**Visiteur curieux**

- La bande de couverture se déplie au défilement, et chaque feuille ouvre son projet.
- Les plis d'entrée donnent le rythme de lecture.
- Historique : ouvrir un volet dans la carte remplace l'adresse sans ajouter d'entrée, pour que Précédent ne rejoue pas chaque ouverture. Une feuille de la couverture, elle, ajoute une entrée, et Précédent ramène à la couverture. Ce comportement n'est pas couvert par un test.

**Téléphone**

- Tout le contenu est présent, et aucun débordement n'apparaît de 320 à 430 px.
- Les accordéons sont verticaux.
- Le menu « Sommaire » se ferme avec Échap et après un choix.
- Aucun survol nécessaire.

## Accessibilité

- **axe (WCAG 2.1 AA)** : aucune violation sur la page en clair et en sombre, avec et sans projet ouvert, ni sur la page 404. Lighthouse Accessibilité : 100.
- **Structure** : un seul `h1`, des `h2` par section et des `h3` par projet ; ancres stables ; lien d'évitement.
- **Contrastes calculés** :
  - encre sur papier : 16,3:1 ; texte secondaire : 8,1:1 ;
  - en sombre : 15,1:1 et 7,7:1 ;
  - papiers des projets avec leur encre : vermillon 5,1:1, ocre 7,5:1, vert sapin 8,9:1, ardoise 9,0:1, prune 10,5:1, sable 12,6:1. Un test empêche l'ajout d'un papier sous 4,5:1.
- **Clavier** : volets en `<button aria-expanded>`, détails fermés `inert`, retour du focus au volet après « Replier », focus visible.
- **Mouvement réduit et sans JavaScript** : tout est à plat et lisible (tests dédiés).

## Limites connues

- **Visuels** : 5 projets sur 6 n'ont pas de capture réelle. Leurs volets sont des aplats de papier de couleur avec le titre ; c'est volontaire (rien d'inventé), mais une vraie capture ajoutée dans l'administration les enrichira.
- **Contenu court** : plusieurs projets n'ont qu'un contexte, des contributions et des technologies ; leur détail déplié est bref.
- **Non testé** :
  - tests avec de vraies personnes et avec un vrai lecteur d'écran (NVDA, VoiceOver) ;
  - **Safari et Firefox** : les tests ont été menés uniquement dans Chromium. Les fonctions récentes utilisées (`@property`, `sin()` / `cos()` en CSS, unités `cqw`, `inert`) sont annoncées dans les versions actuelles de Safari et Firefox, mais le rendu des plis 3D n'y a pas été vu ;
  - **Netlify** : le déploiement réel (authentification avec Netlify Blobs, GitHub, aperçu de branche, redirections 301) n'a pas été testé. Les redirections sont vérifiées par un test unitaire qui lit `netlify.toml`, pas par Netlify.
- **Bande de couverture** : elle est réservée aux voyants (`aria-hidden`), puisque ses projets sont repris dans la carte. Sur tablette en portrait, elle se trouve sous la ligne de flottaison.

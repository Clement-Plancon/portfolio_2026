# Comparaison « Fils » → « Affiches »

Toutes les captures ont été prises par Playwright (Chromium) sur le build local, avec le contenu réel sauf dans `scenarios/` (contenu fictif, isolé, jamais publié). Elles ont été regardées une à une ; ce qu'elles ont révélé et ce qui a été corrigé est listé dans [`../systeme-adaptatif.md`](../systeme-adaptatif.md#4-scénarios-de-contenu) et [`../ux-review.md`](../ux-review.md). Décisions artistiques : [`../art-direction.md`](../art-direction.md).

## Avant / après

| | Avant (« Fils », scène WebGL forcée) | Après (« Affiches ») |
|---|---|---|
| Accueil, ordinateur 1440 × 900 | [avant/desktop-hero.jpg](avant/desktop-hero.jpg) | [apres/desktop-hero.jpg](apres/desktop-hero.jpg) |
| Un projet, ordinateur | [avant/desktop-projet.jpg](avant/desktop-projet.jpg) | [apres/desktop-projet.jpg](apres/desktop-projet.jpg) |
| À propos, ordinateur | [avant/desktop-a-propos.jpg](avant/desktop-a-propos.jpg) | [apres/desktop-a-propos.jpg](apres/desktop-a-propos.jpg) |
| Contact, ordinateur | [avant/desktop-contact.jpg](avant/desktop-contact.jpg) | [apres/desktop-contact.jpg](apres/desktop-contact.jpg) |
| Accueil, tablette 820 × 1180 | [avant/tablette-hero.jpg](avant/tablette-hero.jpg) | [apres/tablette-hero.jpg](apres/tablette-hero.jpg) |
| Accueil, téléphone 390 × 844 | [avant/mobile-hero.jpg](avant/mobile-hero.jpg) | [apres/mobile-hero.jpg](apres/mobile-hero.jpg) |
| Un projet, téléphone | [avant/mobile-projet.jpg](avant/mobile-projet.jpg) | [apres/mobile-projet.jpg](apres/mobile-projet.jpg) |

## Après, par écran

Chaque appareil a la même série : `hero`, `projets` (en-tête de la partie), `projet` (SafePing en grand), `autres` (bande des autres réalisations), `a-propos`, `parcours`, `contact`, `article` (Datametre ouvert).

- Ordinateur 1440 × 900 : `apres/desktop-*.jpg`
- Tablette paysage 1180 × 820 : `apres/tablette-paysage-*.jpg`
- Tablette portrait 820 × 1180 : `apres/tablette-*.jpg`
- Téléphone 390 × 844 : `apres/mobile-*.jpg`

## Interactions (`apres/interactions/`)

| Fichier | Moment capturé |
|---|---|
| 01 | Arrivée : les affiches montent en place (400 ms après le chargement) |
| 02 | La pile se penche vers le pointeur |
| 03 | Une affiche déplacée à la souris, pendant le glisser |
| 04, 05 | « Mélanger les affiches » : en cours, terminé |
| 06 | En quittant l'accueil, la pile s'écarte |
| 07, 08 | Titre d'un projet étroit à l'entrée, puis étiré en place |
| 09 | Survol : l'affiche se redresse |
| 10, 11, 12 | Ouverture de l'article depuis l'affiche, article ouvert, contenu |
| 13 | Bande des autres réalisations, survol |
| 14 | « En savoir plus » ouvert (biographie, principes) |
| 15 | Adresse copiée |
| 16 | Focus clavier dans le menu |
| 17 | Téléphone : toucher une affiche de la pile ouvre le projet |
| 18 | Mouvement réduit : la même page, immobile |

## Scénarios (`apres/scenarios/`)

| Préfixe | Contenu |
|---|---|
| `12-projets-*` | Scénario C : 12 projets (4 en grand, 8 dans la bande), **8 postes** (`*-parcours.jpg`, « Tout le parcours » ouvert), vidéos, textes longs |
| `cas-limites-*` | Scénario D : titre de 104 caractères, accents, projet sans rien, sections réordonnées et renommées, titre de contact long, vidéo à l'accueil, accueil « Encre » |
| `4-projets-images-*` | Scénario B : images paysage, portrait, carrée et aucune |
| `minimal-*` | Scénario A : 1 projet, 1 poste |
| `vide-*` | Scénario E : aucun projet, aucun poste ; une affiche faite du titre professionnel tient la pile |

## Recherche (`recherche/`)

Planches des sites de référence observés à l'étape 2 (bureau et téléphone ; à 1,5 s, 4 s, 8 s, après pointeur, après défilement). Analyse dans [`../art-direction.md`](../art-direction.md#2-recherche).

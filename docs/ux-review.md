# Revue UX

Revue menée sur le build de production servi localement, dans Chromium (Playwright), aux largeurs 320, 375, 390, 430, 768, 1024, 1440 et 1920 px, plus téléphone en paysage (844 × 390), hauteur réduite (1440 × 700, 375 × 560), zoom 200 % (640 px CSS, densité 2) et mode sombre.

## Ce que voit un visiteur dans les 5 premières secondes

**Desktop (1440 × 900)** : nom, titre « Ingénieur logiciel & Tech Lead », phrase de positionnement, poste actuel (« En service — Laboratoire de police scientifique de Paris, ministère de l'Intérieur ») et les **six projets** avec année, type et technologies. Rien à faire défiler pour comprendre le profil.

**Mobile (390 × 844)** : nom, titre, phrase, poste actuel, puis les premiers projets avec leur résumé. La barre de navigation du bas est visible en permanence.

## Parcours par profil

| Visiteur | Ce qu'il cherche | Où il le trouve |
|---|---|---|
| Recruteur | poste actuel, expérience, contact | accueil (« En service »), Parcours, panneau jaune en bas de chaque page |
| CTO / Engineering Manager | responsabilités, approche, encadrement | Parcours (responsabilités détaillées), « Ma façon de travailler » |
| Développeur | technologies, nature des projets | colonne Technologies du tableau, pages projet |
| Non technique | qui, quoi, comment le joindre | libellés en clair (« Projets », « Parcours », « Contact »), pas de jargon dans la navigation |

## Critique de la première version, et ce qui a été changé

| Problème observé | Correction |
|---|---|
| La cédille jaune du nom était décalée (métriques d'Overpass différentes de la police précédente). | Nouvelle technique : dégradé de couleur coupé à la ligne de base, juste à toutes les tailles. |
| Dans la navigation, la cédille faisait éclater le nom (« Plan ç on ») : le texte était un enfant direct d'un conteneur flex. | Nom enveloppé dans un élément. |
| La navigation desktop débordait de 335 px sur mobile (sélecteur trop faible face au style des panneaux). | Sélecteurs corrigés ; test de débordement sur les 8 largeurs. |
| Un grand vide séparait le contenu du panneau de contact : il cassait la règle de l'assemblage bord à bord. | Contact collé au reste avec le joint de 2 px. |
| L'adresse e-mail se coupait au milieu sur mobile. | Taille calculée pour tenir sur une ligne dès 320 px. |
| « Projet personnel » affiché deux fois (Cadre et Type) ; « En cours » répété (Période et État). | Champs redondants masqués. |
| Le tableau rejouait son animation à chaque retour sur l'accueil. | Une fois par page et par visite. |
| En mode sombre, le texte des panneaux jaunes devenait clair, donc illisible. | Encre dédiée au jaune, identique dans les deux thèmes ; test axe en mode sombre ajouté. |
| Libellés gris trop pâles sur certains panneaux noirs (axe : contraste). | Couleur secondaire des panneaux appliquée. |
| En paysage, le panneau d'état de la navigation laissait voir un texte tronqué. | Texte masqué sous 1200 px (le point « en service » reste). |

## Navigation

- Toujours visible : rangée de panneaux en haut (≥ 768 px) ou barre en bas (< 768 px), avec libellé + pictogramme.
- Page courante en jaune (« vous êtes ici ») et `aria-current`.
- Retour explicite sur chaque page projet (« ← Tous les projets »), projet précédent / suivant en bas.
- Plan de ligne sur les pages projet pour sauter à une section.
- Lien d'évitement « Aller au contenu ».

## Tactile

- Zones de toucher ≥ 44 px (barre du bas : 60 px de haut).
- Aucun contenu accessible seulement au survol : le résumé que la bande affiche au survol sur desktop est écrit dans chaque ligne sur mobile.
- Le plan de ligne mobile se fait défiler du doigt et se recentre sur la section lue.

## Sans animation, sans JavaScript

- `prefers-reduced-motion` : aucune animation, aucune transition de page ; le tableau s'affiche directement.
- Sans JavaScript : toutes les pages, tous les liens, tous les contenus sont présents (HTML pré-rendu). Seuls la copie de l'e-mail, la bande d'information et le marquage de l'arrêt courant disparaissent.

## Ce qui reste perfectible

- Le tableau tronque les technologies au-delà de trois (« Next.js · Node.js · Post… ») : la liste complète est sur la page projet. Choix assumé pour garder une ligne par projet.
- Les dates de SafePing et Datametre ne sont pas renseignées dans l'historique : le tableau affiche « — » plutôt que d'inventer une année.
- La revue d'accessibilité est automatique (axe) et manuelle au clavier ; elle n'a pas été faite avec un lecteur d'écran réel (NVDA, VoiceOver).

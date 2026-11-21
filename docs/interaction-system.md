# Système d'interaction — « Affiches »

Principe : **le HTML est complet sans script**, puis `src/scripts/site.ts` ajoute le mouvement. Aucun canvas, aucune bibliothèque, aucune attente : rien n'est caché derrière une interaction.

## Sans JavaScript

Tout est lisible : les articles des projets sont imprimés sous chaque projet, les liens sont des ancres, les affiches restent à leur place.

## Introduction : la pile d'affiches

| Geste | Résultat |
|---|---|
| Arrivée | Les affiches montent en place une à une (1,2 s, décalées de 110 ms) ; les mots du nom s'élargissent de 62 % à 125 %. |
| Pointeur fin (souris) | La pile se penche légèrement vers le pointeur. |
| Glisser (souris, stylet) | L'affiche suit la main et passe au-dessus des autres ; relâchée, elle reste là. Un glisser n'ouvre pas le projet. |
| Clic, toucher, Entrée | Ouvre l'article du projet (l'adresse devient `#projet-…`). |
| « Mélanger les affiches » | L'affiche du dessus glisse hors de la pile et repasse dessous. Fonctionne au doigt et au clavier. |
| Défilement | En quittant l'introduction, les affiches s'écartent et tournent un peu. |

Au doigt, glisser fait défiler la page (`touch-action: pan-y`) : aucune interaction ne bloque le défilement.

## Projets

- **Titre qui s'étire** : chaque projet en grand reçoit `--k` (0 → 1) selon sa position dans l'écran ; son titre passe de 80 % à 125 % de largeur, son affiche se redresse et remonte légèrement. Calculé dans une seule boucle `requestAnimationFrame` au défilement, uniquement pour les projets proches de l'écran.
- **Survol de l'affiche** : elle se redresse (rotation 0) et grandit de 2 %.
- **Ouvrir** (titre, bouton, affiche) : l'article s'ouvre en dialogue modal, **depuis l'affiche** (animation de `clip-path` depuis son rectangle, 700 ms). L'adresse devient `#projet-…` ; Retour ferme ; Échap ferme ; le focus va sur « Fermer » puis revient au titre du projet.
- **Précédent / suivant** dans l'article : remplacent l'adresse, la page derrière suit pour que la fermeture retombe sur le bon projet.
- **Autres réalisations** : bande horizontale à défilement natif (`scroll-snap`), flèches pour la souris (masquées quand tout tient), survol qui redresse l'affiche.

## À propos

Parties repliées en `<details>` (« Toutes les compétences », « Tout le parcours », « En savoir plus ») : fonctionnent sans script, au clavier et au lecteur d'écran.

## Contact

Survol de l'adresse : les deux moitiés s'écartent. « Copier l'adresse » (affiché seulement si le presse-papiers est disponible) annonce « Adresse copiée. » dans une zone `role="status"`.

## En-tête

Il prend la couleur de la partie qu'il survole (lue dans les styles calculés de la section) et souligne la partie lue au milieu de l'écran. Sur téléphone, le menu est une pilule fixe en bas de l'écran, à portée du pouce, chaque entrée haute de 48 px.

## Mouvement réduit et réglage « Sobre »

Avec `prefers-reduced-motion: reduce`, ou le réglage Apparence → Mouvement → « Sobre » de l'administration (`html[data-still]`) : pas d'arrivée animée, pas de pile qui suit le pointeur, pas de glisser, pas de titres qui s'étirent, ouverture des articles sans animation, aucune vidéo ne démarre seule. Tout le reste (ouvrir, mélanger, copier) fonctionne.

## Vidéos

Muettes, en boucle, lues seulement à l'écran, avec un bouton pause ; jamais lancées seules en mouvement réduit. Les petites affiches (pile, bande) n'en lisent pas : seule l'affiche en grand et l'article.

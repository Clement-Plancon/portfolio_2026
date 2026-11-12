# Système d'interaction

Principe : **un seul geste signature, le développement, et des gestes discrets qui le prolongent**. Rien ne bloque la lecture : pas d'écran d'entrée, pas de préchargement, pas de texte découpé. Tout le site fonctionne sans JavaScript ; le script public pèse 4 Ko (1,75 Ko compressé) et n'utilise aucune bibliothèque.

## 1. Le développement (interaction signature)

Chaque tirage arrive « sensibilisé » (jaune-vert, la couleur réelle du papier cyanotype avant exposition) et se développe en bleu quand il entre à l'écran.

- **Technique** : une couche de papier sensibilisé posée sur le tirage, dont seule l'opacité change (1,9 s). C'est une propriété composée par la carte graphique : aucun recalcul de mise en page ni de filtre.
- **Déclenchement** : `IntersectionObserver`, quand 30 % du tirage est visible.
- **Une fois par projet et par visite** (`sessionStorage`) : revenir sur l'accueil ou ouvrir l'index après une page projet ne rejoue pas l'effet. Un tirage déjà visible au chargement est montré développé.
- **Sans animation** si `prefers-reduced-motion`, sur les appareils à 2 cœurs ou moins, et en mode économie de données : les tirages sont simplement développés.
- **Sans JavaScript** : les tirages sont développés (l'état « sensibilisé » n'est posé que par le script).
- Le mot en italique de la phrase d'ouverture (« *lisible* ») suit la même idée en CSS pur : il passe du jaune-vert au bleu une fois au chargement.

## 2. La galerie de tirages (accueil)

- **Desktop** (≥ 64 rem, survol disponible, hauteur ≥ 36 rem) : la section est épinglée et le défilement vertical fait glisser les tirages vers la gauche. Le compteur (« 02 / 06 ») et le rail de progression indiquent où l'on est. À la fin, la page reprend son défilement normal.
- **Téléphone, tablette, paysage, zoom fort** : un défilement horizontal natif avec aimantation (`scroll-snap`), le tirage suivant dépasse pour inviter au balayage. Aucun détournement du défilement.
- **Clavier** : chaque tirage est un lien. En mode épinglé, le focus sur un tirage hors champ ramène la page à la bonne position.
- **Sans JavaScript** : la version native, partout.

## 3. La lumière sous le pointeur

Sur un pointeur fin, survoler un tirage le soulève légèrement (−6 px, −0,6°) et y promène une lueur douce, comme une feuille tenue sous une lampe. Pour une vraie capture, le survol montre ses couleurs réelles. Seuls `transform` et `opacity` changent.

## 4. Du tirage à sa page

Le tirage porte un nom de transition (`view-transition-name: print-<projet>`). En ouvrant un projet, il se déplace et s'agrandit jusqu'à devenir l'image d'en-tête de la page (View Transitions entre documents, 0,6 s). Le reste de la page fait un fondu de 0,38 s. Les navigateurs sans cette API naviguent normalement. Le bas de chaque page projet propose le **tirage suivant**, qui fait le même trajet.

## 5. Lire une page projet

- **Sommaire** en chiffres romains, fixe sur desktop. La section en cours de lecture est marquée (`aria-current="location"`, détection par `IntersectionObserver`). Sur mobile, le sommaire devient une ligne de liens en tête du contenu.
- **« Voir en couleurs réelles »** (pour une vraie capture) : un bouton bascule (`aria-pressed`) qui fait passer la capture du cyanotype à ses couleurs d'origine.

## 6. Navigation

- **Desktop** : en-tête fixe avec le nom (prénom en romain, nom en italique bleu) et les sections. La page courante est en bleu, marquée d'un point d'exposition.
- **Téléphone** : barre flottante en bas d'écran, à portée de pouce (Accueil, Projets, Parcours, À propos, Contact). La page courante est inversée (papier sur bleu). Zones tactiles de 48 px de haut.

## Accessibilité du mouvement

| Situation | Comportement |
|---|---|
| `prefers-reduced-motion: reduce` | Aucun développement, aucune transition de page, aucun défilement doux ; tous les tirages sont développés. |
| Appareil modeste ou économie de données | Pas de développement ni de lumière au survol. |
| Pas de JavaScript | Galerie native, tirages développés, liens normaux. |
| Lecteur d'écran | Chaque photogramme a un texte alternatif qui dit ce qu'il est (« Photogramme de présentation pour Bercy Vert : fougères ») ; les vraies captures ont leur texte alternatif ; les couches décoratives sont masquées (`aria-hidden`). |

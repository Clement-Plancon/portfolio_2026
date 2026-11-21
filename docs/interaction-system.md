# Système d'interaction — « Sommaire »

Principe : le mouvement **accompagne une action ou une arrivée**, jamais l'inverse. Rien n'attend une animation pour être lisible ; le défilement reste celui du navigateur.

## Temps et courbes

| Jeton | Valeur | Usage |
|---|---|---|
| `--ease` | `cubic-bezier(0.22, 0.8, 0.12, 1)` | les éléments qui se posent (décélération longue) |
| `--ease-io` / script | `cubic-bezier(0.65, 0, 0.25, 1)` | l'article qui s'ouvre et se referme (accélère puis freine) |
| `--dur-1` / `--dur-2` / `--dur-3` | 180 / 450 / 900 ms | survol / apparition des menus / entrée des blocs |

## Les mouvements, un par un

| Où | Ce qui se passe | Pourquoi |
|---|---|---|
| Arrivée | La phrase d'accroche monte de sous sa ligne (masque, 1,3 s), puis le mot en italique passe du flou au net (1,6 s, départ à 0,7 s). Le nom et l'accroche apparaissent ensuite. Seule la *transformation* est animée : le texte est peint aussitôt, sans attendre l'animation pour le LCP. | « Je rends *lisible*… » : le mot fait ce qu'il dit, une seule fois. |
| Défilement | Les lignes du sommaire, les postes, les compétences et les principes montent de 28 px en s'affichant, une fois, avec un léger décalage entre voisins. | Donner un rythme à la lecture sans effet de « page qui se monte ». |
| En-tête | Il s'efface quand on lit vers le bas et revient dès qu'on remonte (ou qu'il reçoit le focus). La section en cours est soulignée. | Rendre l'écran au contenu, surtout sur téléphone, sans perdre la navigation. |
| Sommaire, survol (pointeur fin) | Les autres titres s'atténuent, le titre survolé passe en italique et glisse de 0,12 em. L'aperçu (planche ou capture) suit le pointeur avec un amorti, au-delà de la fin du titre. Il disparaît au défilement. | Montrer le projet avant de l'ouvrir. Aucune information n'est réservée au survol. |
| Ouverture d'un projet | L'article grandit **depuis la ligne** jusqu'au plein écran (découpe `clip-path`, 760 ms), puis son contenu monte. La planche écarte ses couches après 420 ms. | La continuité : on voit d'où vient l'article et où il retournera. |
| Fermeture | L'article se rétracte dans sa ligne (560 ms) ; la ligne est d'abord ramenée à l'écran si on a navigué avec précédent / suivant. | Retrouver sa place dans la liste. |
| Précédent / suivant | Le nouvel article remplace le précédent sans retour à la liste ; la page derrière suit (la ligne du projet courant est mise au centre). | Parcourir tous les projets sans se perdre. |
| Sommaire mobile | Une feuille plein écran, les entrées en bas (au pouce), qui montent l'une après l'autre (45 ms d'écart). | Accessible d'une main. |

## États

- **Sans JavaScript** : tous les articles sont imprimés sous leur ligne ; les liens `#projet-…` y mènent ; le menu est une rangée de liens.
- **`prefers-reduced-motion: reduce`** : aucune classe `motion` ; rien ne monte, ne glisse ni ne se floute ; les planches sont dessinées déjà écartées ; l'article s'ouvre sans transition ; le défilement n'est pas lissé. Tout le reste (dialogue, adresse, précédent / suivant) fonctionne.
- **Thèmes** : sombre par défaut, clair si le système le demande (`prefers-color-scheme`). Les deux sont dessinés et testés à l'axe.

## Clavier et lecteurs d'écran

- Chaque titre du sommaire est un **lien réel** `#projet-…`. Entrée ouvre l'article : un `<dialog>` modal (`showModal`), le focus va sur « Fermer », la page derrière est inerte.
- Échap ferme ; le focus revient sur la ligne du projet. Le bouton *Retour* du navigateur ferme aussi (l'ouverture ajoute une entrée d'historique ; précédent / suivant la remplacent).
- Les flèches sont dessinées en SVG décoratif ; les boutons portent leurs mots (sur mobile, « Précédent » et « Suivant » restent dans le nom accessible : « Projet suivant : Saisines… »).
- Toutes les cibles tactiles font au moins 44 px.

## Mobile et tablette

- **Téléphone** :
  - le sommaire des projets reste une liste : titre, nature, cadre et période, sans survol ;
  - dans l'article, les commandes (précédent, suivant, fermer) sont **en bas de l'écran**, sous le pouce ;
  - la planche est carrée.
- **Tablette portrait** :
  - l'introduction est raccourcie pour que les premiers projets apparaissent dès le premier écran ;
  - la navigation complète tient dans l'en-tête (plus de bouton « Sommaire » dès 768 px) ;
  - pas d'aperçu au survol, l'ouverture se fait au toucher.
- **Tablette paysage (1024 × 768)** : la mise en page desktop, sans aperçu si l'écran est tactile seulement.

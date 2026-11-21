# Direction artistique — « Sommaire »

Novembre 2026. Cette direction remplace « Expliquer » (le dépliant). Le contenu, le CMS, les schémas et la sécurité sont inchangés.

## 1. Audit de la version « Expliquer »

**À garder** (fonctionnel) : la page unique rendue côté serveur depuis Netlify Blobs ; les ancres `#projets`, `#a-propos`, `#parcours`, `#competences`, `#contact`, `#projet-…` (et les redirections 301 des anciennes pages) ; chaque détail de projet présent dans le HTML ; la lecture sans JavaScript ; le menu mobile accessible ; la copie de l'adresse ; les données structurées ; l'aperçu du brouillon qui rend le même composant.

**Abandonné** (design) : la métaphore du dépliant, les feuilles pliées, les rotations 3D systématiques, les cartes de projets en papier coloré, l'accordéon de couverture, le triptyque, la carte de visite qui se retourne, Mona Sans en très gras étroit, le vermillon.

**Diagnostic.** Le concept était fort, mais l'exécution était dictée par lui : chaque contenu devait se plier, donc tout se ressemblait. Surtout, les projets, le cœur du portfolio, n'étaient montrés que comme des aplats de couleur avec un titre. Ils ne montraient rien de ce qui avait été construit.

## 2. Recherche visuelle

24 sites ouverts dans Chromium, capturés en 1440 × 900 et 390 × 844, au premier écran et après défilement (planches dans [`docs/research/`](research/)).

- **Portfolios** : Rauno Freiberg, Paco Coursey, Emil Kowalski, Brittany Chiang, Cyd Stumpel, Dennis Snellenberg, Robin Noguier, Aristide Benoist, Josh Comeau.
- **Studios** : Locomotive, Basic/Dept, Obys, Koto, Pentagram, Instrument, Lusion, Studio Freight, Buck.
- **Édition, marques et galeries** : Kinfolk, It's Nice That, Are.na Editorial, Linear, Teenage Engineering, CSS Design Awards.

| Observation | Ce que j'en retiens |
|---|---|
| Lusion et Obys ouvrent sur un écran noir, un chargement ou un objet WebGL : spectaculaire, mais rien à lire pendant plusieurs secondes. | Aucune introduction bloquante. Le premier écran se lit tout de suite. |
| Locomotive (mobile), Kinfolk, Pentagram : une liste de titres composés très grand, séparés par des filets, est la navigation la plus belle et la plus évidente. Elle fonctionne sans survol. | Les projets forment un **sommaire** en grand serif. |
| Studio Freight, Instrument, Buck : la grille d'images fonctionne parce qu'ils ont des centaines de visuels. | Je n'ai qu'une capture réelle sur six projets : une grille d'images est exclue. Il faut une représentation honnête. |
| Paco, Emil, Rauno : élégants mais presque vides. Cela convient à des designers connus, mais reste générique pour un profil à faire découvrir. | Il faut de la retenue, mais aussi de la présence : une grande typographie, un vrai motif pour les projets. |
| Kinfolk, Are.na : un serif éditorial, beaucoup d'air, des métadonnées en petites capitales. Le rythme vient des tailles, pas des effets. | Le système typographique : un serif pour ce qui est dit, une grotesque discrète pour ce qui organise. |
| Dennis Snellenberg, Cyd Stumpel : de la personnalité, mais portée par des photos de la personne. | Pas de photo dans le contenu. La personnalité passera par la phrase d'accroche et la façon de montrer le travail. |
| Les sites agréables sur mobile (Locomotive, Kinfolk, Are.na) gardent un menu simple et des listes. Les sites de démonstration y deviennent illisibles ou coupés. | Le mobile est conçu à part : sommaire au pouce, commandes de l'article en bas de l'écran. |

Les vrais projets ont aussi été capturés : Datametre en ligne (desktop et mobile, `docs/prototypes/v4/media/`). C'est la seule capture réelle disponible.

## 3. Trois propositions, trois prototypes

Prototypes navigables dans [`docs/prototypes/v4/`](prototypes/v4/) (ouvrir les fichiers `.html` ; contenu réel dans `data.js`). Chaque proposition a été testée en 1440 × 900, 820 × 1180 et 390 × 844, et ses captures accompagnent le fichier.

- **A — Planches** (`a-planches.html`) : grille suisse sur papier clair, Schibsted Grotesk et IBM Plex Mono. Un index des projets sous le nom, puis une « planche » par projet : texte collant à gauche, figure à droite. **Interaction propre** : la vue éclatée de la pile technique, qui s'écarte à l'entrée dans l'écran.
- **B — Sommaire** (`b-sommaire.html`) : papier sombre et chaud, Newsreader et Geist. La phrase d'accroche en très grand, puis les projets en sommaire de magazine. **Interactions propres** : un aperçu suit le pointeur, et chaque projet s'ouvre en article plein écran (précédent / suivant / fermer).
- **C — Scène** (`c-scene.html`) : Mona Sans large et noir, scrollytelling. Une scène collante à gauche change de projet pendant que le texte défile à droite. **Interactions propres** : le nom s'ajuste à la largeur puis se condense en en-tête ; la scène bascule d'un projet à l'autre.

## 4. Critique

Notes sur 10, données d'après les captures, pas d'après le concept.

| | A Planches | B Sommaire | C Scène |
|---|---|---|---|
| Beauté | 6,5 | **8** | 5,5 |
| Sophistication | 6,5 | **8** | 5 |
| Cohérence | **8** | 7,5 | 6 |
| Originalité | 6 | 6,5 | 5,5 |
| Interactions | 6 | **7,5** | 6 |
| Ergonomie | **8,5** | 7 | 7 |
| Responsive | **8** | 7 | 4,5 |
| Crédibilité professionnelle | **8** | **8** | 6 |

- **C est rejetée.** À 390 px, le nom ajusté à la largeur déborde et la barre de navigation basse est coupée. La scène retombe sur « aplat + gros numéro », exactement le défaut reproché à « Expliquer ». Le style « grotesque large et noire » est aussi le plus daté du lot.
- **A** est la plus juste en ergonomie, mais elle ressemble à beaucoup de portfolios suisses. Le premier écran est correct sans être mémorable. Son idée la plus forte est la **vue éclatée de la pile** : elle montre honnêtement, pour chaque projet, avec quoi il a été construit, et elle ne dépend d'aucune image.
- **B** a le plus de présence dès le premier écran : la phrase, la typographie, la liste des projets. Ses défauts, vus sur les captures :
  - les projets sans capture deviennent des cartes crème unies, c'est-à-dire le même problème d'aplat ;
  - la phrase d'accroche est trop petite sur mobile ;
  - le détail n'est accessible que par un clic.

## 5. Décision

**B, avec la planche de A comme figure de chaque projet.** B apporte l'identité et le parcours. La planche de A corrige le défaut de B en donnant à chaque projet une image vraie. Cette synthèse ne dilue pas B : la planche est dessinée dans les mêmes filets et la même typographie.

## 6. Le système

**Typographie.**
- *Newsreader* (serif à tailles optiques, graisse 300) porte ce qui est dit : la phrase d'accroche, les titres des projets, les chapeaux, les rôles.
- *Geist* (grotesque neutre, réduite au latin, 25 Ko) porte ce qui organise : la navigation, les petites capitales de métadonnées, les listes.
- Pas de troisième police. L'italique est la seule emphase : « *lisible* », le projet survolé, l'adresse e-mail.

**Couleur.**
- Thème sombre par défaut : papier chaud `#12110e`, encre crème `#ede7db`, accent sable `#d8c29a`.
- Thème clair dessiné, pas inversé : `#f2eee5`, `#17150f`, accent bronze `#7a5622`.
- Chaque projet garde une **teinte** (le champ `cover.color` du CMS). Elle n'est plus un aplat : elle colore le numéro du projet et les repères de sa planche. Les douze valeurs (six teintes × deux thèmes) passent le contraste AA (test unitaire).

**Grille.** 12 colonnes, gouttière fluide de 16 à 52 px, filets d'un pixel, beaucoup d'air. Les sections s'annoncent toutes de la même façon : un filet, un nom en petit et un compteur à droite. Le rythme vient des tailles : la phrase d'accroche jusqu'à 200 px, les titres de projets de 34 à 116 px, le texte courant à 16–17 px.

**Les projets, cœur du site.**
- **Le sommaire** : une ligne par projet (numéro teinté, titre en grand, nature, cadre, période). Les projets *mis en avant* (étoile du CMS) sont composés plus grand. Les projets plus modestes passent donc au second plan sans disparaître.
- **L'aperçu** (desktop, pointeur fin) : au survol, les autres titres s'effacent et le titre survolé passe en italique. La planche du projet, ou sa capture, apparaît au-delà de la fin du titre, pour ne jamais masquer ce qu'on lit.
- **L'article** : la ligne s'agrandit jusqu'à remplir l'écran. Il contient la nature du projet, le titre en très grand, le résumé en chapeau, puis la planche ou la capture réelle. Viennent ensuite le contexte, les contributions numérotées, la fiche (cadre, période, état, technologies, liens), la galerie, et « Projet suivant ».
- **La planche** : un dessin éclaté des technologies du projet, une feuille par couche. Les couches sont l'interface, le serveur, les données, les services & IA, l'infrastructure et la démarche. La feuille du dessus est la capture réelle quand elle existe, sinon le nom du projet. Le dessin ne prétend pas montrer l'architecture : il range ce que le contenu déclare, et sa légende le dit. Aucune interface n'est inventée.

**Ce qui a été refusé.**
- Un curseur personnalisé.
- Le défilement détourné ou « lissé ».
- Le WebGL : rien à montrer qui le justifie, et un coût sur les téléphones moyens.
- Un écran de chargement.
- Des fausses captures ou des maquettes d'écrans inventées.

## 7. Médias

La seule capture réelle publiée est celle de Datametre (`media/datametre-apercu.webp`, 640 × 400 en production). Une capture plus nette, prise sur le site en ligne (1440 × 900), est dans `docs/prototypes/v4/media/datametre-desktop.webp` : elle peut être envoyée depuis l'administration pour **remplacer** l'image du projet (Médiathèque, puis Publier). Les projets du ministère n'ont pas de capture publique : leur planche suffit, et rien n'est inventé à leur place.

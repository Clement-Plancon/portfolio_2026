# Guide de l'administration

Adresse : **https://clementplancon.fr/admin/** (mise en place : voir `netlify-deployment.md`).

## Connexion

Un seul compte, le vôtre : l'écran « Administration » ne demande que le **mot de passe**.

- **Durée** : la session dure 8 heures au plus et se ferme après 2 heures sans activité. Si elle expire pendant une saisie, l'administration redemande le mot de passe sans perdre le formulaire ouvert.
- **Se déconnecter** (menu de gauche ou Paramètres) ferme la session **sur le serveur** : même une copie du cookie ne fonctionne plus.
- **Paramètres → Fermer toutes les sessions** ferme les sessions de tous les appareils, y compris l'appareil utilisé. C'est utile après une connexion depuis un ordinateur qui n'est pas le vôtre.
- **Tentatives** : après 5 mots de passe erronés en 15 minutes, la connexion est bloquée pour votre connexion internet pendant 15 minutes, puis 30 minutes, 1 heure… jusqu'à 24 heures. Au-delà de 30 tentatives par heure, toutes adresses confondues, la connexion est suspendue 15 minutes pour tout le monde (protection contre les attaques réparties).


## Le principe en 30 secondes

- **Enregistrer** met vos modifications dans un **brouillon**. Le site public ne bouge pas.
- **Voir l'aperçu** ouvre la page complète avec le brouillon, immédiatement. Vous seul y avez accès.
- **Publier le site** met tout le brouillon en ligne d'un coup : la page publique change **tout de suite**, sans déploiement ni attente.

La barre du haut indique toujours s'il reste des modifications non publiées. Les 20 dernières versions publiées sont conservées automatiquement, et vous pouvez télécharger une sauvegarde à tout moment (Paramètres).

Le contenu est stocké chez Netlify (Netlify Blobs), pas dans GitHub : aucune modification ne crée de commit.

## Tableau de bord

Nombre de projets, expériences et médias ; date de la dernière publication ; liste des modifications non publiées ; derniers contenus modifiés.

## Projets

**Liste**
- L'ordre de la liste est celui du site. Glissez une ligne (souris) ou utilisez les flèches ↑ ↓, puis **Enregistrer l'ordre**.
- ★ : **mettre en avant** : le titre du projet est composé plus grand dans le sommaire des projets.
- 👁 : afficher / masquer sur le site. Un projet masqué reste visible dans l'aperçu.
- ⧉ : dupliquer (la copie est créée masquée).
- 🗑 : supprimer (confirmation demandée).

**Fiche projet**
- *L'essentiel* : titre, adresse du projet (générée depuis le titre ; le projet s'ouvre à l'adresse `clementplancon.fr/#projet-…`), résumé, nature, catégorie, organisation, dates (`2023` ou `2023-04`), état.
- *Présentation* : chaque projet est une ligne du sommaire qui s'ouvre en article. L'article montre la **planche** du projet : ses technologies dessinées en couches (interface, serveur, données…). Si vous avez une **capture réelle**, ajoutez-la : elle est montrée en grand en tête de l'article, posée en haut de la planche, et sert d'aperçu au survol. Sans capture, rien n'est inventé : la planche porte le nom du projet. La *teinte* (vermillon, vert sapin, ardoise, ocre, prune, sable) colore le numéro et les repères du projet ; les six teintes sont vérifiées pour le contraste.
- *Article* : contexte, problème, rôle, approche, contributions, résultats vérifiés, technologies, liens. Tout est facultatif : une section vide n'apparaît pas. Séparez les paragraphes par une ligne vide.
- *Images de l'article* : galerie avec texte alternatif et légende.

Changer l'adresse d'un projet casse les liens existants vers l'ancienne adresse. Les anciennes pages `/projets/…` de la version précédente du site redirigent vers le projet ouvert dans la page unique.

## Expériences

Intitulé, organisation (et organisation de rattachement, ex. ministère), dates, lieu, résumé, responsabilités, compétences. **Sans date de fin, le poste est affiché « aujourd'hui »** et repris en haut de la page (« Aujourd'hui — … »).

## Profil et compétences

- **Profil** : nom, titre professionnel, phrase d'accroche, composée en très grand en haut de la page (un mot entre astérisques est mis en valeur : `Je rends *lisible*…`), accroche, introduction et biographie de la section À propos (le dernier paragraphe de la biographie est mis en exergue), e-mail et localisation publics, liens sociaux, CV (PDF envoyé dans la médiathèque), photo facultative, principes de travail (affichés en quatre colonnes numérotées dans À propos).
- **Compétences** : groupes (nom, courte description, éléments), réordonnables.

## Médias

- **Ajouter un fichier** : glissez une image ou cliquez « choisissez un fichier ».
  - Formats : WebP, PNG, JPEG, AVIF, PDF ; 4 Mo maximum. Le format est vérifié d'après le contenu du fichier, pas son nom. Les SVG et les pages HTML sont refusés.
  - Les images sont réduites à 2400 px et converties en WebP **dans votre navigateur** avant l'envoi.
- **Confidentialité** : un fichier ajouté ou remplacé reste **privé** (visible dans l'administration et l'aperçu seulement) jusqu'à la publication.
- **Cliquez un média** pour :
  - renseigner son **texte alternatif par défaut**, proposé quand vous le choisissez dans un contenu ;
  - le **remplacer** : même nom, donc tous les contenus qui l'utilisent sont mis à jour à la publication. Le même format est exigé ;
  - le **supprimer** : refusé tant qu'un contenu l'utilise, et la liste des contenus concernés s'affiche. Le fichier reste en ligne jusqu'à la publication suivante.
- **Depuis un formulaire** : « Choisir une image dans la médiathèque » permet aussi d'envoyer directement une nouvelle image.

## Référencement

Valeurs par défaut (nom du site, description, image de partage) et réglages de la page unique : titre, description, image, « ne pas indexer ». Champs vides = valeurs par défaut.

## Paramètres

- **Compte** : déconnexion, fermeture de toutes les sessions.
- **Publication** :
  - lien vers l'aperçu ;
  - **Vider le cache**, si le site affichait encore une ancienne version après une publication (normalement automatique) ;
  - **Abandonner les modifications non publiées**, qui remet le brouillon à l'identique du site en ligne.
- **Sauvegarde** : voir ci-dessous.

## Sauvegarde et restauration

- **Télécharger une sauvegarde** : un fichier JSON avec tout le contenu (projets, expériences, profil, compétences, référencement) et la liste des médias, avec leurs noms, textes alternatifs et dimensions. Il ne contient **pas** les images elles-mêmes.
- **Télécharger avec les fichiers** : la même chose, plus les images et PDF. Le fichier est plus lourd. C'est celle-ci qu'il faut garder pour pouvoir tout reconstruire.
- **Restaurer une sauvegarde** :
  1. Choisissez le fichier et confirmez.
  2. Le contenu de la sauvegarde **remplace le brouillon**. Le site public ne change pas encore, et le brouillon précédent est conservé en copie de sécurité chez Netlify.
  3. Vérifiez avec **Voir l'aperçu**, puis **Publiez**.

  Le fichier est entièrement vérifié avant toute modification : un fichier d'un autre site, abîmé, ou dont un média manque est refusé, avec un message. La restauration ne touche jamais au mot de passe, aux sessions ni aux réglages de Netlify.
- **Limites** :
  - Une sauvegarde sans les fichiers ne se restaure que si ses images existent encore chez Netlify.
  - Une sauvegarde avec des fichiers dépassant environ 6 Mo au total ne peut pas être restaurée depuis l'administration (limite des fonctions Netlify).
- **Conseil** : téléchargez une sauvegarde « avec les fichiers » une fois par mois, et avant toute grosse modification.
- **Pour les développeurs** : `node scripts/backup-to-files.mjs <sauvegarde.json>` réécrit une sauvegarde dans `src/content`, pour en garder une copie dans Git ou revenir à l'ancien fonctionnement.

## Mot de passe et secrets

Le mot de passe ne se change pas depuis l'administration : c'est voulu. Il n'est connu que de vous, et Netlify n'en connaît que le hachage. Toutes les opérations ci-dessous se font sur votre ordinateur, dans PowerShell, à la racine du dépôt (après `npm install`), puis dans Netlify → **Site configuration → Environment variables**. Un nouveau déploiement (**Deploys → Trigger deploy**) les applique.

### Changer le mot de passe

1. `npm run admin:setup -- --password` : saisissez le nouveau mot de passe deux fois.
2. Dans Netlify, remplacez la valeur de `ADMIN_PASSWORD_HASH` par celle affichée (**Options → Edit**).
3. Redéployez. Toutes les sessions ouvertes sont fermées ; reconnectez-vous avec le nouveau mot de passe.

### Récupérer l'accès après perte du mot de passe

Il n'y a pas de lien de réinitialisation par e-mail : la récupération passe par Netlify, ce qui suppose l'accès à votre compte Netlify. C'est la même procédure que le changement de mot de passe :

1. `npm run admin:setup -- --password` avec un nouveau mot de passe ;
2. nouvelle valeur de `ADMIN_PASSWORD_HASH` dans Netlify ;
3. redéploiement.

L'ancien mot de passe ne sert plus à rien, et les sessions ouvertes sont fermées. Si la connexion est bloquée après des essais manqués, elle se débloque seule (au plus 24 heures). Changer le mot de passe la débloque aussi immédiatement.

### Rotation du secret de session

À faire si vous pensez qu'une session a pu être volée, ou par précaution (par exemple une fois par an) :

1. `npm run admin:setup -- --secret` ;
2. nouvelle valeur de `ADMIN_SESSION_SECRET` dans Netlify ;
3. redéploiement.

Toutes les sessions existantes deviennent invalides, mais le mot de passe ne change pas.

`npm run admin:setup` sans option régénère les deux valeurs à la fois.

### Si un secret a fuité

Selon ce qui a fuité :

- **Le hachage** (`ADMIN_PASSWORD_HASH`) ne permet pas de se connecter, mais il permettrait de tester des mots de passe hors ligne : changez le mot de passe.
- **Le secret de session** : faites une rotation.

## Messages fréquents

| Message | Signification | Que faire |
|---|---|---|
| « Ce contenu a été modifié ailleurs… » | Le fichier a changé depuis son ouverture (autre onglet). | Copier votre texte, recharger la page, recommencer. |
| « Un contenu avec cet identifiant existe déjà » | Adresse déjà prise. | Changer l'adresse de la page. |
| « Votre session a expiré » | Session expirée (8 h, ou 2 h sans activité) ou fermée ailleurs. | Saisir le mot de passe ; le formulaire ouvert est conservé. |
| « Connexion refusée. Vérifiez le mot de passe. » | Mauvais mot de passe. Le message est volontairement le même dans tous les cas. | Réessayer, sans dépasser 5 essais en 15 minutes. |
| « Trop de tentatives. Réessayez plus tard. » | Trop d'essais manqués. | Attendre (15 min au premier blocage), ou changer le mot de passe. |
| « L'administration n'est pas configurée… » | `ADMIN_PASSWORD_HASH` ou `ADMIN_SESSION_SECRET` absent, mal copié ou trop faible. | Vérifier les variables dans Netlify (valeur entière, sans espace), redéployer. Le journal de la fonction indique laquelle pose problème, sans afficher sa valeur. |
| « Une autre publication vient d'avoir lieu… » | Deux publications en même temps (deux onglets). | Recharger, vérifier, publier à nouveau. |
| « Trop de modifications simultanées… » | Beaucoup d'enregistrements au même instant. | Réessayer. |
| « Publié, mais le cache du site n'a pas pu être vidé… » | Le contenu est publié, mais Netlify n'a pas confirmé le vidage du cache. | Paramètres → **Vider le cache**. |

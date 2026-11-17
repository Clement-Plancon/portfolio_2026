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
- **Voir l'aperçu** ouvre une copie complète du site avec le brouillon (environ une minute après l'enregistrement).
- **Publier le site** met tout le brouillon en ligne d'un coup.

La barre du haut indique toujours s'il reste des modifications non publiées. Chaque enregistrement est conservé dans l'historique Git du dépôt : rien n'est perdu définitivement.

## Tableau de bord

Nombre de projets, expériences et médias ; état du site public et de l'aperçu (en ligne, en cours, échec) ; liste des modifications non publiées ; derniers contenus modifiés.

## Projets

**Liste**
- L'ordre de la liste est celui du site. Glissez une ligne (souris) ou utilisez les flèches ↑ ↓, puis **Enregistrer l'ordre**.
- ★ : mettre le projet **sur la couverture** (la bande dépliée sous le nom, en haut du site). Sans aucun projet étoilé, tous les projets y figurent.
- 👁 : afficher / masquer sur le site. Un projet masqué reste visible dans l'aperçu.
- ⧉ : dupliquer (la copie est créée masquée).
- 🗑 : supprimer (confirmation demandée).

**Fiche projet**
- *L'essentiel* : titre, adresse du projet (générée depuis le titre ; le projet s'ouvre à l'adresse `clementplancon.fr/#projet-…`), résumé, nature, catégorie, organisation, dates (`2023` ou `2023-04`), état.
- *Papier* : chaque projet est un volet du dépliant, imprimé sur un papier de couleur (vermillon, vert sapin, ardoise, ocre, prune, sable). Ces six papiers sont vérifiés pour le contraste du texte. Si vous avez une **capture réelle** du projet, ajoutez-la : elle apparaît sur le volet et dans le détail. Sans capture, le volet reste un aplat de couleur : aucune image n'est inventée.
- *Détail déplié* : contexte, problème, rôle, approche, contributions, résultats vérifiés, technologies, liens. Tout est facultatif : une section vide n'apparaît pas. Séparez les paragraphes par une ligne vide.
- *Images du détail* : galerie avec texte alternatif et légende.

Changer l'adresse d'un projet casse les liens existants vers l'ancienne adresse. Les anciennes pages `/projets/…` de la version précédente du site redirigent vers le projet ouvert dans la page unique.

## Expériences

Intitulé, organisation (et organisation de rattachement, ex. ministère), dates, lieu, résumé, responsabilités, compétences. **Sans date de fin, le poste est affiché « En poste »** et repris sur la couverture du site.

## Profil et compétences

- **Profil** : nom, titre professionnel, phrase de la couverture (un mot entre astérisques est mis en valeur : `Je rends *lisible*…`), accroche, introduction et biographie de la section À propos (le dernier paragraphe de la biographie est mis en exergue), e-mail et localisation publics, liens sociaux, CV (PDF envoyé dans la médiathèque), photo facultative, principes de travail (affichés en accordéon de papier dans À propos).
- **Compétences** : groupes (nom, courte description, éléments), réordonnables.

## Médias

- Glissez une image ou cliquez « choisissez un fichier ». Formats : WebP, PNG, JPEG, AVIF, PDF ; 4 Mo maximum.
- Les images sont réduites à 2400 px et converties en WebP **dans votre navigateur** avant l'envoi. Au moment de la publication, le site produit en plus les tailles adaptées à chaque écran.
- Cliquez un média pour : renseigner son **texte alternatif par défaut** (proposé quand vous le choisissez dans un contenu), le **remplacer** (même nom, donc tous les contenus qui l'utilisent sont mis à jour ; même format exigé), le **supprimer** (refusé tant qu'un contenu l'utilise ; la liste des contenus concernés s'affiche).
- Dans un formulaire, « Choisir une image dans la médiathèque » permet aussi d'envoyer directement une nouvelle image.

## Référencement

Valeurs par défaut (nom du site, description, image de partage) et réglages de la page unique : titre, description, image, « ne pas indexer ». Champs vides = valeurs par défaut.

## Paramètres

Compte connecté, déconnexion, fermeture de toutes les sessions, état des déploiements, et **Abandonner les modifications non publiées** (remet le brouillon à l'identique du site en ligne).

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
- **Le jeton GitHub** : révoquez-le sur GitHub et créez-en un nouveau (voir `netlify-deployment.md`, étape 5).

## Messages fréquents

| Message | Signification | Que faire |
|---|---|---|
| « Ce contenu a été modifié ailleurs… » | Le fichier a changé depuis son ouverture (autre onglet). | Copier votre texte, recharger la page, recommencer. |
| « Un contenu avec cet identifiant existe déjà » | Adresse déjà prise. | Changer l'adresse de la page. |
| « Votre session a expiré » | Session expirée (8 h, ou 2 h sans activité) ou fermée ailleurs. | Saisir le mot de passe ; le formulaire ouvert est conservé. |
| « Connexion refusée. Vérifiez le mot de passe. » | Mauvais mot de passe. Le message est volontairement le même dans tous les cas. | Réessayer, sans dépasser 5 essais en 15 minutes. |
| « Trop de tentatives. Réessayez plus tard. » | Trop d'essais manqués. | Attendre (15 min au premier blocage), ou changer le mot de passe. |
| « L'administration n'est pas configurée… » | `ADMIN_PASSWORD_HASH` ou `ADMIN_SESSION_SECRET` absent, mal copié ou trop faible. | Vérifier les variables dans Netlify (valeur entière, sans espace), redéployer. Le journal de la fonction indique laquelle pose problème, sans afficher sa valeur. |
| « Les modifications entrent en conflit… » | `main` a été modifié sur GitHub en parallèle. | Résoudre sur GitHub ou abandonner le brouillon. |
| « GitHub refuse l'accès » | Jeton expiré ou permissions insuffisantes. | Régénérer le jeton (voir déploiement, étape 5). |
| Aperçu : « échec du déploiement » | Le build a échoué (rare : contenu invalide modifié hors admin). | Ouvrir « détails » pour le journal Netlify. Le site public n'est pas affecté. |

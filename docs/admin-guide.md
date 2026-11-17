# Guide de l'administration

Adresse : **https://clementplancon.fr/admin/** (mise en place : voir `netlify-deployment.md`).

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

Compte connecté, déconnexion, état des déploiements, et **Abandonner les modifications non publiées** (remet le brouillon à l'identique du site en ligne).

## Messages fréquents

| Message | Signification | Que faire |
|---|---|---|
| « Ce contenu a été modifié ailleurs… » | Le fichier a changé depuis son ouverture (autre onglet). | Copier votre texte, recharger la page, recommencer. |
| « Un contenu avec cet identifiant existe déjà » | Adresse déjà prise. | Changer l'adresse de la page. |
| « Votre session a expiré » | Session Identity expirée. | Se reconnecter ; le formulaire ouvert est conservé. |
| « Les modifications entrent en conflit… » | `main` a été modifié sur GitHub en parallèle. | Résoudre sur GitHub ou abandonner le brouillon. |
| « GitHub refuse l'accès » | Jeton expiré ou permissions insuffisantes. | Régénérer le jeton (voir déploiement, étape 5). |
| Aperçu : « échec du déploiement » | Le build a échoué (rare : contenu invalide modifié hors admin). | Ouvrir « détails » pour le journal Netlify. Le site public n'est pas affecté. |

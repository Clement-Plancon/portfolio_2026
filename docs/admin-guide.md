# Guide de l'administration

Adresse : **https://clementplancon.fr/admin/** (mise en place : voir `netlify-deployment.md`).

## Le principe en 30 secondes

- **Enregistrer** met vos modifications dans un **brouillon**. Le site public ne bouge pas.
- **Voir l'aperçu** ouvre une copie complète du site avec le brouillon (environ une minute après l'enregistrement).
- **Publier le site** met tout le brouillon en ligne d'un coup.

La barre du haut indique toujours s'il reste des modifications non publiées. Chaque enregistrement est conservé dans l'historique Git du dépôt : rien n'est perdu définitivement.

## Tableau de bord

Nombre de projets, expériences, articles et médias ; état du site public et de l'aperçu (en ligne, en cours, échec) ; liste des modifications non publiées ; derniers contenus modifiés.

## Projets

**Liste**
- L'ordre de la liste est celui du site. Glissez une ligne (souris) ou utilisez les flèches ↑ ↓, puis **Enregistrer l'ordre**.
- ★ : mettre en avant sur la page d'accueil.
- 👁 : afficher / masquer sur le site. Un projet masqué reste visible dans l'aperçu.
- ⧉ : dupliquer (la copie est créée masquée).
- 🗑 : supprimer (confirmation demandée).

**Fiche projet**
- *L'essentiel* : titre, adresse de la page (générée depuis le titre), résumé, nature, catégorie, organisation, dates (`2023` ou `2023-04`), état.
- *Couverture* : une couleur, et une image réelle si vous en avez une. Sans image, le site compose une couverture typographique.
- *Page détaillée* : contexte, problème, rôle, approche, contributions, résultats vérifiés, technologies, liens. Tout est facultatif : une section vide n'apparaît pas. Séparez les paragraphes par une ligne vide.
- *Images de la page* : galerie avec texte alternatif et légende.
- *Référencement* : titre et description pour Google, image de partage, aperçu du résultat de recherche.

Changer l'adresse d'un projet casse les liens existants vers l'ancienne adresse.

## Expériences

Intitulé, organisation (et organisation de rattachement, ex. ministère), dates, lieu, résumé, responsabilités, compétences. **Sans date de fin, le poste est affiché « En poste »** et repris en haut de la page d'accueil.

## Articles

- Éditeur Markdown avec barre d'outils et aperçu (côte à côte sur grand écran, onglets sur petit écran). L'aperçu utilise exactement le même moteur que le site.
- Statut **Brouillon** : visible seulement dans l'aperçu du site. **Publié** : en ligne à la prochaine publication. La date est remplie automatiquement au passage en « Publié ».
- La rubrique *Articles* n'apparaît sur le site qu'à partir du premier article publié.
- Le HTML collé dans un article est affiché comme du texte (protection contre l'injection de code).

## Profil et compétences

- **Profil** : nom, titre professionnel, accroche et introduction de l'accueil, biographie (page À propos), e-mail et localisation publics, liens sociaux, CV (PDF envoyé dans la médiathèque), photo facultative, principes de travail.
- **Compétences** : groupes (nom, courte description, éléments), réordonnables.

## Médias

- Glissez une image ou cliquez « choisissez un fichier ». Formats : WebP, PNG, JPEG, AVIF, PDF ; 4 Mo maximum.
- Les images sont réduites à 2400 px et converties en WebP **dans votre navigateur** avant l'envoi. Au moment de la publication, le site produit en plus les tailles adaptées à chaque écran.
- Cliquez un média pour : renseigner son **texte alternatif par défaut** (proposé quand vous le choisissez dans un contenu), le **remplacer** (même nom, donc tous les contenus qui l'utilisent sont mis à jour ; même format exigé), le **supprimer** (refusé tant qu'un contenu l'utilise ; la liste des contenus concernés s'affiche).
- Dans un formulaire, « Choisir une image dans la médiathèque » permet aussi d'envoyer directement une nouvelle image.

## Référencement

Valeurs par défaut (nom du site, description, image de partage) et réglages par page : titre, description, image, « ne pas indexer ». Champs vides = valeurs par défaut.

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

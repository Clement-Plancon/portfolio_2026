# Déploiement sur Netlify

Ce guide part d'un compte Netlify et du dépôt `Clement-Plancon/portfolio_2026` sur GitHub. Compter 20 minutes.

> **Ce qui a été testé et ce qui ne l'a pas été.**
>
> - **Tests automatisés** : tout le code (site, API, authentification, interface d'administration) est couvert, avec un GitHub simulé et un stockage partagé simulé.
> - **Hors des tests** : la fonction compilée a aussi été exécutée contre le serveur Netlify Blobs local fourni par `@netlify/blobs`.
> - **Non exécuté** : les étapes de ce guide n'ont pas pu être faites pendant le développement, faute de compte connecté. Cela concerne les variables dans Netlify, Netlify Blobs en production, le jeton GitHub réel et les déploiements.
>
> La liste de contrôle en fin de document dit quoi vérifier une fois en ligne.

## 1. Connecter le dépôt

1. Netlify → **Add new project** → **Import an existing project** → GitHub → choisir `portfolio_2026`.
2. Les réglages de build sont lus dans `netlify.toml` : commande `npm run build`, dossier `dist`, Node 22. Ne rien modifier.
3. Lancer le premier déploiement. Le site public fonctionne déjà. Tant que les étapes 3 et 5 ne sont pas faites, `/admin/` affiche « L'administration n'est pas configurée » et l'API refuse tout.

## 2. Domaine

Netlify → **Domain management** → ajouter `clementplancon.fr`, puis `www.clementplancon.fr` en redirection vers le domaine principal. Activer HTTPS (certificat Let's Encrypt automatique).

## 3. Générer le mot de passe et le secret de session (sur votre PC)

L'administration n'a qu'un compte : le vôtre, protégé par un mot de passe que vous choisissez. Netlify ne reçoit jamais ce mot de passe. Il ne reçoit que son **hachage Argon2id** et un **secret de session**, deux valeurs générées sur votre ordinateur.

Prérequis : Node.js 22 ou plus récent ([nodejs.org](https://nodejs.org), version LTS) et une copie du dépôt.

Dans **PowerShell**, l'**Invite de commandes** ou **Windows Terminal** (ouverts dans le dossier du dépôt) :

```powershell
npm install
npm run admin:setup
```

1. Tapez le mot de passe. **Rien ne s'affiche pendant la saisie, c'est normal.** Validez avec Entrée, puis confirmez-le.
   - Exigences : 14 caractères minimum, assez imprévisible, sans être construit sur vos noms ou sur un mot de passe courant.
   - Une phrase de plusieurs mots convient très bien, par exemple quatre mots sans lien entre eux.
   - Si le mot de passe est refusé, la raison s'affiche et la commande vous en redemande un.
2. La commande affiche deux valeurs :
   - `ADMIN_PASSWORD_HASH` (commence par `$argon2id$v=19$m=65536,t=3,p=1$`) ;
   - `ADMIN_SESSION_SECRET` (43 caractères).
3. Gardez le terminal ouvert pour l'étape 5, puis fermez-le. Rien n'est écrit sur le disque : ni le mot de passe, ni ces valeurs.

Rangez le mot de passe dans votre gestionnaire de mots de passe. Il n'existe aucune procédure « mot de passe oublié » par e-mail ; en cas de perte, voir la section *Récupérer l'accès* de [admin-guide.md](admin-guide.md).

> **Git Bash** ne permet pas de masquer la saisie ; la commande le signale et s'arrête. Utilisez PowerShell, ou `winpty npm.cmd run admin:setup` dans Git Bash.

## 4. Netlify Blobs (rien à faire)

Les sessions et les compteurs de tentatives de connexion sont stockés dans **Netlify Blobs** (magasin `admin-auth`), partagé par toutes les instances de la fonction. Netlify Blobs est fourni automatiquement aux fonctions : il n'y a ni réglage ni clé à créer.

## 5. Créer le jeton GitHub

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access** : *Only select repositories* → `portfolio_2026`.
3. **Permissions** du dépôt :
   - **Contents** : Read and write (lire et écrire les contenus, créer la branche de brouillon, fusionner) ;
   - **Commit statuses** : Read-only (afficher l'état des déploiements Netlify) ;
   - **Metadata** : Read-only (obligatoire, ajouté automatiquement).
4. Choisir une expiration (par exemple 1 an) et noter la date : à l'expiration, l'admin affichera « GitHub refuse l'accès » ; il suffit alors de régénérer le jeton et de remplacer la variable.

## 6. Variables d'environnement

Netlify → **Project configuration → Environment variables** (modèle : `.env.example`) :

| Variable | Valeur | Portée |
|---|---|---|
| `GITHUB_TOKEN` | le jeton de l'étape 5 | Functions uniquement, **secret** |
| `GITHUB_REPO` | `Clement-Plancon/portfolio_2026` | Functions |
| `GITHUB_BRANCH` | `main` | Functions |
| `GITHUB_DRAFT_BRANCH` | `cms-draft` | Functions |
| `ADMIN_PASSWORD_HASH` | valeur affichée par `npm run admin:setup` | Functions uniquement, **secret** |
| `ADMIN_SESSION_SECRET` | valeur affichée par `npm run admin:setup` | Functions uniquement, **secret** |
| `PREVIEW_URL` | `https://cms-draft--<nom-du-projet>.netlify.app` | Functions |
| `CMS_AUTHOR_NAME`, `CMS_AUTHOR_EMAIL` | facultatif : auteur affiché sur les commits du CMS | Functions |

Pour chaque variable secrète :

1. **Add a variable** et saisissez le nom (`ADMIN_PASSWORD_HASH`…).
2. Cochez **Contains secret values**.
3. Dans **Scopes**, ne gardez que **Functions**.
4. Utilisez la même valeur pour tous les contextes de déploiement, y compris *Branch deploys* : l'aperçu `cms-draft` sert la même administration.
5. Collez la valeur **telle quelle**, sans espace ni guillemet. Les `$` du hachage font partie de la valeur.

Une valeur secrète ne peut plus être relue dans Netlify après enregistrement (seulement remplacée). C'est voulu : pour la changer, on en génère une nouvelle.

Si vous utilisez la CLI Netlify plutôt que l'interface : en PowerShell, mettez la valeur du hachage entre **apostrophes** (`'$argon2id$…'`), sinon PowerShell interprète les `$`.

Puis **Deploys → Trigger deploy** pour que la fonction prenne les variables.

L'ancienne variable `ADMIN_EMAILS` n'est plus utilisée et peut être supprimée. Si Netlify Identity avait été activé, il peut être désactivé : **Project configuration → Identity → Disable Identity**.

## 7. Activer l'aperçu (déploiement de branche)

Netlify → **Project configuration → Build & deploy → Branches and deploy contexts** → **Branch deploys : Let me add individual branches** → ajouter `cms-draft`.

La branche n'existe qu'après le premier enregistrement dans l'admin ; son URL est `https://cms-draft--<nom-du-projet>.netlify.app` (à reporter dans `PREVIEW_URL`). Ce déploiement affiche les contenus masqués et les brouillons, et il est fermé aux moteurs de recherche.

## 8. Première connexion

1. Ouvrez `https://clementplancon.fr/admin/`. L'écran « Administration » ne demande que le **mot de passe**.
2. Saisissez le mot de passe choisi à l'étape 3, puis **Se connecter**. Le tableau de bord s'affiche.

Fonctionnement de la session :

- Elle dure **8 heures au plus**, et se ferme après **2 heures sans activité**.
- Si elle expire pendant une saisie, l'administration redemande le mot de passe sans perdre le formulaire ouvert.
- **Se déconnecter** ferme la session sur le serveur.
- **Paramètres → Fermer toutes les sessions** ferme celles de tous les appareils.

Messages possibles :

- Un mauvais mot de passe affiche « Connexion refusée. Vérifiez le mot de passe. ».
- Après 5 essais manqués en 15 minutes, la connexion est bloquée pour cette adresse IP. Le blocage dure 15 minutes, puis double à chaque récidive, jusqu'à 24 heures. Le message est alors « Trop de tentatives. Réessayez plus tard. ».

## 9. Ajouter un projet et publier

1. **Projets → + Nouveau projet**, remplir au moins le titre et le résumé, **Enregistrer**. Le projet est créé masqué.
2. Activer **Visible sur le site** (ou l'œil dans la liste) quand il est prêt.
3. **Voir l'aperçu** (barre du haut) : environ une minute après l'enregistrement, le site de prévisualisation est à jour.
4. **Publier le site** → confirmer. Netlify reconstruit la production (environ une minute) ; le tableau de bord indique « Site public : en ligne » quand c'est terminé.

## Développement local

```bash
npm install
npm run dev          # site public sur http://localhost:4321
```

L'administration a besoin de la fonction et de Netlify Blobs : utiliser la [CLI Netlify](https://docs.netlify.com/cli/get-started/) liée au projet (`netlify link`, puis `netlify dev`) avec un fichier `.env` local (non versionné, ignoré par Git) basé sur `.env.example`, rempli avec `npm run admin:setup`. La CLI fournit Netlify Blobs en local. En local, le cookie de session (`Secure`) n'est accepté que sur `http://localhost`, pas sur une adresse IP du réseau. Conseillé : un jeton GitHub de test sur un dépôt de test.

Contrôles :

```bash
npm run check        # types (astro check)
npm run lint         # Biome
npm test             # tests unitaires et API (Vitest)
npm run test:e2e     # navigateur (Playwright) : construit puis sert le site
```

## Vérifications en conditions réelles

À faire une fois les étapes 1 à 7 terminées (non vérifiable sans les comptes) :

- [ ] `/admin/` affiche le formulaire « Administration » (mot de passe seul), sans « L'administration n'est pas configurée ».
- [ ] Connexion avec le bon mot de passe ; « Connexion refusée » avec un mauvais.
- [ ] Dans les outils de développement du navigateur (Application → Cookies), le cookie `__Host-cms_session` est marqué *HttpOnly*, *Secure*, *SameSite Strict*.
- [ ] 6 mauvais mots de passe de suite : le 6ᵉ essai affiche « Trop de tentatives », même avec le bon mot de passe. Attendre 15 minutes, ou se connecter depuis une autre connexion (4G).
- [ ] Netlify → **Blobs** : le magasin `admin-auth` contient des entrées `session/…` et `limit/…`.
- [ ] `curl -i https://clementplancon.fr/api/admin/content` sans session renvoie **401**.
- [ ] Modifier un projet, enregistrer : un commit « CMS : … » apparaît sur `cms-draft` dans GitHub.
- [ ] Recharger la page : la modification est toujours là.
- [ ] Le déploiement de branche `cms-draft` se construit et montre la modification ; le tableau de bord affiche son état.
- [ ] Publier : `main` reçoit la fusion, la production se reconstruit et affiche la modification.
- [ ] Envoyer une image (JPEG de téléphone) : elle est réduite et convertie en WebP, puis apparaît sur le site après publication.
- [ ] Se déconnecter : `/admin/` redemande le mot de passe, et l'entrée `session/…` correspondante disparaît des Blobs.
- [ ] Changer `ADMIN_SESSION_SECRET` puis redéployer : la session ouverte est fermée.
- [ ] Les en-têtes de sécurité sont présents (`curl -I https://clementplancon.fr/`).
- [ ] Google Search Console et Bing Webmaster Tools : propriété vérifiée, `https://clementplancon.fr/sitemap-index.xml` soumis.

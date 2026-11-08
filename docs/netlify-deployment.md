# Déploiement sur Netlify

Ce guide part d'un compte Netlify et du dépôt `Clement-Plancon/portfolio_2026` sur GitHub. Compter 20 minutes.

> **Ce qui a été testé et ce qui ne l'a pas été.** Tout le code (site, API, interface d'administration) est couvert par des tests automatisés avec un GitHub simulé et un service d'identité simulé. Les étapes de ce guide — Identity réel, e-mails d'invitation, jeton GitHub réel, déploiements Netlify — **n'ont pas pu être exécutées** pendant le développement (aucun compte n'était connecté). La liste de contrôle en fin de document dit quoi vérifier une fois en ligne.

## 1. Connecter le dépôt

1. Netlify → **Add new project** → **Import an existing project** → GitHub → choisir `portfolio_2026`.
2. Les réglages de build sont lus dans `netlify.toml` : commande `npm run build`, dossier `dist`, Node 22. Ne rien modifier.
3. Lancer le premier déploiement. Le site public fonctionne déjà ; `/admin/` affichera « Netlify Identity n'est pas activé » tant que l'étape 3 n'est pas faite.

## 2. Domaine

Netlify → **Domain management** → ajouter `clementplancon.fr`, puis `www.clementplancon.fr` en redirection vers le domaine principal. Activer HTTPS (certificat Let's Encrypt automatique).

## 3. Activer Identity et fermer les inscriptions

1. Netlify → **Project configuration → Identity** → **Enable Identity**.
2. **Registration preferences** → **Invite only**. Personne ne peut créer de compte seul.
3. **External providers** : n'en ajouter aucun (connexion par e-mail et mot de passe uniquement).
4. **Emails** : les modèles par défaut conviennent. Leurs liens pointent vers la racine du site ; le site les renvoie automatiquement vers `/admin/` (voir `src/scripts/site.ts`). Vous pouvez seulement personnaliser l'expéditeur et le texte.

## 4. Inviter le compte administrateur

1. Identity → **Invite users** → saisir votre adresse.
2. Ouvrir l'e-mail reçu, cliquer le lien (vers `/admin/`), choisir un mot de passe de 12 caractères minimum.
3. Le compte existe, mais **n'a pas encore accès** : l'API vérifie aussi la liste `ADMIN_EMAILS` (étape 6).

Aucun identifiant n'est écrit dans le code. Les mots de passe sont stockés et vérifiés uniquement par Netlify Identity.

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
| `ADMIN_EMAILS` | votre adresse (plusieurs : séparées par des virgules) | Functions |
| `PREVIEW_URL` | `https://cms-draft--<nom-du-projet>.netlify.app` | Functions |

Puis **Deploys → Trigger deploy** pour que la fonction prenne les variables.

## 7. Activer l'aperçu (déploiement de branche)

Netlify → **Project configuration → Build & deploy → Branches and deploy contexts** → **Branch deploys : Let me add individual branches** → ajouter `cms-draft`.

La branche n'existe qu'après le premier enregistrement dans l'admin ; son URL est `https://cms-draft--<nom-du-projet>.netlify.app` (à reporter dans `PREVIEW_URL`). Ce déploiement affiche les contenus masqués et les brouillons, et il est fermé aux moteurs de recherche.

## 8. Se connecter à /admin

`https://clementplancon.fr/admin/` → e-mail et mot de passe. « Mot de passe oublié » envoie un lien de réinitialisation. La session se renouvelle seule tant que l'onglet est ouvert ; après expiration, l'admin redemande la connexion sans perdre le formulaire en cours.

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

L'administration a besoin d'Identity et de la fonction : utiliser la [CLI Netlify](https://docs.netlify.com/cli/get-started/) liée au projet (`netlify link`, puis `netlify dev`) avec un fichier `.env` local (non versionné) basé sur `.env.example`. Conseillé : un jeton GitHub de test sur un dépôt de test.

Contrôles :

```bash
npm run check        # types (astro check)
npm run lint         # Biome
npm test             # tests unitaires et API (Vitest)
npm run test:e2e     # navigateur (Playwright) : construit puis sert le site
```

## Vérifications en conditions réelles

À faire une fois les étapes 1 à 7 terminées (non vérifiable sans les comptes) :

- [ ] L'e-mail d'invitation arrive et le lien mène au formulaire « Créer votre mot de passe » sur `/admin/`.
- [ ] Connexion avec le bon mot de passe ; erreur claire avec un mauvais.
- [ ] Un compte invité mais absent de `ADMIN_EMAILS` voit « Accès refusé ».
- [ ] `curl -i https://clementplancon.fr/api/admin/content` sans session renvoie **401**.
- [ ] Modifier un projet, enregistrer : un commit « CMS : … » apparaît sur `cms-draft` dans GitHub.
- [ ] Recharger la page : la modification est toujours là.
- [ ] Le déploiement de branche `cms-draft` se construit et montre la modification ; le tableau de bord affiche son état.
- [ ] Publier : `main` reçoit la fusion, la production se reconstruit et affiche la modification.
- [ ] Envoyer une image (JPEG de téléphone) : elle est réduite et convertie en WebP, puis apparaît sur le site après publication.
- [ ] Se déconnecter : `/admin/` redemande la connexion.
- [ ] Mot de passe oublié : l'e-mail arrive, le lien permet de choisir un nouveau mot de passe.
- [ ] Les en-têtes de sécurité sont présents (`curl -I https://clementplancon.fr/`).
- [ ] Google Search Console et Bing Webmaster Tools : propriété vérifiée, `https://clementplancon.fr/sitemap-index.xml` soumis.

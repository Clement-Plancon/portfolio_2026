# Déploiement sur Netlify

Ce guide part d'un compte Netlify et du dépôt `Clement-Plancon/portfolio_2026` sur GitHub. Compter 15 minutes.

Depuis novembre 2026, le contenu du site vit dans **Netlify Blobs** et la page est rendue à la demande (Astro SSR). Conséquences :

- **Pas de lien entre l'administration et GitHub** : pas de jeton GitHub, pas de branche `cms-draft`, pas d'aperçu par déploiement de branche, pas de commit à chaque modification.
- **Publication immédiate** : publier ne redéploie rien, la page publique change aussitôt.
- **GitHub sert au code** : il ne sert qu'au code source et déclenche les déploiements techniques. Un déploiement ne touche jamais au contenu.
- **Deux variables seulement** : `ADMIN_PASSWORD_HASH` et `ADMIN_SESSION_SECRET`.

> **Ce qui a été testé et ce qui ne l'a pas été.**
>
> - **Testé en local** : tout le code (site, API, authentification, administration) est couvert par des tests automatisés. Les tests navigateur tournent sur `netlify serve --offline`, qui exécute la vraie fonction SSR avec Netlify Blobs émulé. `netlify build --offline` réussit.
> - **Non vérifié** : le fonctionnement sur le vrai compte Netlify n'a pas pu être vérifié (aucun compte connecté). Cela concerne Netlify Blobs en production, la purge du cache CDN et les variables.
>
> La liste de contrôle en fin de document dit quoi vérifier une fois en ligne.

## 1. Connecter le dépôt

1. Netlify → **Add new project** → **Import an existing project** → GitHub → choisir `portfolio_2026`.
2. Les réglages de build sont lus dans `netlify.toml` : commande `npm run build`, dossier `dist`, Node 22. Ne rien modifier.
3. Lancer le premier déploiement. Le site public fonctionne déjà : à la première visite, le contenu de `src/content` est copié dans Netlify Blobs (voir *Initialisation* ci-dessous). Tant que les étapes 3 et 5 ne sont pas faites, `/admin/` affiche « L'administration n'est pas configurée » et l'API refuse tout.

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

Netlify Blobs est fourni automatiquement au site : il n'y a ni réglage, ni clé, ni base de données à créer. Trois magasins sont utilisés :

| Magasin | Contenu |
|---|---|
| `cms` | `published` (contenu en ligne), `draft` (brouillon), `history/…` (20 dernières versions publiées), `backups/…` (copies automatiques) |
| `cms-media` | fichiers des médias (images, PDF), nommés par leur empreinte SHA-256 |
| `admin-auth` | sessions et compteurs de tentatives de connexion |

Ils sont visibles dans Netlify → **Blobs**.

### Initialisation

À la première requête qui a besoin du contenu (visite de `/` ou ouverture de l'administration), si `published` n'existe pas encore :

1. Les fichiers versionnés sont copiés dans Blobs : `src/content/**` et les médias de `src/assets/media` et `public/files`.
2. Une copie de ce contenu est enregistrée dans `backups/<date>-initialisation`.

L'opération est **idempotente**. L'écriture est conditionnelle (« seulement si absent ») : un redéploiement, ou deux visites simultanées, ne remplacent jamais un contenu existant. Après l'initialisation, `src/content` ne sert plus qu'à cela, et ses modifications dans Git n'ont **plus d'effet** sur le site.

## 5. Variables d'environnement

Netlify → **Project configuration → Environment variables** (modèle : `.env.example`) :

| Variable | Valeur | Portée |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | valeur affichée par `npm run admin:setup` | Functions uniquement, **secret** |
| `ADMIN_SESSION_SECRET` | valeur affichée par `npm run admin:setup` | Functions uniquement, **secret** |

Si elles sont déjà configurées, ne les changez pas : la migration n'oblige pas à recréer le mot de passe.

Pour chaque variable :

1. **Add a variable** et saisissez le nom.
2. Cochez **Contains secret values**.
3. Dans **Scopes**, ne gardez que **Functions**.
4. Collez la valeur **telle quelle**, sans espace ni guillemet : les `$` du hachage font partie de la valeur.

Une valeur secrète ne peut plus être relue dans Netlify après enregistrement : elle peut seulement être remplacée. Si vous utilisez la CLI Netlify en PowerShell, mettez la valeur du hachage entre **apostrophes** (`'$argon2id$…'`).

Puis **Deploys → Trigger deploy**.

**Variables devenues inutiles**, à supprimer sans risque :

- `GITHUB_TOKEN` : révoquez aussi le jeton sur GitHub (*Settings → Developer settings → Personal access tokens*) ;
- `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_DRAFT_BRANCH`, `PREVIEW_URL` ;
- `CMS_AUTHOR_NAME`, `CMS_AUTHOR_EMAIL`, `ADMIN_EMAILS`.

**Réglages devenus inutiles** :

- le déploiement de branche `cms-draft` (*Branches and deploy contexts*) ;
- la branche `cms-draft` sur GitHub, si elle existe.

## 6. Première connexion

1. Ouvrez `https://clementplancon.fr/admin/`. L'écran « Administration » ne demande que le **mot de passe**.
2. Saisissez le mot de passe choisi à l'étape 3, puis **Se connecter**. Le tableau de bord s'affiche, avec les 6 projets existants.

Fonctionnement de la session :

- Elle dure **8 heures au plus**, et se ferme après **2 heures sans activité**.
- Si elle expire pendant une saisie, l'administration redemande le mot de passe sans perdre le formulaire ouvert.
- **Se déconnecter** ferme la session sur le serveur.
- **Paramètres → Fermer toutes les sessions** ferme celles de tous les appareils.

Messages possibles :

- Un mauvais mot de passe affiche « Connexion refusée. Vérifiez le mot de passe. ».
- Après 5 essais manqués en 15 minutes, la connexion est bloquée pour cette adresse IP. Le blocage dure 15 minutes, puis double à chaque récidive, jusqu'à 24 heures. Le message est alors « Trop de tentatives. Réessayez plus tard. ».

## 7. Modifier et publier

1. **Projets → SafePing** (par exemple), modifier le résumé, **Enregistrer**. La modification est dans le **brouillon** : le site public ne change pas.
2. **Voir l'aperçu** (barre du haut) : la page complète avec le brouillon, sur `/admin/apercu/`. Seule votre session y a accès ; la page n'est jamais mise en cache ni indexée.
3. **Publier le site** → confirmer. Le message « Publié : le site public est à jour. » s'affiche, et `https://clementplancon.fr/` montre la modification à la visite suivante. Il n'y a ni commit ni build.

## Cache

- **La page publique** :
  - Elle est rendue à la demande, puis conservée par le CDN de Netlify (`Netlify-CDN-Cache-Control: durable`, étiquette `cms-public`) jusqu'à la publication suivante, qui la purge.
  - Le navigateur revérifie à chaque visite (`max-age=0, must-revalidate`).
  - Les visiteurs reçoivent donc une page servie par le CDN, sans exécuter la fonction, sauf juste après une publication.
- **Les médias publiés** (`/media/…`, `/files/…`) :
  - Leur adresse contient l'empreinte du fichier (`?v=…`) : ils sont mis en cache un an (`immutable`).
  - Un fichier remplacé obtient une nouvelle adresse.
- **Les réponses privées** (administration, API, aperçu, médias non publiés) : `no-store`. Aucune n'est conservée par le CDN.
- **Si une purge échoue** : l'administration le signale après la publication. **Paramètres → Vider le cache** relance la purge.

## Retour arrière

- **Contenu** :
  - Les 20 dernières versions publiées sont dans `cms/history/`.
  - Une sauvegarde téléchargée (Paramètres) se restaure dans le brouillon, puis se publie.
- **Code** : un redéploiement d'une version précédente (*Deploys → … → Publish deploy*) ne touche pas au contenu.
- **Revenir à l'ancien fonctionnement** (site statique, CMS par GitHub, état du commit `f3caf40`), en cas de besoin :
  1. Télécharger une sauvegarde **avec les fichiers**, puis lancer `node scripts/backup-to-files.mjs <sauvegarde.json>`. Le contenu actuel est réécrit dans `src/content` et `src/assets/media`.
  2. Committer.
  3. Revenir au code de `f3caf40` (`git revert` des commits de la migration).
  4. Recréer les variables GitHub de l'ancienne version et le déploiement de branche `cms-draft`.
- **Réinitialiser le contenu depuis le dépôt** : supprimer la clé `published` du magasin `cms` (`npx netlify blobs:delete cms published`). Elle est recréée à partir de `src/content` à la visite suivante. C'est irréversible : téléchargez une sauvegarde avant.

## Développement local

```bash
npm install
cp .env.example .env     # puis y coller les valeurs de `npm run admin:setup`
npx netlify serve --offline   # build de production + fonction SSR + Netlify Blobs émulé : http://localhost:8888
npm run dev              # ou : serveur de développement Astro (http://localhost:4321)
```

- **Données locales** : `netlify serve` stocke les Blobs dans `.netlify/blobs-serve/` (ignoré par Git). Supprimer ce dossier repart du contenu de `src/content`.
- **Cookie de session** : il est `Secure`, donc accepté sur `http://localhost` mais pas sur une adresse IP du réseau.
- **Variable `NODE_OPTIONS`** : si votre environnement définit des options que Node refuse dans les « workers », la CLI échoue en 500 (`--use-openssl-ca is not allowed`). Lancez-la avec `NODE_OPTIONS=` vide.

Contrôles :

```bash
npm run check        # types (astro check)
npm run lint         # Biome
npm test             # tests unitaires et API (Vitest)
npm run test:e2e     # navigateur (Playwright) sur `netlify serve --offline` (Blobs vidés à chaque lancement)
```

## Vérifications en conditions réelles

À faire une fois les étapes 1 à 7 terminées (non vérifiable sans le compte Netlify) :

- [ ] `/admin/` affiche le formulaire « Administration » (mot de passe seul), sans « L'administration n'est pas configurée ».
- [ ] Connexion avec le bon mot de passe ; « Connexion refusée » avec un mauvais.
- [ ] Dans les outils de développement du navigateur (Application → Cookies), le cookie `__Host-cms_session` est marqué *HttpOnly*, *Secure*, *SameSite Strict*.
- [ ] 6 mauvais mots de passe de suite : le 6ᵉ essai affiche « Trop de tentatives », même avec le bon mot de passe. Attendre 15 minutes, ou se connecter depuis une autre connexion (4G).
- [ ] Netlify → **Blobs** : les magasins `cms` (`published`, `backups/…-initialisation`), `cms-media` et `admin-auth` existent.
- [ ] Le tableau de bord montre les 6 projets, 3 expériences et l'image de Datametre, comme avant la migration.
- [ ] `curl -i https://clementplancon.fr/api/admin/content` sans session renvoie **401**.
- [ ] `curl -I https://clementplancon.fr/` : `cache-control: public, max-age=0, must-revalidate` et un en-tête `cache-status` de Netlify (« hit » à la deuxième requête).
- [ ] Modifier un projet, enregistrer : le site public ne change pas ; recharger l'administration : la modification est toujours là.
- [ ] **Voir l'aperçu** montre la modification ; la même adresse dans une fenêtre privée renvoie vers `/admin/`.
- [ ] Publier : le message « Publié : le site public est à jour. » s'affiche (pas l'avertissement de cache), et `https://clementplancon.fr/` montre la modification **sans aucun déploiement** dans l'onglet *Deploys*.
- [ ] Envoyer une image (JPEG de téléphone) : elle est réduite et convertie en WebP ; son adresse publique `/media/…` renvoie 404 avant publication, 200 après.
- [ ] Déclencher un redéploiement (*Trigger deploy*) : le contenu modifié reste en ligne (aucune réinitialisation).
- [ ] Paramètres → **Télécharger une sauvegarde** : le fichier s'ouvre et contient les projets.
- [ ] Se déconnecter : `/admin/` redemande le mot de passe, et l'entrée `session/…` correspondante disparaît des Blobs.
- [ ] Changer `ADMIN_SESSION_SECRET` puis redéployer : la session ouverte est fermée.
- [ ] Les en-têtes de sécurité sont présents (`curl -I https://clementplancon.fr/`).
- [ ] Google Search Console et Bing Webmaster Tools : propriété vérifiée, `https://clementplancon.fr/sitemap-index.xml` soumis.

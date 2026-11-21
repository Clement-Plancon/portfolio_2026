# Architecture

## En une phrase

Une **page unique Astro rendue à la demande** (SSR sur Netlify, mise en cache par le CDN) à partir d'un contenu stocké dans **Netlify Blobs**, édité depuis une **administration Preact** via une **API protégée par une authentification propre au site** (un administrateur, mot de passe Argon2id). GitHub ne sert qu'au code : aucune modification de contenu ne crée de commit ni de déploiement.

```
Visiteur ── GET / ────────▶ CDN Netlify ──(absent du cache)──▶ fonction SSR : rend la page depuis cms/published
          ◀── page (mise en cache, étiquette cms-public) ───────
Visiteur ── GET /media/x.webp?v=<empreinte> ──▶ fichier publié (cms-media), cache 1 an

Admin ── /api/admin/auth/login ─▶ fonction SSR : Argon2id, limite de tentatives ─▶ Blobs admin-auth
      ◀── cookie __Host-cms_session (HttpOnly, Secure, SameSite=Strict, signé)
      ── Enregistrer ───────────▶ API : session + CSRF + zod ─▶ écriture conditionnelle de cms/draft
      ── Voir l'aperçu ─────────▶ /admin/apercu/ : la page rendue depuis cms/draft (session exigée, no-store)
      ── Publier ───────────────▶ API : cms/history/<n> ← ancienne version ; cms/published ← brouillon (1 écriture)
                                   puis purge du CDN (étiquette cms-public) : le site est à jour, sans build
```

## Pourquoi ces choix

| Besoin | Choix | Raison |
|---|---|---|
| Publier sans attendre | Astro SSR (`@astrojs/netlify`) + contenu dans Netlify Blobs | Une publication est une écriture dans Blobs et une purge du cache. Pas de build, pas de commit, pas de jeton GitHub. C'est le principe du portfolio de Christian Plançon, adapté à un vrai brouillon (voir plus bas). |
| Site rapide malgré le SSR | Cache CDN « durable » jusqu'à la publication suivante | Les visiteurs reçoivent une page servie par le CDN, sans exécuter la fonction ; seule la première visite après une publication la rend. |
| Stockage sans base de données | Netlify Blobs (cohérence forte, écritures conditionnelles) | Fourni par Netlify, sans compte ni clé. Le contenu tient en un document JSON de quelques dizaines de Ko. |
| Authentification | Propre au site : Argon2id (`hash-wasm`, sans binaire natif) + sessions signées, stockées dans Netlify Blobs | Un seul administrateur : ni invitations ni e-mails. Le mot de passe ne quitte jamais le serveur et n'est stocké que haché ; les secrets se génèrent en local (`npm run admin:setup`). |
| Aperçu fidèle et privé | `/admin/apercu/` rend la même page (`OnePage.astro`) avec le brouillon | Le même composant sert la page publique et l'aperçu : ce que l'on voit est ce qui sera publié. |
| Interface d'administration | Preact | Formulaires riches sans alourdir le site public (Preact n'est chargé que sur `/admin/`). |

### Ce qui vient du portfolio de Christian, ce qui diffère

- **Repris** :
  - Astro SSR avec l'adaptateur Netlify ;
  - documents JSON dans Blobs, validés par zod à l'écriture **et** à la lecture ;
  - initialisation par `onlyIfNew` ;
  - purge du CDN par étiquette ;
  - fichiers uploadés dans Blobs ;
  - sauvegarde et restauration en JSON.
- **Différent** :
  - Chez Christian, chaque enregistrement est en ligne aussitôt (un projet n'a qu'un statut brouillon ou publié). Ici, **Enregistrer** modifie un brouillon global et **Publier** met tout en ligne d'un coup : le fonctionnement que l'administration avait avec GitHub est conservé.
  - Les écritures sont conditionnelles (ETag), pour ne jamais perdre une modification faite dans un autre onglet.
  - La publication est atomique, en une seule écriture.
  - Les versions publiées sont historisées.
  - Les fichiers sont adressés par leur empreinte, ce qui sépare les médias publiés des médias privés.
  - L'authentification Argon2id existante est conservée (Christian utilise bcrypt).

## Arborescence

```
src/
  content/            Contenu d'ORIGINE (JSON) : copié dans Blobs à l'initialisation, plus lu ensuite
  assets/media/       Médias d'origine (copiés dans Blobs à l'initialisation)
  lib/
    schemas.ts          Schémas zod : validation à chaque écriture et lecture
    content-types.ts    Types de contenu et leurs chemins (clés des entrées)
    snapshot.ts         Le contenu comme un document : validation, données de la page, URL des médias
    seed.ts             src/content + médias embarqués dans la fonction, pour l'initialisation
    media.ts  content.ts  format.ts  structured-data.ts  stocks.ts
  components/OnePage.astro   La page complète, pour « / » et pour l'aperçu
  pages/
    index.astro                 « / » (SSR, cache CDN)
    admin/index.astro           Coquille de l'administration (statique)
    admin/apercu/index.astro    Aperçu du brouillon (SSR, session exigée)
    api/admin/[...path].ts      API d'administration
    media/[name].ts  files/[name].ts   Médias publiés
    404.astro  robots.txt.ts  sitemap-*.xml.ts   Statiques
  admin/              Application d'administration (Preact)
  server/
    content-store.ts    Brouillon, publication, médias, historique, sauvegardes
    blob-store.ts       Accès à Netlify Blobs (et version en mémoire pour les tests)
    handler.ts          Routeur de l'API (testé sans Netlify)
    session.ts  auth.ts Authentification
    runtime.ts          Branchement sur Netlify (magasins, purge du cache)
    public-cache.ts  media-route.ts  media.ts  http.ts
scripts/
  admin-setup.mjs       npm run admin:setup : hachage du mot de passe et secret de session
  backup-to-files.mjs   Réécrit une sauvegarde dans src/content (copie dans Git, retour arrière)
  generate-og.mjs       Image de partage
tests/unit/           Vitest : magasin de contenu, API, authentification, script de sauvegarde, schémas…
tests/e2e/            Playwright sur `netlify serve --offline` : page publique, chaîne complète admin → public
```

## Données (Netlify Blobs)

| Magasin / clé | Contenu |
|---|---|
| `cms` / `published` | Le contenu en ligne : `{ format, rev, updatedAt, entries, media }` |
| `cms` / `draft` | Le brouillon, même forme ; « en attente » = différent de `published` |
| `cms` / `history/<rev>` | Les 20 dernières versions publiées |
| `cms` / `backups/<date>-initialisation` | Copie faite à l'initialisation |
| `cms` / `backups/<date>-avant-restauration` | Copie faite avant chaque restauration |
| `cms-media` / `<sha256>` | Octets d'un fichier (image, PDF) |
| `admin-auth` / `session/…`, `limit/…` | Sessions et compteurs de tentatives |

- **Entrées** : `entries` associe le chemin historique d'un contenu (`src/content/projects/safeping.json`…) à ses données. Les identifiants, l'ordre (`order`), la visibilité (`visible`) et les dates (`updatedAt`) sont ceux des fichiers d'origine.
- **Médias** : `media` associe une référence (`media/x.webp`, `files/cv.pdf`) à `{ sha, size, contentType }`.
- **Validation** : chaque document est validé par les schémas zod à l'écriture et à la lecture.

## Modèle de publication

- **Enregistrer** : écriture conditionnelle de `draft`, créé à partir de `published` au premier enregistrement. Le site public ne change pas.
- **Aperçu** :
  - `/admin/apercu/` rend la page avec `draft`, contenus masqués compris ;
  - session exigée, sinon redirection vers `/admin/` ;
  - réponse `private, no-store` et `X-Robots-Tag: noindex` ;
  - les images y passent par l'API privée.
- **Publier** :
  1. le brouillon est validé en entier, et ses fichiers doivent tous exister ;
  2. la version en ligne est copiée dans `history/` ;
  3. `published` est remplacé **en une seule écriture conditionnelle** : il n'y a jamais de publication partielle ;
  4. le CDN est purgé.

  Si la purge échoue, le contenu est publié, mais l'administration le signale et propose « Vider le cache ».
- **Abandonner** : `draft` redevient une copie de `published`.
- **Masquer** : le champ `visible`. Un contenu masqué apparaît dans l'aperçu, jamais sur la page publique.

## Concurrence et erreurs

- **Contrôle des conflits** :
  - L'administration envoie avec chaque modification l'empreinte de l'entrée qu'elle a chargée. Si l'entrée a changé entre-temps, la réponse est **409** et rien n'est écrit.
  - Créer un identifiant qui existe déjà renvoie aussi 409.
- **Écritures concurrentes** : chaque écriture de `draft` ou de `published` est conditionnelle (`onlyIfMatch` sur l'ETag, ou `onlyIfNew`).
  - Si une autre écriture passe avant, l'opération est rejouée sur les données à jour, avec les mêmes vérifications, au plus 6 fois.
  - Deux onglets qui modifient deux projets différents voient donc tous deux leur modification enregistrée.
  - Deux onglets qui modifient le même projet : le second reçoit 409.
- **Publications simultanées** : une seule réussit, l'autre reçoit 409.
- **Contenu invalide** : il est refusé à l'enregistrement (422). Un brouillon endommagé par un autre chemin ne peut pas être publié (422).
- **Blobs inaccessible pour la page publique** : la page affiche le contenu du dépôt sans le mettre en cache, plutôt qu'une erreur.

## Cache

| Réponse | En-têtes |
|---|---|
| `/` | `Cache-Control: public, max-age=0, must-revalidate` ; `Netlify-CDN-Cache-Control: public, durable, s-maxage=31536000, stale-while-revalidate=86400` ; `Netlify-Cache-Tag: cms-public` |
| `/media/…?v=<empreinte>` | `public, max-age=31536000, immutable` (l'adresse change avec le fichier) |
| `/media/…` sans version, `/files/…` | comme `/` (purgé à la publication) |
| `/api/admin/*`, `/admin/*`, `/admin/apercu/` | `no-store` (jamais en cache, jamais indexé) |

Seules les données publiées passent par une réponse cacheable. Le brouillon n'est lu que par l'API et l'aperçu, qui exigent une session et répondent `no-store`.

## Médias

- **Envoi** :
  - Les images sont réduites (2400 px au plus) et converties en WebP dans le navigateur.
  - Le serveur reconnaît le format **à partir des octets** : WebP, PNG, JPEG, AVIF ou PDF. SVG et HTML sont refusés.
  - Taille maximale : 4 Mo. Le nom du fichier est réécrit.
- **Stockage** : le fichier va dans `cms-media` sous son empreinte, et le brouillon référence cette empreinte.
- **Publié ou privé** :
  - `/media/x.webp` ne sert un fichier que s'il appartient au contenu **publié** ;
  - un fichier ajouté ou remplacé reste privé (API d'administration seulement) jusqu'à la publication ;
  - un remplacement n'affecte pas la version en ligne avant publication.
- **Suppression** : elle est refusée tant qu'un contenu utilise le média.
- **Nettoyage** : après chaque publication, les fichiers qu'aucune version conservée (brouillon, publiée, historique, copies) ne référence sont supprimés.

## Sauvegarde et restauration

- **Télécharger une sauvegarde** : un fichier JSON `{ format: "clementplancon-cms-backup", version: 1, snapshot }` avec tout le contenu éditorial et les références des médias. L'option « avec les fichiers » ajoute les octets des médias en base64.
- **Restaurer** : le fichier est validé en entier avant toute écriture.
  - Contrôles : format et version, schémas de chaque entrée, chemins connus, empreintes des fichiers joints, présence de chaque fichier référencé.
  - Contrôle de version : la restauration est refusée si le brouillon a changé depuis le chargement de la page.
  - Elle remplace le **brouillon**, jamais directement le site. Le brouillon précédent est copié dans `backups/`.
  - Elle ne touche ni au mot de passe, ni aux secrets, ni aux sessions (magasin séparé), ni aux réglages Netlify.
- **Limite** : une sauvegarde sans les fichiers ne contient pas les octets des médias. Sa restauration n'est acceptée que si les fichiers existent encore dans `cms-media` ; sinon, il faut la version « avec les fichiers ». Comme une requête vers une fonction Netlify est limitée à environ 6 Mo, une sauvegarde avec des fichiers plus lourds ne peut pas être restaurée depuis l'administration.

## Sécurité

- **Authentification** (`src/server/session.ts`) :
  - **Mot de passe** :
    - comparé côté serveur au hachage **Argon2id** de `ADMIN_PASSWORD_HASH` (m = 64 Mio, t = 3, p = 1, sel aléatoire ; le serveur refuse un hachage plus faible que m = 19 Mio, t = 2) ;
    - jamais stocké en clair ni journalisé ;
    - erreur générique en cas d'échec ;
    - corps de requête invalide, mot de passe vide ou de plus de 1024 caractères : même réponse qu'un mauvais mot de passe.
  - **Session** :
    - identifiant aléatoire de 256 bits ;
    - cookie `__Host-cms_session` signé en HMAC-SHA256, `HttpOnly; Secure; SameSite=Strict; Path=/`, sans domaine ;
    - la clé de signature est dérivée de `ADMIN_SESSION_SECRET` **et** du hachage du mot de passe ;
    - le JavaScript de l'admin ne voit jamais ni le jeton ni un secret.
  - **Expiration** : 8 h maximum, et 2 h sans activité ; vérifiées à chaque requête.
  - **Révocation** :
    - chaque session existe dans Netlify Blobs (clé = SHA-256 de l'identifiant) ;
    - la déconnexion supprime l'entrée, donc un cookie copié devient inutilisable ;
    - « Fermer toutes les sessions » supprime toutes les entrées ;
    - changer le mot de passe ou le secret change la clé de signature et invalide toutes les sessions.
  - **Limitation des tentatives** :
    - comptée **avant** la vérification, dans Netlify Blobs, avec des écritures conditionnelles (ETag), donc valable entre instances ;
    - par client (adresse IP fournie par Netlify, hachée) : 5 essais par 15 min, puis blocage de 15 min qui double à chaque récidive, jusqu'à 24 h ;
    - global : 30 essais par heure, puis 15 min de pause ;
    - en cas de conflit d'écriture répété, la tentative est refusée. La résistance aux rafales parallèles repose sur l'atomicité des écritures conditionnelles, que Netlify documente. Elle est vérifiée avec le stockage en mémoire des tests, mais pas sur Netlify. Le serveur Blobs *local* de `@netlify/blobs` ne l'applique pas de façon atomique : en local, une rafale parallèle n'est pas limitée, alors que des essais successifs le sont.
  - **Configuration absente ou invalide** : l'API répond 503 partout, connexion comprise. Le journal indique la variable en cause, jamais sa valeur.
- **CSRF** : toute requête de modification, connexion et déconnexion comprises, doit remplir trois conditions :
  - une origine identique au site, ou à ses URL Netlify (`URL`, `DEPLOY_PRIME_URL`) ;
  - `Sec-Fetch-Site: same-origin` quand le navigateur l'envoie ;
  - l'en-tête `X-CMS-Request: 1`, qu'un autre site ne peut envoyer sans pré-vol CORS, et l'API n'en accorde aucun.

  Le cookie `SameSite=Strict` complète ces vérifications.
- **Validation** : schémas zod partagés, identifiants restreints à `[a-z0-9-]`, chemins calculés côté serveur (pas de traversée), URL limitées à `http(s)` et `mailto`.
- **Aucun jeton tiers** : plus de jeton GitHub. Netlify Blobs est accessible à la fonction sans secret applicatif.
- **Médias** : type déterminé par les octets (WebP, PNG, JPEG, AVIF, PDF) ; SVG et HTML refusés ; 4 Mo max ; nom de fichier réécrit ; servis avec `nosniff` et une CSP `sandbox` ; suppression refusée si le média est encore utilisé.
- **XSS** : le site n'insère jamais de HTML non maîtrisé : tous les textes sont échappés par Astro ; la seule mise en valeur (`*mot*` de la phrase d'accroche) est convertie après échappement.
- **En-têtes** (`netlify.toml`) : CSP sans script inline (`script-src 'self'`), `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. `/admin/` (aperçu compris) et `/api/` ne sont ni mis en cache ni indexés.
- **Journaux** : seulement la route et le code d'erreur (et les blocages de connexion), jamais le corps des requêtes, le mot de passe, l'adresse IP, les cookies ni les jetons.
- **Cache** : toutes les réponses de l'API sont `Cache-Control: no-store` (les médias de l'admin : `private`).

## Une seule page

- `src/components/OnePage.astro` assemble les sections (pour `/` et pour l'aperçu) : `Hero` (introduction, `h1`), `Projects` (`#projets`), `About` (`#a-propos`), `Journey` (`#parcours`), `Skills` (`#competences`), `Contact` (`#contact`). Les ancres sont stables.
- **Projets** : chaque projet est un `<li id="projet-…">` (une ligne du sommaire, dont le titre est un vrai lien `#projet-…`) contenant son article `<dialog id="detail-…">`, **présent dans le HTML** (indexable ; sans JavaScript, l'article est imprimé sous sa ligne). Le script l'ouvre en dialogue modal (`showModal`), tient l'adresse à jour (`/#projet-…`, *Retour* le ferme) et rend le focus à la ligne à la fermeture.
- **Anciennes adresses** : `/projets/…`, `/parcours/`, `/a-propos/`, `/contact/`, `/articles/…` redirigent en 301 vers leur ancre (`netlify.toml`, testé dans `tests/unit/site.test.ts`).
- **Routes** : `/` (SSR), `/media/…` et `/files/…` (médias publiés), `/404.html`, `/admin/` et `/admin/apercu/`, `/api/admin/*`, `sitemap-*.xml`, `robots.txt`. Aucune autre page publique.
- **Données structurées** : `Person`, `ProfilePage`, et une `ItemList` de `CreativeWork` (un par projet, URL `/#projet-…`).

## Design system

Direction « Sommaire » : voir [art-direction.md](art-direction.md) pour les choix et [interaction-system.md](interaction-system.md) pour le mouvement. En code :

- **Tokens** : `src/styles/global.css` (fonds `--bg`, `--bg-2`, `--bg-3`, textes `--fg`, `--fg-2`, filets `--rule`, accent `--accent` ; voix `.display`, `.lede`, `.label`). Thème sombre par défaut, thème clair dessiné, choisis par `prefers-color-scheme`.
- **Polices** : Newsreader variable (graisse 300–500, taille optique 14–72) pour ce qui est dit ; Geist variable (réduite au latin, 25 Ko) pour ce qui organise. Auto-hébergées (`public/fonts/`). L'administration garde Newsreader et Instrument Sans.
- **Teintes des projets** : `src/lib/tints.ts` (`cover.color` du contenu ; une valeur par thème, contraste AA testé dans `tests/unit/site.test.ts`).
- **Planches** : `src/components/Plate.astro` dessine la pile d'un projet en couches (`src/lib/plate.ts` range ses technologies : interface, serveur, données, services & IA, infrastructure, démarche, autres). Dessin CSS 3D, unités de conteneur (`cqmin`) ; la capture réelle, s'il y en a une, est la feuille du dessus.
- **Script** : `src/scripts/site.ts` (6,4 Ko, 2,6 Ko compressé) : sommaire mobile, section active, en-tête qui s'efface à la lecture, apparitions, articles des projets (dialogue, adresse, historique, précédent/suivant), aperçu au pointeur, copie de l'adresse. Sans lui, tout est lisible.
- **Image de partage** : `scripts/generate-og.mjs` (la phrase d'accroche, le nom, l'index des projets), ou l'image choisie dans Référencement.
- **Images** : une seule taille par image (celle envoyée, au plus 2400 px), avec largeur et hauteur ; l'ancienne génération de variantes au build (`astro:assets`) n'existe plus, puisque les médias ne sont plus dans le dépôt.

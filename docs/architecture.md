# Architecture

## En une phrase

Un site **Astro statique d'une seule page** (HTML pré-rendu, un petit script d'amélioration progressive) dont le contenu vit dans des **fichiers JSON versionnés dans GitHub**, édités depuis une **administration Preact** qui passe par **une Netlify Function** protégée par **une authentification propre au site** (un administrateur, mot de passe Argon2id, sessions dans Netlify Blobs).

```
Navigateur (admin)                 Netlify                              GitHub
──────────────────                 ───────                              ──────
/admin/  ── mot de passe ───────▶  Function admin.mts  /api/admin/auth/login
                                     Argon2id (ADMIN_PASSWORD_HASH), limite de tentatives ──▶ Netlify Blobs
         ◀── cookie __Host-cms_session (HttpOnly, Secure, SameSite=Strict, signé)
         ── /api/admin/* ───────▶  Function admin.mts
                                     1. Origin + Sec-Fetch-Site + en-tête X-CMS-Request (mutations)
                                     2. signature HMAC, expiration, session présente ──▶ Netlify Blobs
                                     3. valide les données (zod)       ──▶ commit sur cms-draft
                                                                        ◀── (jeton GitHub, côté serveur)
                                   Build de branche cms-draft  ◀─────── push cms-draft  = APERÇU
         ── Publier ────────────▶  Function: merge cms-draft → main ──▶ merge
                                   Build de production         ◀─────── push main       = SITE PUBLIC
```

## Pourquoi ces choix

| Besoin | Choix | Raison |
|---|---|---|
| Site rapide, indexable | Astro, sortie statique | Pages pré-rendues, aucun contenu essentiel chargé en JavaScript. Optimisation d'images intégrée. Moins de dépendances que Next.js, pas de serveur. |
| Contenus durables et versionnés | Fichiers JSON dans `src/content/` | Chaque modification est un commit : historique, retour arrière, revue possible. Rien ne dépend d'une base de données. |
| Administration réelle sans serveur permanent | Une Netlify Function (`/api/admin/*`) | Compatible avec l'hébergement Netlify ; le jeton GitHub reste côté serveur. |
| Authentification | Propre au site : Argon2id (`hash-wasm`, sans binaire natif) + sessions signées, stockées dans Netlify Blobs | Un seul administrateur : ni invitations ni e-mails. Le mot de passe ne quitte jamais le serveur et n'est stocké que haché ; les secrets se génèrent en local (`npm run admin:setup`). Netlify Blobs partage sessions et compteurs entre instances, sans base de données à gérer. |
| Aperçu fidèle | Branche `cms-draft` + déploiement de branche Netlify | L'aperçu *est* le vrai site construit avec le brouillon, pas une imitation. |
| Interface d'administration | Preact (alternative légère à React) | Formulaires riches sans alourdir le site public (Preact n'est chargé que sur `/admin/`). |

Alternative écartée : **Decap CMS**. Son interface générique ne permet pas les écrans demandés (tableau de bord, réordonnancement, médiathèque avec contrôle d'usage).

## Arborescence

```
src/
  content/            Contenus (JSON) — la seule chose que l'admin modifie
    profile.json  skills.json  seo.json  media.json
    projects/*.json  experiences/*.json
  assets/media/       Images (optimisées par Astro au build : WebP/AVIF, tailles multiples)
  lib/                Code partagé site / admin / API
    schemas.ts          Schémas zod : validation au build ET côté serveur
    content-types.ts    Type de contenu → chemin du fichier
    content.ts          Lecture des contenus au build (+ filtrage brouillons)
    stocks.ts           Papiers des projets (couleur + encre), partagés site / admin
    media.ts  format.ts  structured-data.ts
  components/  layouts/  pages/  styles/  scripts/   Site public
  admin/              Application d'administration (Preact)
    main.tsx  store.tsx  api.ts  auth.ts  ui.tsx  admin.css  views/*
  server/             Logique de l'API (testée sans Netlify ni GitHub)
    handler.ts  auth.ts  session.ts  cms.ts  github.ts  media.ts  http.ts
netlify/functions/admin.mts   Point d'entrée Netlify (quelques lignes)
public/               Polices, favicon, image de partage, fichiers PDF (public/files)
tests/unit/           Vitest : authentification (sessions, révocation, tentatives, CSRF, configuration), API complète sur un GitHub simulé, schémas, redirections, contraste des papiers
tests/e2e/            Playwright : page unique (8 largeurs, axe clair/sombre, SEO, clavier, sans JS, mouvement réduit) et parcours admin
scripts/generate-og.mjs   Génère public/og-default.png
scripts/admin-setup.mjs   npm run admin:setup : hachage du mot de passe et secret de session, en local
```

## Modèle de publication

- **Enregistrer** = un commit sur `cms-draft` (créée depuis `main` au premier enregistrement). Le site public ne change pas.
- **Aperçu** = le déploiement de branche Netlify de `cms-draft`. Il affiche aussi les contenus masqués (avec un bandeau), et il est en `noindex` (`robots.txt` fermé, balise `robots`).
- **Publier** = fusion de `cms-draft` dans `main` (API GitHub *merges*), puis réalignement de `cms-draft` sur `main`. Netlify reconstruit la production.
- **Abandonner** = suppression de `cms-draft`.
- **Masquer / brouillon** = un champ du contenu (`visible`, `status`) : le contenu est publié mais filtré du build de production.

L'état des déploiements affiché dans l'admin vient des *commit statuses* que Netlify publie sur GitHub : aucun jeton Netlify n'est nécessaire.

## Concurrence et erreurs

- Chaque contenu chargé porte le *sha* Git de son fichier. À l'enregistrement, le serveur compare : si le fichier a changé entre-temps → **409 conflit**, rien n'est écrit. Création d'un identifiant existant → 409.
- Un commit regroupe toutes les modifications d'une action (renommage = suppression + création ; réordonnancement = plusieurs fichiers ; média = fichier + index).
- Si la branche avance pendant l'écriture (deux enregistrements simultanés), la mise à jour non *fast-forward* est refusée par GitHub et l'opération est rejouée (au plus 2 fois) avec les vérifications.
- Conflit de fusion à la publication → 409 avec un message qui propose de résoudre sur GitHub ou d'abandonner le brouillon.
- Un contenu invalide ne peut pas être enregistré (validation serveur) et, s'il arrivait par un autre chemin, **ferait échouer le build** : la production garde alors la version précédente.

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
- **Jeton GitHub** : variable d'environnement serveur, jamais renvoyée ni journalisée. Jeton *fine-grained* limité au dépôt (Contents : lecture/écriture, Commit statuses : lecture).
- **Validation** : schémas zod partagés, identifiants restreints à `[a-z0-9-]`, chemins calculés côté serveur (pas de traversée), URL limitées à `http(s)` et `mailto`.
- **Médias** : type déterminé par les octets (WebP, PNG, JPEG, AVIF, PDF) ; SVG et HTML refusés ; 4 Mo max ; nom de fichier réécrit ; suppression refusée si le média est encore utilisé.
- **XSS** : le site n'insère jamais de HTML non maîtrisé : tous les textes sont échappés par Astro ; la seule mise en valeur (`*mot*` de la phrase de couverture) est convertie après échappement.
- **En-têtes** (`netlify.toml`) : CSP sans script inline (`script-src 'self'`), `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. `/admin/` n'est ni mis en cache ni indexé.
- **Journaux** : seulement la route et le code d'erreur (et les blocages de connexion), jamais le corps des requêtes, le mot de passe, l'adresse IP, les cookies ni les jetons.
- **Cache** : toutes les réponses de l'API sont `Cache-Control: no-store` (les médias de l'admin : `private`).

## Une seule page

- `src/pages/index.astro` assemble les sections : `Cover` (couverture, `h1`), `About` (`#a-propos`), `Projects` (`#projets`), `Journey` (`#parcours`), `Skills` (`#competences`), `Contact` (`#contact`). Les ancres sont stables.
- **Projets** : chaque projet est un `<article id="projet-…">` suivi de son détail `<section id="detail-…">`, **présent dans le HTML** (lisible sans JavaScript, indexable). Le script replie les détails, ouvre celui choisi sous sa rangée (bouton `aria-expanded`, `inert` sur les détails fermés) et tient l'adresse à jour (`/#projet-…`).
- **Anciennes adresses** : `/projets/…`, `/parcours/`, `/a-propos/`, `/contact/`, `/articles/…` redirigent en 301 vers leur ancre (`netlify.toml`, testé dans `tests/unit/site.test.ts`).
- **Routes restantes** : `/`, `/404.html`, `/admin/`, `sitemap-*.xml`, `robots.txt`.
- **Données structurées** : `Person`, `ProfilePage`, et une `ItemList` de `CreativeWork` (un par projet, URL `/#projet-…`).

## Design system

Direction « Expliquer » (le dépliant) : voir [art-direction.md](art-direction.md) pour les choix et [interaction-system.md](interaction-system.md) pour le mouvement. En code :

- **Tokens** : `src/styles/global.css` (papier, feuille, encre, pli, signal vermillon ; deux voix typographiques `.display` et `.label`). Thème sombre automatique (papier noir).
- **Police** : Mona Sans variable (graisse 200–900, largeur 75–125), auto-hébergée et réduite (`public/fonts/`). L'administration garde Newsreader et Instrument Sans (`src/admin/base.css`).
- **Plis** : `@property --a` (angle animable) ; l'ombre de chaque pli est calculée avec `sin(var(--a))`. `Leporello.astro` est un composant récursif (chaque feuille contient la suivante, `preserve-3d`) utilisé pour la bande de couverture et les principes.
- **Papiers des projets** : `src/lib/stocks.ts` (six couleurs avec leur encre, contraste AA testé) ; `cover.color` dans le contenu.
- **Script** : `src/scripts/fold.ts` (4,5 Ko, 1,9 Ko compressé) : menu mobile, section active, ouverture des plis à l'entrée dans l'écran, bande de couverture pilotée par le défilement, carte des projets, copie de l'adresse. Sans lui, tout est déplié et lisible.
- **Image de partage** : `scripts/generate-og.mjs` (nom + bande des papiers réels).

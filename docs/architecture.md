# Architecture

## En une phrase

Un site **Astro statique d'une seule page** (HTML pré-rendu, un petit script d'amélioration progressive) dont le contenu vit dans des **fichiers JSON versionnés dans GitHub**, édités depuis une **administration Preact** qui passe par **une Netlify Function** protégée par **Netlify Identity**.

```
Navigateur (admin)                 Netlify                              GitHub
──────────────────                 ───────                              ──────
/admin/  ── login ──────────────▶  Identity (/.netlify/identity)
         ◀── cookie nf_jwt ──────
         ── /api/admin/* ───────▶  Function admin.mts
                                     1. vérifie le JWT (runtime Netlify)
                                     2. e-mail ∈ ADMIN_EMAILS ?
                                     3. Origin + en-tête X-CMS-Request
                                     4. valide les données (zod)       ──▶ commit sur cms-draft
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
| Authentification | Netlify Identity + `@netlify/identity` 2.x | Inscription fermée, invitation, réinitialisation, renouvellement de session. Netlify a confirmé le maintien d'Identity (février 2026) et recommande ce paquet pour les nouveaux projets. |
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
    handler.ts  auth.ts  cms.ts  github.ts  media.ts  http.ts
netlify/functions/admin.mts   Point d'entrée Netlify (quelques lignes)
public/               Polices, favicon, image de partage, fichiers PDF (public/files)
tests/unit/           Vitest : API complète sur un GitHub simulé, schémas, redirections, contraste des papiers
tests/e2e/            Playwright : page unique (8 largeurs, axe clair/sombre, SEO, clavier, sans JS, mouvement réduit) et parcours admin
scripts/generate-og.mjs   Génère public/og-default.png
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

- **Authentification** : JWT Netlify Identity vérifié par le runtime Netlify ; adresse obligatoirement présente dans `ADMIN_EMAILS` (sinon 403). Sans `ADMIN_EMAILS`, l'API refuse tout (503).
- **CSRF** : toute requête de modification exige une origine identique au site (`verifyRequestOrigin`) et l'en-tête `X-CMS-Request: 1` (impossible à envoyer depuis un autre site sans pré-vol CORS, que l'API n'accepte pas).
- **Jeton GitHub** : variable d'environnement serveur, jamais renvoyée ni journalisée. Jeton *fine-grained* limité au dépôt (Contents : lecture/écriture, Commit statuses : lecture).
- **Validation** : schémas zod partagés, identifiants restreints à `[a-z0-9-]`, chemins calculés côté serveur (pas de traversée), URL limitées à `http(s)` et `mailto`.
- **Médias** : type déterminé par les octets (WebP, PNG, JPEG, AVIF, PDF) ; SVG et HTML refusés ; 4 Mo max ; nom de fichier réécrit ; suppression refusée si le média est encore utilisé.
- **XSS** : le site n'insère jamais de HTML non maîtrisé : tous les textes sont échappés par Astro ; la seule mise en valeur (`*mot*` de la phrase de couverture) est convertie après échappement.
- **En-têtes** (`netlify.toml`) : CSP sans script inline (`script-src 'self'`), `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. `/admin/` n'est ni mis en cache ni indexé.
- **Journaux** : seulement la route et le code d'erreur, jamais le corps des requêtes ni les jetons.

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

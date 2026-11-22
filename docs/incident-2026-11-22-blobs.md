# Incident du 22 novembre 2026 — le CMS ne peut plus lire ni écrire dans Netlify Blobs

## Résumé

- **Symptôme** : à partir de 01 h 59 (Europe/Paris), `POST /api/admin/save`, `GET /api/admin/status` et `GET /api/admin/session` répondent 500, avec `BlobsInternalError` dans les journaux. Le déploiement en production datait du 21 novembre à 22 h 01.
- **Cause retenue** : la fonction gardait ses clients Netlify Blobs d'une invocation à l'autre. `getStore()` lit le contexte Blobs (site, **jeton**, URL du edge) une seule fois, au moment où il est appelé, et le fige dans son client. Or `src/server/runtime.ts` créait `ContentStore` et `AdminAuth` (et donc leurs stores) à la première requête, puis les réutilisait pour toute la vie de l'instance. Netlify fournit le contexte Blobs **à chaque invocation** ; une instance restée chaude plusieurs heures continuait d'envoyer le jeton de sa première invocation.
- **Correction** : chaque opération Blobs ouvre le store avec le contexte de l'invocation en cours (`src/server/blob-store.ts`). Les objets mis en cache ne contiennent plus aucun identifiant. Les pannes de stockage deviennent des 503 explicites, journalisées avec leur type, leur statut et un identifiant de corrélation, sans secret.
- **Données** : aucune donnée n'a été supprimée ni réinitialisée, ni pendant l'incident ni par la correction. Les écritures échouées n'ont rien modifié : chaque écriture du brouillon est conditionnelle à l'ETag lu, et la publication est une écriture unique conditionnelle.

## Ce qui est établi, et ce qui ne l'est pas

**Établi, en lisant le code et en le reproduisant** :

1. `@netlify/blobs` 11.1.9 : `getStore()` → `getClientOptions()` → `getEnvironmentContext()` lit `globalThis.netlifyBlobsContext` (ou `NETLIFY_BLOBS_CONTEXT`) **une fois** et garde `token`, `edgeURL` et `uncachedEdgeURL` dans le `Client`. Le jeton n'est jamais relu.
2. Le runtime Netlify (`@netlify/runtime`, `setupBlobsEnvironment`) écrit ce contexte dans `globalThis.netlifyBlobsContext`, c'est-à-dire par invocation. La documentation Netlify crée toujours le store **dans** le gestionnaire de requête.
3. `runtime.ts` mettait en cache `ContentStore` (stores `cms`, `cms-media`) et `AdminAuth` (store `admin-auth`) au niveau du module. Les trois routes en panne passent toutes par ces stores, y compris `/session`, qui lit `admin-auth`.
4. Le SDK appelle `BlobsInternalError` **toute** réponse non 2xx, refus d'authentification (401/403) compris. Il ne réessaie que les 429 et 5xx, avec le même jeton. Un jeton périmé donne donc exactement « BlobsInternalError » sur toutes les opérations, et les nouvelles tentatives n'y changent rien.
5. Reproduit avec le vrai SDK face à un émulateur du edge qui renouvelle les jetons à chaque invocation (`tests/unit/storage-resilience.test.ts`) : un store ouvert une fois échoue en `BlobsInternalError` 401 dès l'invocation suivante.
6. Le déploiement du 21 novembre n'a changé ni les dépendances (`package-lock.json` identique), ni la configuration Blobs, ni le code de stockage. Le cache des instances existe depuis le 17 novembre ; il fallait seulement qu'une instance reste chaude assez longtemps. **Hypothèse plausible** : l'administration interroge `/status` toutes les 60 s tant que l'onglet est visible, ce qui garde l'instance chaude.

**Non établi** (pas d'accès aux journaux Netlify depuis cet environnement) :

- **Le statut HTTP réellement renvoyé par Blobs** pour les requêtes `01M80CSB4KPCDXCJK9TBM6WYKZ` et `01M80CRZF56VSFQ422V069XV4W`. Les anciens journaux n'enregistraient que le nom de l'erreur (`unexpected BlobsInternalError`), sans statut ni message. Un 401/403 confirmerait la cause ; un 5xx l'infirmerait au profit d'une panne du service.
- **La durée de vie réelle des jetons** fournis aux fonctions. L'écart d'environ 4 heures est compatible avec une expiration, sans la prouver.
- **Une panne du service** : la page de statut Netlify ne publie aucun incident Blobs ou Functions autour du 21–22 novembre (consultée le 22 novembre). Cela ne l'exclut pas totalement.

**Comment trancher** : dans Netlify → Logs → Functions, chercher les deux Request IDs ; ou, une fois la correction déployée, lire la nouvelle ligne `storage_error` (champs `status`, `kind`, `blobsRequestId`). Si des 401/403 réapparaissaient après la correction, la cause serait ailleurs (jeton invalide dès l'invocation, site ou store mal configuré). Le champ `kind` vaudrait alors `auth` dès la première requête d'une instance.

## Correction

| Fichier | Changement |
|---|---|
| `src/server/blob-store.ts` | `netlifyDocStore` / `netlifyFileStore` n'appellent plus `getStore()` à leur création mais **à chaque opération** : cela ne coûte que la lecture du contexte, aucune requête. Toute erreur du SDK devient une `StorageError` (opération, store, statut, type, identifiant de requête Blobs, message expurgé). Les fichiers enregistrent leur date d'envoi (`uploadedAt`). |
| `src/server/storage-error.ts` (nouveau) | `StorageError` classée en `auth` (401/403), `unavailable` (429, 5xx, réseau), `config` (contexte absent) ou `unknown`. `redact()` retire jetons Bearer, JWT, URL signées, hachages Argon2, chaînes opaques longues et les secrets de l'administration. Un identifiant de corrélation reprend le `x-nf-request-id` de Netlify quand il existe. |
| `src/server/handler.ts` | Une `StorageError` donne un **503** `storage_unavailable`, avec un message utile, la référence (`error.ref` et en-tête `X-Request-Ref`) et `Retry-After`. Ce n'est jamais un 401 : le cookie de session n'est pas effacé. Ce n'est jamais un « mot de passe incorrect ». Une ligne JSON est journalisée avec les champs `event`, `ref`, `route`, `kind`, `type`, `status`, `op`, `store`, `blobsRequestId` et `message`. Les erreurs inattendues sont journalisées de la même façon. |
| `src/server/runtime.ts` | Garde ses objets en cache (ils ne portent plus d'identifiants) et documente l'interdiction d'appeler `getStore()` hors d'une opération. |
| `src/server/session.ts` | Le cookie n'est remis qu'une fois la session **confirmée** en stockage (`onlyIfNew`). Une déconnexion que le stockage ne peut pas confirmer n'est plus annoncée comme faite. |
| `src/server/content-store.ts` | La copie de la version remplacée (`history/`) et la sauvegarde avant restauration doivent être confirmées, sinon rien n'est publié ni restauré. Le nettoyage des médias ne supprime jamais un fichier de moins de 24 h, même non référencé : un envoi peut être en cours dans un autre onglet. |
| `src/server/media-route.ts`, `src/pages/index.astro`, `src/pages/admin/apercu/` | Une panne de stockage n'est plus servie comme un « 404 » mis en cache (médias : 503 `no-store`). La page publique garde son repli sur le contenu du dépôt, avec un journal détaillé. L'aperçu répond 503. |
| `src/admin/` | Le CMS distingue « stockage momentanément indisponible » (avec la référence à citer) de « administration non configurée » et de « mot de passe refusé ». Une erreur de serveur ne s'affiche jamais comme une réussite. Le formulaire ouvert est conservé. |

## Vérification

- `tests/unit/storage-resilience.test.ts` (18 tests, vrai SDK, émulateur du edge) :
  - reproduction de l'incident ;
  - 25 invocations successives avec un jeton expiré à chaque fois ;
  - une instance d'administration complète (session, état, enregistrement, publication) sur 12 cycles ;
  - **une journée de travail** : requêtes toutes les 4 minutes pendant 7 h 56 avec un nouveau jeton à chaque fois, puis fin normale de la session à 8 h (401, pas d'erreur de stockage) ;
  - panne 503 puis reprise, sans modification ;
  - panne courte absorbée par les nouvelles tentatives ;
  - identifiants refusés → 503 sans perte de session ;
  - contexte absent → 503 `config` ;
  - journal sans jeton, avec la référence Netlify ;
  - écritures concurrentes de deux instances (une gagne, l'autre reçoit un 409) ;
  - écriture conditionnelle sans version refusée ;
  - session non confirmée, copie d'historique non confirmée, déconnexion non confirmée ;
  - délai de grâce des médias ;
  - expurgation des secrets.
- `tests/e2e/admin.spec.ts` : dans le navigateur, stockage en panne → message avec référence, formulaire conservé, jamais « Enregistré », puis enregistrement réussi après la reprise ; ouverture de l'administration pendant la panne → « Administration indisponible » avec la référence, puis « Réessayer ».
- Suite complète : unitaires, navigateur (y compris le parcours de bout en bout sur `netlify serve` et ses Blobs locaux), vérification des types, build.

## Si cela se reproduit

1. Lire la ligne `storage_error` de la référence affichée dans le CMS : `kind` et `status` disent s'il s'agit d'identifiants (`auth`), d'une indisponibilité (`unavailable`) ou de la configuration (`config`).
2. `unavailable` : panne du service. Les données ne sont pas touchées ; réessayer plus tard et consulter netlifystatus.com.
3. `auth` dès la première requête d'une instance : vérifier que la fonction tourne bien sur Netlify (pas un autre hébergeur) et que le site a Blobs activé ; ouvrir un ticket Netlify avec le `blobsRequestId`.
4. Ne jamais vider ni recréer les stores `cms`, `cms-media` ou `admin-auth` : le contenu, les médias et les sessions y vivent. Une sauvegarde se télécharge depuis l'administration (Paramètres).

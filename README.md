# clementplancon.fr

Portfolio de Clément Plançon — HTML, CSS et JavaScript, sans framework ni build.

```
index.html          page unique (Projets, Expérience, À propos, Contact)
css/style.css
js/main.js          section active dans la navigation + année du footer
images/             image Open Graph (1200×630), apple-touch-icon, aperçu de Datametre
favicon.svg
robots.txt, sitemap.xml
```

Lancer en local :

```
python3 -m http.server 8000
```

## SEO — opérations manuelles

**Mettre à jour** à chaque modification de contenu : `<lastmod>` dans `sitemap.xml` et `dateModified` dans le JSON-LD de `index.html`.

**URL canonique** : `https://clementplancon.fr/`. Côté hébergeur, rediriger en 301 `www.clementplancon.fr` et `/index.html` vers cette URL.

**Google Search Console / Bing Webmaster Tools** : coller les balises de vérification dans `index.html`, à l'emplacement du commentaire `Search Console / Bing Webmaster Tools` (dans le `<head>`), par exemple :

```html
<meta name="google-site-verification" content="…">
<meta name="msvalidate.01" content="…">
```

Puis soumettre `https://clementplancon.fr/sitemap.xml` dans les deux outils. Bing permet aussi d'importer le site directement depuis Search Console.

## IndexNow (Bing, Yandex, Seznam…)

1. Générer une clé (8 à 128 caractères hexadécimaux), par exemple sur bing.com/indexnow.
2. Créer à la racine un fichier `<clé>.txt` dont le contenu est la clé elle-même, puis déployer.
3. Après chaque mise en ligne, notifier :

```
curl "https://api.indexnow.org/indexnow?url=https://clementplancon.fr/&key=<clé>"
```

Pour plusieurs URLs, envoyer un POST JSON à `https://api.indexnow.org/indexnow` avec `host`, `key`, `keyLocation` et `urlList`.

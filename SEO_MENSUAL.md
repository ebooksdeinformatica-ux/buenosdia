# BUENOSDIAS2560 — SEO mensual automático (sin IA externa)

Este sitio actualiza **en cada build** la descripción SEO de cada categoría
basándose en el contenido real de los posts (títulos + primer párrafo + meta description + keywords).

Para que eso ocurra **cada mes**, no hace falta tocar nada del contenido:
solo necesitás que Netlify haga un build mensual.

## Opción A (recomendada): GitHub Actions + Netlify Build Hook

1) En Netlify:
   - Site settings → Build & deploy → **Build hooks**
   - Create build hook (poné nombre: `monthly-seo-refresh`)
   - Copiá la URL del hook.

2) En GitHub:
   - Repo → Settings → Secrets and variables → Actions → New repository secret
   - Name: `NETLIFY_BUILD_HOOK_URL`
   - Value: la URL del build hook.

Listo. El workflow `.github/workflows/netlify-monthly.yml` dispara el build el día 1 de cada mes.

## Qué se actualiza en cada build

- `/categories/<cat>/index.html`:
  - `<meta name="description">` se recalcula según el contenido de esa categoría.
  - Texto visible debajo del H1 también se recalcula (misma descripción).
- `/sitemap.xml`:
  - se regenera con `<lastmod>` para que Google vea cambios.
- `/robots.txt`:
  - se regenera apuntando al sitemap.
- `/categories.json`:
  - snapshot de descripciones y conteos para uso futuro (home con bloques, etc).

## Nota
La descripción es **determinística** (sin API externa): no depende de OpenAI, no depende de nada.
Si agregás posts, al mes siguiente se refresca sola.

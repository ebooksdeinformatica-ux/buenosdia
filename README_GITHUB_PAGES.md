# BUENOSDIAS2560 — Deploy en GitHub Pages

Este repo puede publicarse de dos formas.

## Opción A (la más simple): Deploy from branch → main /(root)
GitHub → Settings → Pages → Build and deployment:
- Source: Deploy from a branch
- Branch: main
- Folder: /(root)

Con esta opción, el build genera el sitio en `dist/` y además (cuando usás `--sync-root`) copia lo generado al root.

### Build automático en cada push (recomendado)
Ya viene el workflow `.github/workflows/build-pages-root.yml`:
- corre `npm run build:gh`
- copia `dist/*` al root
- commitea los cambios si hay.

## Opción B (más "limpia"): GitHub Actions + artifact deploy
Si preferís no commitear HTML generado, podés cambiar:
GitHub → Settings → Pages → Source: GitHub Actions
y usar un workflow de Pages que suba `dist/` como artifact.

## Dominio propio (buenosdia.com)
- En Settings → Pages poné `buenosdia.com` como Custom domain.
- El archivo `CNAME` ya existe en el root del repo.
- Si querés que el build también lo escriba dentro de `dist/`, podés setear `CUSTOM_DOMAIN=buenosdia.com`.

## Project Page (sin dominio propio)
Si publicás en https://usuario.github.io/repo/:
- SITE_URL=https://usuario.github.io
- BASE_PATH=/repo
- (no seteés CUSTOM_DOMAIN)

## Archivos SEO
- /sitemap.xml (autogenerado en cada build)
- /robots.txt (autogenerado en cada build)

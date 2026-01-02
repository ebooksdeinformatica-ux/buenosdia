# BUENOSDIAS2560 — Deploy en GitHub Pages (sin Netlify)

## Activar Pages por Actions
GitHub → Settings → Pages → Build and deployment:
- Source: GitHub Actions

## Dominio propio (buenosdia.com)
El build genera el archivo `CNAME` en `dist/` cuando `CUSTOM_DOMAIN` está seteado.
En el workflow ya viene:
- SITE_URL=https://buenosdia.com
- CUSTOM_DOMAIN=buenosdia.com

## Project Page (sin dominio propio)
Si publicás en https://usuario.github.io/repo/:
- SITE_URL=https://usuario.github.io
- BASE_PATH=/repo
- (no seteés CUSTOM_DOMAIN)

## Archivos SEO
- /sitemap.xml (autogenerado en cada build)
- /robots.txt (autogenerado en cada build)

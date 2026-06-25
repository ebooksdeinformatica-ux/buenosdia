# Google SEO API — BuenosDia.com

Este módulo usa datos reales de Google para decidir publicaciones y mejoras SEO sin exponer claves en la web pública.

## Secrets necesarios

En GitHub: Settings → Secrets and variables → Actions → New repository secret.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_SEARCH_CONSOLE_SITE`
- `PAGESPEED_API_KEY`

`GOOGLE_SEARCH_CONSOLE_SITE` debe coincidir exactamente con la propiedad de Search Console:

- `https://www.buenosdia.com/`
- o `sc-domain:buenosdia.com`

## Comandos

```bash
npm run google:search-console
npm run google:pagespeed
npm run google:ideas
npm run google:seo
```

## Archivos generados

- `data/google/search-console-opportunities.json`
- `data/google/pagespeed-report.json`
- `data/google/content-ideas.json`

## Flujo recomendado

1. Ejecutar manualmente el workflow `Google SEO Data` desde GitHub Actions.
2. Revisar `data/google/content-ideas.json`.
3. Elegir oportunidades reales, no publicar por keyword sola.
4. Crear o mejorar publicaciones siguiendo MODELO BLOG GITHUB.
5. Actualizar interlinks de ida y vuelta.
6. Mantener sitemap limpio.

## Regla editorial

Los datos de Google son brújula, no piloto automático. Una consulta con impresiones no justifica una publicación si no hay intención clara, utilidad real y voz humana.

# THOT GLOBAL HREFLANG

Sistema internacional controlado para BuenosDia.com.

## Idiomas activos

- Espanol: idioma principal.
- Ingles: version internacional secundaria.
- Frances: version internacional secundaria.

## Principio editorial

No se generan idiomas masivos sin control.
No se usan paginas vacias ni traducciones automaticas frias.
Cada version debe tener contenido legible, titulo propio, descripcion propia, canonical propio y codigo de idioma correcto.

## Principio SEO

El sitemap principal se mantiene limpio.
Las versiones internacionales se declaran en `sitemap-i18n.xml`.

Cada grupo de idioma debe incluir:

- URL espanola;
- URL inglesa;
- URL francesa;
- x-default apuntando a la version espanola.

## Archivos

- `data/i18n_posts.json`
- `sitemap-i18n.xml`
- `robots.txt`
- `/en/posts/`
- `/fr/posts/`

## Riesgo a controlar

Si las versiones traducidas bajan mucho de calidad, pueden parecer contenido duplicado o poco util.
THOT debe revisar que cada version sea legible, natural y tenga sentido para el idioma destino.

## Regla

Pocas versiones buenas valen mas que muchas paginas internacionales debiles.

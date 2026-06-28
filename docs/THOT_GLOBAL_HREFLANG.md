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

## Como evitar traducciones frias

Cada version internacional debe ser una adaptacion editorial, no una traduccion palabra por palabra.

THOT debe revisar:

- que el titulo suene natural en el idioma destino;
- que el primer parrafo respire como texto propio;
- que las frases hechas del espanol no pasen literal;
- que ejemplos demasiado locales se expliquen o se vuelvan universales;
- que el tono siga siendo humano, directo y sin plantilla;
- que no se pierda la idea central del post original;
- que el texto no parezca generado en masa.

## Principio SEO

El sitemap principal se mantiene limpio.
Las versiones internacionales se declaran en `sitemap-i18n.xml`.

No se necesitan tres sitemaps por idioma.
La estructura activa es:

- `sitemap.xml`: URLs principales del sitio.
- `sitemap-i18n.xml`: grupos internacionales ES / EN / FR con hreflang.

Cada grupo de idioma debe incluir:

- URL espanola;
- URL inglesa;
- URL francesa;
- x-default apuntando a la version espanola.

## Publicaciones nuevas

Desde ahora, cada publicacion nueva debe nacer asi:

1. version espanola principal;
2. version inglesa adaptada;
3. version francesa adaptada;
4. entrada en `data/posts.json` para la version principal;
5. entrada en `data/i18n_posts.json` para el grupo internacional;
6. actualizacion de `sitemap.xml` si corresponde;
7. actualizacion de `sitemap-i18n.xml`.

Si una version inglesa o francesa no alcanza calidad, no se publica hasta corregirla.

## Categorias y tags

Por ahora, las categorias principales del sitio quedan en espanol.

Las versiones EN y FR pueden mostrar categoria traducida dentro del post, pero no se crean paginas de categoria internacionales todavia.

Los tags pueden traducirse dentro de cada version del post, pero no se crean archivos ni sitemaps de tags por idioma.

Regla: internacionalizar posts primero, arquitectura secundaria despues.

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

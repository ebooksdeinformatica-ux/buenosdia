# DETALLE CONTINUACION - TECNICO SEO - 2026-06-28

Este archivo guarda el estado tecnico y SEO para continuar.

## SEO internacional

Archivos clave:

- `data/i18n_posts.json`
- `sitemap-i18n.xml`
- `assets/js/app.js`
- `docs/THOT_GLOBAL_HREFLANG.md`
- `docs/SELECTOR_IDIOMA_POSTS.md`

Reglas:

- ES es idioma principal.
- EN y FR son secundarios.
- Cada cluster nuevo debe agregarse a `data/i18n_posts.json`.
- Cada cluster nuevo debe agregarse a `sitemap-i18n.xml`.
- Cada cluster nuevo debe agregarse a `assets/js/app.js` para selector visual.
- No usar traducciones frias.
- No crear categorias internacionales hasta que haya volumen real.

## Sitemap principal

Archivo:

- `sitemap.xml`

Contiene URLs principales ES y paginas legales/categorias.

La nueva publicacion `estar-ocupado-no-es-estar-presente` ya fue agregada.

## Auditorias

Scripts relevantes:

- `scripts/auditar-activas.mjs`
- `scripts/auditar-voz.mjs`
- `scripts/auditar-variedad.mjs`
- `scripts/auditar-enlaces-internos.mjs`
- `scripts/auditar-statcounter.mjs`

Comandos:

- `npm run audit`
- `npm run check`
- `npm run voice`
- `npm run variety`
- `npm run links`
- `npm run statcounter`

## Nueva auditoria de enlaces

Archivo:

- `scripts/auditar-enlaces-internos.mjs`

Funcion:

- revisa enlaces internos en `posts/`, `en/posts/`, `fr/posts/`;
- falla si encuentra un destino inexistente;
- muestra aviso si un enlace apunta a redirect noindex.

Motivo:

Los enlaces internos son parte del valor editorial y SEO. No deben apuntar a 404 ni depender para siempre de slugs viejos.

## Redirect restaurado

Archivo restaurado:

- `posts/claridad-mental-cuando-el-dia-empieza-torcido.html`

Destino:

- `/posts/bitacora-para-un-dia-torcido.html`

Funcion:

- evitar 404;
- conservar ruta vieja mientras se limpian enlaces.

## Experiencia editorial

Archivo:

- `docs/EXPERIENCIA_EDITORIAL.md`

Estado actual:

- Puntaje: 685.
- Nivel: 3.
- Publicaciones revisadas: 5.
- Publicaciones rehabilitadas: 4.
- Sistema internacional: ES / EN / FR.

Lecciones nuevas:

- no publicar textos correctos pero olvidables;
- el valor editorial no se mide solo por palabras;
- enlaces internos rotos o viejos son deuda tecnica;
- cada post debe agregar valor al universo entero.

## Pendientes tecnicos recomendados

1. Crear `data/concept_map.json`.
2. Crear `docs/THOT_CONCEPT_MAP.md`.
3. Crear `docs/MODO_EXPLORADOR.md`.
4. Revisar anchors viejos y reemplazarlos por URLs actuales.
5. Revisar si home/categorias se actualizan por build o requieren regeneracion manual.
6. Evaluar si `assets/js/app.js` puede leer clusters desde `data/i18n_posts.json`.
7. Crear auditoria de enlaces por idioma para evitar que EN apunte accidentalmente a ES.

## Nota operativa

El conector de GitHub permite editar/verificar archivos, pero no correr `npm run audit` como terminal local. No afirmar auditoria ejecutada si no se corre en entorno real.

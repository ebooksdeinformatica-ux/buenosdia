# CONTINUAR AQUI - BuenosDia.com - 2026-06-28

Usar este archivo para seguir en otro chat.

## Estado

BuenosDia.com se trabaja como ecosistema editorial, no como blog simple.

El sistema activo combina:

- THOT: editor jefe, SEO y arquitectura editorial.
- MORFEO: experiencia del lector, retencion y Modo Explorador.
- MNEMOSINE: mapa de conocimiento, conceptos y articulos puente.
- LEONARDO: diseno, UX visual, lectura, mobile y confianza.

Archivos principales:

- `docs/EQUIPO_REDACCION_DIOSES.md`
- `docs/PROTOCOLO_PUBLICACION_CONSEJO.md`
- `docs/EXPERIENCIA_EDITORIAL.md`
- `docs/EXPERIENCIA_MORFEO.md`
- `docs/EXPERIENCIA_MNEMOSINE.md`
- `docs/EXPERIENCIA_LEONARDO.md`
- `data/dioses_sources.json`

## Regla central

No publicar por publicar.

Cada post debe ser un activo editorial con valor acumulado, voz humana, SEO, interlinks, experiencia de lectura y versiones internacionales cuando corresponda.

Si un texto es correcto pero olvidable, vuelve al taller.

## Idiomas

Idiomas activos:

- ES principal.
- EN secundario.
- FR secundario.

Cada publicacion nueva debe evaluar ES / EN / FR.

EN y FR son adaptaciones editoriales. No publicar traducciones frias.

Actualizar siempre:

- `data/i18n_posts.json`
- `sitemap-i18n.xml`
- `assets/js/app.js`

## Ultima publicacion creada

Titulo:

`Estar ocupado no es estar presente: cómo recuperar atención cuando el día te arrastra`

Archivos:

- `posts/estar-ocupado-no-es-estar-presente.html`
- `en/posts/being-busy-is-not-being-present.html`
- `fr/posts/etre-occupe-ce-nest-pas-etre-present.html`

Tambien se actualizo:

- `data/posts.json`
- `data/i18n_posts.json`
- `sitemap.xml`
- `sitemap-i18n.xml`
- `assets/js/app.js`
- experiencia de THOT, MORFEO, MNEMOSINE y LEONARDO.

## Auditoria agregada

Se creo:

- `scripts/auditar-enlaces-internos.mjs`

Comando:

- `npm run links`

Tambien se agrego al flujo general de `npm run audit`.

Funcion:

- detectar enlaces internos rotos;
- avisar enlaces hacia redirects noindex;
- evitar fugas SEO internas.

## Redirect restaurado

Se restauro:

- `posts/claridad-mental-cuando-el-dia-empieza-torcido.html`

Como redirect hacia:

- `/posts/bitacora-para-un-dia-torcido.html`

Objetivo: evitar 404 mientras se limpian enlaces viejos.

## Estado de experiencia editorial

`docs/EXPERIENCIA_EDITORIAL.md` quedo con:

- Puntaje actual: 685.
- Nivel actual: 3.
- Publicaciones revisadas: 5.
- Publicaciones rehabilitadas: 4.
- Sistema internacional activo: ES / EN / FR.

## Proximo paso recomendado

Antes de publicar otro post:

1. Leer este archivo.
2. Leer `docs/EQUIPO_REDACCION_DIOSES.md`.
3. Leer `docs/PROTOCOLO_PUBLICACION_CONSEJO.md`.
4. Revisar `data/posts.json`.
5. Crear `data/concept_map.json` o limpiar enlaces viejos antes de seguir publicando.

Prioridad sugerida:

- crear mapa conceptual;
- limpiar anchors viejos;
- crear documento del Modo Explorador;
- luego publicar otra pieza con formato no repetido.

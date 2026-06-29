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
- `docs/MODO_EXPLORADOR.md`
- `data/dioses_sources.json`
- `data/concept_map.json`

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

- `data/posts.json`
- `data/i18n_posts.json`
- `sitemap.xml`
- `sitemap-i18n.xml`

Nota nueva: `assets/js/app.js` ahora lee `data/i18n_posts.json` de forma dinamica para el selector de idioma. Ya no hay que editarlo manualmente por cada post salvo que cambie el comportamiento del selector.

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

## Auditoria agregada previamente

Existe:

- `scripts/auditar-enlaces-internos.mjs`

Comando:

- `npm run links`

Tambien corre dentro de `npm run audit`.

Funcion:

- detectar enlaces internos rotos;
- avisar enlaces hacia redirects noindex;
- evitar fugas SEO internas.

## Nuevo bloque prepublicacion creado

Se creo:

- `data/concept_map.json`
- `docs/MODO_EXPLORADOR.md`

Se actualizo:

- `scripts/build.mjs`
- `assets/js/app.js`
- `index.html`
- `categorias/calma-y-claridad-mental/index.html`
- `categorias/saliendo-de-la-matrix/index.html`
- `docs/EXPERIENCIA_EDITORIAL.md`
- `docs/EXPERIENCIA_MORFEO.md`
- `docs/EXPERIENCIA_MNEMOSINE.md`
- `docs/EXPERIENCIA_LEONARDO.md`

Funcion nueva:

- MNEMOSINE ya tiene mapa conceptual con galaxias, posts, rutas, huecos y guardia previa.
- MORFEO ya tiene documento del Modo Explorador.
- LEONARDO dejo home y categorias visibles alineadas con `data/posts.json`.
- THOT dejo el flujo listo para volver a publicar sin repetir molde.
- `scripts/build.mjs` ahora regenera portada, categorias, sitemap principal y sitemap i18n desde datos.

## Redirect restaurado

Se mantiene:

- `posts/claridad-mental-cuando-el-dia-empieza-torcido.html`

Como redirect hacia:

- `/posts/bitacora-para-un-dia-torcido.html`

Objetivo: evitar 404 mientras se limpian enlaces viejos.

## Estado de experiencia editorial

`docs/EXPERIENCIA_EDITORIAL.md` quedo con:

- Puntaje actual: 770.
- Nivel actual: 3.
- Publicaciones revisadas: 5.
- Publicaciones rehabilitadas: 4.
- Sistema internacional activo: ES / EN / FR.
- Mapa conceptual activo: si.
- Modo Explorador documentado: si.
- Build de home/categorias activo: si.

## Flujo para volver a publicar

Antes de escribir otro post:

1. Leer este archivo.
2. Leer `docs/EQUIPO_REDACCION_DIOSES.md`.
3. Leer `docs/PROTOCOLO_PUBLICACION_CONSEJO.md`.
4. Leer `data/concept_map.json`.
5. Leer `docs/MODO_EXPLORADOR.md`.
6. Revisar `data/posts.json`.
7. Elegir categoria o hueco desde el mapa conceptual.
8. Elegir formato no repetido desde `docs/BANCO_FORMATOS_EDITORIALES.md`.
9. Escribir ES.
10. Adaptar EN y FR si alcanzan calidad.
11. Actualizar `data/posts.json` y `data/i18n_posts.json`.
12. Ejecutar `npm run build`.
13. Ejecutar `npm run audit`.
14. Actualizar experiencia del Consejo.

## Proximo paso recomendado

El proyecto ya puede volver a publicar, pero no conviene otro texto de claridad/presencia todavia.

Prioridad editorial sugerida:

- abrir `Autoestima y Reconstrucción` con carta abierta o anatomia de una sensacion;
- o abrir `Productividad Humana` con cuaderno de campo;
- o abrir `Internet, IA y Vida Digital` con una pieza humana sobre autonomia tecnologica.

Evitar por ahora:

- otro ensayo largo sobre presencia;
- otra guia de ordenar la cabeza;
- otra cronica de manana con cocina, telefono o cuerpo lento;
- otro cierre con las mismas puertas del ultimo post.

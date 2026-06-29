# CONTINUAR AQUI - BuenosDia.com - 2026-06-29

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

`assets/js/app.js` lee `data/i18n_posts.json` de forma dinamica para el selector de idioma. Ya no hay que editarlo manualmente por cada post salvo que cambie el comportamiento del selector.

## Ultima publicacion creada

Titulo:

`Carta a la parte de vos que cree que ya es tarde`

Formato:

- `carta-abierta-anatomia-emocional`

Categoria:

- `Autoestima y Reconstrucción`

Archivos:

- `posts/carta-a-la-parte-de-vos-que-cree-que-ya-es-tarde.html`
- `en/posts/a-letter-to-the-part-of-you-that-thinks-it-is-too-late.html`
- `fr/posts/lettre-a-la-part-de-toi-qui-croit-quil-est-trop-tard.html`

Tambien se actualizo:

- `data/posts.json`
- `data/i18n_posts.json`
- `data/categories.json`
- `data/concept_map.json`
- `index.html`
- `sitemap.xml`
- `sitemap-i18n.xml`
- `categorias/autoestima-y-reconstruccion/index.html`
- `docs/EXPERIENCIA_EDITORIAL.md`
- `scripts/auditar-activas.mjs`
- `scripts/auditar-variedad.mjs`

## Bloque prepublicacion activo

Se mantiene:

- `data/concept_map.json`
- `docs/MODO_EXPLORADOR.md`

Funcion:

- MNEMOSINE guia conceptos, rutas, huecos y proximas publicaciones.
- MORFEO define recorridos de lectura sin finales muertos.
- LEONARDO mantiene home y categorias alineadas con `data/posts.json`.
- THOT controla forma, SEO, variacion y valor acumulado.
- `scripts/build.mjs` regenera portada, categorias, sitemap principal y sitemap i18n desde datos.

## Auditorias

`npm run audit` corre:

- publicaciones activas;
- voz editorial;
- variedad;
- enlaces internos;
- Statcounter.

Se ajusto:

- `scripts/auditar-activas.mjs` para no tratar el Modo Explorador como seccion debil.
- `scripts/auditar-variedad.mjs` para excluir bloques relacionados del calculo de respiracion editorial.

## Redirect restaurado

Se mantiene:

- `posts/claridad-mental-cuando-el-dia-empieza-torcido.html`

Como redirect hacia:

- `/posts/bitacora-para-un-dia-torcido.html`

Objetivo: evitar 404 mientras se limpian enlaces viejos.

## Estado de experiencia editorial

`docs/EXPERIENCIA_EDITORIAL.md` quedo con:

- Puntaje actual: 900.
- Nivel actual: 3.
- Publicaciones revisadas: 6.
- Publicaciones rehabilitadas: 4.
- Sistema internacional activo: ES / EN / FR.
- Mapa conceptual activo: si.
- Modo Explorador documentado: si.
- Build de home/categorias activo: si.
- Categorias activas: 3.

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

El sitio ya publico la primera pieza de Autoestima y Reconstruccion.

Prioridad editorial sugerida:

- abrir `Productividad Humana` con cuaderno de campo;
- o abrir `Internet, IA y Vida Digital` con una pieza humana sobre autonomia tecnologica;
- o crear una segunda pieza de Autoestima solo si aborda una sensacion distinta, no otra carta sobre edad o llegar tarde.

Evitar por ahora:

- otro ensayo largo sobre presencia;
- otra guia de ordenar la cabeza;
- otra cronica de manana con cocina, telefono o cuerpo lento;
- otra carta sobre llegar tarde o verguenza;
- otro cierre con las mismas puertas del ultimo post.

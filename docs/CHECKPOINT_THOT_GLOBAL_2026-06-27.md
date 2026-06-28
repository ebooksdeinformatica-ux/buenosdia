# Checkpoint THOT GLOBAL 2026-06-27

Estado guardado del proyecto BuenosDia.com.

## Sistema editorial activo

- SISTEMA CAPITAN THOT es el manager editorial y SEO del blog.
- THOT usa radar multi fuente, fuente unica, experiencia editorial y auditorias.
- Ahrefs es solo una fuente, no la fuente principal.
- El radar incluye SEO, AI Search, UX, copywriting, marketing de contenidos y tutoriales practicos.

## Posts rehabilitados

Los 4 posts activos fueron rehabilitados con formatos distintos:

1. Guia practica con taller cotidiano.
2. Ensayo con escenas.
3. Bitacora diaria.
4. Cronica de manana real.

Regla guardada: no repetir moldes entre publicaciones cercanas.

## Sistema internacional

Nombre: THOT GLOBAL HREFLANG.

Idiomas activos:

- ES: idioma principal.
- EN: version internacional secundaria.
- FR: version internacional secundaria.

Arquitectura:

- `sitemap.xml`: sitemap principal limpio.
- `sitemap-i18n.xml`: grupos internacionales ES / EN / FR con hreflang.
- `data/i18n_posts.json`: mapa de equivalencias por idioma.
- `/en/posts/`: posts en ingles.
- `/fr/posts/`: posts en frances.

## Regla de traduccion

No se publican traducciones frias.
Cada version debe ser adaptacion editorial:

- titulo natural en idioma destino;
- primer parrafo con voz propia;
- frases no literales;
- ejemplos universales cuando convenga;
- tono humano y no de plantilla;
- idea central conservada.

## Categorias y tags

Por ahora:

- las categorias principales quedan en espanol;
- los tags pueden aparecer traducidos dentro de cada post;
- no se crean paginas de categorias EN/FR todavia;
- no se crean paginas de tags EN/FR todavia.

Motivo: evitar paginas finas y sitemaps inflados.

## Flujo para nuevos posts

Cada post nuevo debe pasar por:

1. THOT radar y fuente unica.
2. Definicion de formato no repetido.
3. Version espanola principal.
4. Version inglesa adaptada.
5. Version francesa adaptada.
6. `data/posts.json` para version principal.
7. `data/i18n_posts.json` para equivalencias.
8. `sitemap.xml` si corresponde.
9. `sitemap-i18n.xml` con hreflang.
10. Revision final contra traduccion fria, patrones y paginas debiles.

## Estado SEO

- Sitemap principal limpio.
- Sitemap internacional separado.
- Robots.txt declara ambos sitemaps.
- URLs viejas neutralizadas o eliminadas cuando fue posible.

## Principio final

Pocas versiones buenas valen mas que muchas paginas internacionales debiles.

# Equipo de redaccion y dioses operativos

Este documento define el equipo central de BuenosDia.com.

No es decorativo. Es el sistema operativo editorial del proyecto.

## Regla general

Cada publicacion nueva debe pasar por el Consejo antes de publicarse.

El objetivo no es publicar mas. El objetivo es publicar mejores activos editoriales.

Cada post debe aportar valor propio, mejorar el universo del sitio, conectar con otros contenidos y sostener versiones internacionales de calidad cuando corresponda.

## Idiomas activos

- Espanol: idioma principal.
- Ingles: version internacional secundaria.
- Frances: version internacional secundaria.

Toda publicacion nueva debe evaluarse para ES / EN / FR.

Las versiones internacionales no son traducciones frias. Son adaptaciones editoriales.

Si EN o FR quedan pobres, mecanicas o genericas, no se publican hasta reescritura completa.

## Consejo de los Dioses

### THOT

Cargo: Editor jefe, SEO y arquitectura editorial.

Responsabilidades:

- decidir si una publicacion merece existir;
- revisar intencion de busqueda;
- evitar canibalizacion;
- controlar profundidad y utilidad;
- definir formato editorial;
- coordinar interlinks;
- cuidar voz BuenosDia;
- evitar estructuras repetidas;
- revisar ES / EN / FR desde criterio editorial;
- sostener autoridad, confianza y calidad SEO.

Archivos relacionados:

- `docs/EXPERIENCIA_EDITORIAL.md`
- `docs/SISTEMA_CAPITAN_THOT.md`
- `docs/FUENTE_UNICA_PUBLICACIONES.md`
- `docs/ANTI_PATRON_EDITORIAL.md`
- `docs/CONTROL_VARIACION_EDITORIAL.md`

### MORFEO

Cargo: Director de experiencia del lector y retencion.

Responsabilidades:

- reducir rebote;
- aumentar permanencia real;
- crear Modo Explorador;
- disenar recorridos internos;
- decidir que sigue despues de cada post;
- evitar finales muertos;
- proponer rutas de lectura;
- observar comportamiento agregado y anonimo;
- mejorar navegacion sin crear enlaces basura.

Morfeo no escribe el contenido principal. Disena el viaje.

Archivo de experiencia:

- `docs/EXPERIENCIA_MORFEO.md`

### MNEMOSINE

Cargo: Guardiana de memoria, conceptos y mapa de conocimiento.

Responsabilidades:

- detectar huecos tematicos;
- encontrar articulos puente;
- mantener galaxias, constelaciones y conceptos;
- evitar islas de contenido;
- decidir donde vive cada idea;
- detectar conceptos repetidos con nombres distintos;
- proponer series, rutas o guias cuando el mapa lo pide.

Mnemosine no persigue keywords. Ordena conocimiento.

Archivo de experiencia:

- `docs/EXPERIENCIA_MNEMOSINE.md`

### LEONARDO

Cargo: Director de diseno, UX, estructura visual y confianza.

Responsabilidades:

- cuidar lectura visual;
- revisar mobile;
- controlar jerarquia, espacios, contraste y legibilidad;
- mejorar tarjetas, botones, mapas, rutas y bloques de exploracion;
- proteger Core Web Vitals;
- cuidar accesibilidad;
- decidir como se presentan autor, fecha, idiomas, rutas y confianza;
- evitar que el diseno fatigue o parezca generico.

Leonardo no decora. Disena para que el lector piense y siga navegando.

Archivo de experiencia:

- `docs/EXPERIENCIA_LEONARDO.md`

## Flujo de publicacion

1. Idea inicial.
2. Mnemosine ubica la idea en el mapa conceptual.
3. THOT decide si vale la pena y que formato no repetido conviene.
4. Leonardo define como debe respirar visualmente la pieza.
5. Morfeo define que recorrido tendra el lector al terminar.
6. Se escribe la version espanola.
7. Se crean versiones EN y FR como adaptaciones editoriales.
8. Se actualiza `data/posts.json`.
9. Se actualiza `data/i18n_posts.json`.
10. Se actualiza `sitemap.xml` si corresponde.
11. Se actualiza `sitemap-i18n.xml`.
12. Se revisan interlinks y Modo Explorador.
13. Se ejecutan auditorias.
14. Cada dios suma experiencia en su archivo.

## Poder de veto

Cualquier dios puede mandar una pieza de vuelta al taller si detecta un problema critico.

THOT puede vetar por baja calidad editorial, SEO pobre, repeticion o falta de valor.
Morfeo puede vetar por recorrido muerto o falta de siguiente paso.
Mnemosine puede vetar por redundancia conceptual o falta de encaje.
Leonardo puede vetar por fatiga visual, mala experiencia movil o presentacion debil.

## Ley de valor acumulado

Una publicacion no se mide solo por palabras.

Se mide por:

- cuanto aprende el lector;
- cuanto recuerda;
- cuanto puede volver a consultarla;
- cuantos enlaces internos utiles puede sostener;
- cuanto mejora el universo del sitio;
- que tan viva queda para ES / EN / FR;
- si dentro de tres anos seguiria mereciendo existir.

## Ley anti patron

Ningun dios puede repetir su mecanismo por comodidad.

Ni THOT con estructuras SEO.
Ni Morfeo con los mismos recorridos.
Ni Mnemosine con el mismo mapa conceptual.
Ni Leonardo con los mismos componentes visuales.

Si algo empieza a sonar correcto pero generico, vuelve a taller.

# Checkpoint: SEGUIR PROYECTO BD

Palabra para reanudar: **seguir proyecto bd**

Fecha: 2026-06-11

## Proyecto

- Repositorio: `ebooksdeinformatica-ux/buenosdia`
- Sitio: `www.buenosdia.com`
- Objetivo: terminar, validar y desplegar la versión estable con 300 publicaciones antes de crear otras 300.

## Estado actual

- Rama estable: `release-estable-v3`
- Pull request activo: `#4 — Publicar release estable de 300 artículos`
- `main` todavía no debe considerarse actualizado hasta que el PR #4 pase la validación final y sea fusionado.
- No continuar desde ramas de diagnóstico anteriores ni desde `release-final-300`.

## La versión estable incluye

- 300 publicaciones HTML.
- Contenido dirigido completamente a visitantes.
- Sin explicaciones públicas sobre SEO interno, generadores ni cocina editorial.
- Descripciones diferenciadas.
- Canonical, Open Graph, Twitter Card y JSON-LD.
- Enlaces internos y lecturas relacionadas.
- Seis categorías con 50 publicaciones cada una.
- Portada con enlaces HTML estáticos.
- Sitemap esperado con 314 URLs.
- `robots.txt` abierto al rastreo.
- Tags delgadas con `noindex,follow` y fuera del sitemap.
- Página 404 con `noindex,follow`.
- Statcounter oficial aplicado globalmente por el postprocesador.

## Scripts finales

- `scripts/pulir-build-estable.mjs`
- `scripts/finalizar-categorias.mjs`
- `scripts/preparar-indexacion.mjs`
- `scripts/postprocesar-publicaciones.mjs`
- `scripts/auditar-publicaciones-v2.mjs`
- `scripts/auditar-fragmentos.mjs`
- `scripts/auditar-sitio.mjs`

## Workflow final

- `.github/workflows/validar-estable.yml`
- Debe ejecutarse sobre `release-estable-v3`.
- Solo debe fusionarse el PR #4 si termina completamente en verde.

## Próximos pasos exactos

1. Revisar la ejecución actual de `validar-estable.yml` en el PR #4.
2. Corregir únicamente el error exacto si falla.
3. Si pasa, revisar muestras reales de Tecnología, Alimentación, Deportes, dinero/reconstrucción y una categoría completa.
4. Confirmar que no existan frases mecánicas, código accidental, cocina interna ni descripciones truncadas.
5. Fusionar PR #4 a `main`.
6. Esperar el despliegue de GitHub Pages.
7. Verificar públicamente portada, categorías, posts, sitemap, robots, 404 y Statcounter.
8. Confirmar indexabilidad real.
9. Recién después comenzar las siguientes 300 publicaciones.

## Reglas editoriales permanentes

- Nunca explicar al visitante cómo se hace el SEO o cómo trabaja internamente el sitio.
- Cada artículo debe resolver el tema específico con información, ejemplos, riesgos, pasos y acciones concretas.
- Evitar texto genérico repetido o frases de relleno.
- Verificar cuidadosamente alimentación, salud, actividad física, tecnología y dinero.
- No prometer resultados económicos, médicos ni de posicionamiento.
- Primero calidad; después volumen.

Para continuar en otra conversación, escribir: **seguir proyecto bd**

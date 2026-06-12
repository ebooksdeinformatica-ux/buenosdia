# Reescritura real de las 300 publicaciones

## Norma superior del proyecto

Todo trabajo editorial, técnico y SEO de `buenosdia.com` se realiza obligatoriamente bajo el modelo **ACTIVAR MODELO DE BLOG GITHUB**.

Este modelo tiene prioridad sobre cualquier generador anterior, plantilla automática o criterio de volumen. Exige simultáneamente:

- relevancia;
- calidad;
- confianza;
- accesibilidad técnica;
- autoridad;
- experiencia real;
- utilidad concreta para la audiencia;
- estructura por clústeres temáticos;
- revisión humana antes de publicar;
- fuentes primarias o autorizadas cuando corresponda;
- ausencia de contenido masivo genérico creado únicamente para posicionar.

La inteligencia artificial puede ayudar a investigar, estructurar, revisar estilo y resumir, pero nunca puede publicar masivamente sin control editorial. Si un artículo no cumple este modelo, no se considera terminado aunque el HTML sea válido.

## Decisión

Las 300 publicaciones actuales se consideran borradores defectuosos. No se elimina el conjunto ni se cambian las URLs existentes sin necesidad: se reemplazan completamente la descripción y el cuerpo editorial, en seis lotes de 50 publicaciones.

Conservar la URL permite evitar enlaces rotos y mantener cualquier señal de descubrimiento o indexación que ya exista. Un título podrá corregirse cuando sea necesario, pero la URL solo cambiará si es incorrecta, engañosa o irreparable; en ese caso deberá existir redirección.

## Orden de trabajo

1. Lote 1: Tecnología — 50 publicaciones.
2. Lote 2: Pan y Circo — 50 publicaciones.
3. Lote 3: Alimentación — 50 publicaciones.
4. Lote 4: Deportes — 50 publicaciones.
5. Lote 5: Matrix — 50 publicaciones.
6. Lote 6: Saliendo de la Matrix — 50 publicaciones.

Ningún lote pasa al siguiente hasta aprobar la auditoría editorial, SEO y técnica.

## Contrato editorial obligatorio por publicación

Cada artículo debe responder una intención concreta y diferente. No se permite reutilizar un artículo cambiando el título.

Debe contener:

- Título SEO natural y específico.
- H1 humano; puede ser distinto del title si mejora lectura.
- Descripción única y fiel de aproximadamente 130 a 160 caracteres.
- URL limpia con slug SEO, sin fecha.
- Autor ASPF y fecha de actualización real.
- Apertura propia, sin introducciones universales.
- Desarrollo original y sustancial, con un mínimo editorial de 900 palabras cuando el tema lo justifique; nunca se rellena para alcanzar una cifra.
- H2 y H3 descriptivos; H4 solamente cuando la jerarquía lo requiere.
- Explicación del problema real y de su mecanismo.
- Ejemplo concreto y verificable, no una frase motivacional.
- Procedimiento aplicable o decisiones claras.
- Riesgos, límites, errores y casos donde no conviene seguir el método.
- Criterios para comprobar el resultado.
- Preguntas frecuentes específicas del artículo.
- Enlaces internos dentro del texto y bloque de lecturas relacionadas.
- Fuentes primarias o autorizadas cuando existen afirmaciones técnicas, médicas, financieras, de seguridad o datos cambiantes.
- Etiquetas útiles y limitadas; no se generan tags por rellenar.
- Imagen 16:9 de 1200 × 675, WebP o formato optimizado, con alt descriptivo, Open Graph y Twitter Card.
- Botones para compartir y Statcounter obligatorio.

## Voz editorial de buenosdia.com

- Humana, íntima, directa y sincera.
- Párrafos cortos y ritmo natural.
- Primera persona cuando aporte experiencia real.
- Preguntas directas al lector sin abusar.
- Sin humo, sin moralina y sin tono de manual automático.
- SEO integrado de forma natural; el lector está antes que la palabra clave.
- Cierre reflexivo, sin repetir una conclusión prefabricada.

## Expresiones y comportamientos prohibidos

- “Guía práctica para...” como molde repetido.
- “Puede parecer una idea simple...”
- “El problema no suele ser no saber qué hacer...”
- “La trampa es creer que necesitás cambiar toda tu vida...”
- “No hace falta que hoy sea perfecto...”
- Aperturas, párrafos, listas, ejemplos, FAQ o cierres clonados entre artículos.
- Descripciones iguales con el título sustituido.
- Afirmaciones inventadas o cifras sin fuente.
- Contenido inflado, genérico o escrito únicamente para buscadores.

## Controles técnicos del lote

Cada HTML debe aprobar:

- canonical absoluto en `https://www.buenosdia.com/`;
- `BlogPosting` y `BreadcrumbList` válidos;
- metadatos Open Graph y Twitter;
- contenido principal disponible en HTML;
- imagen optimizada con dimensiones declaradas;
- navegación y enlaces internos sin errores;
- sitemap y `data/posts.json` actualizados;
- responsive y carga rápida;
- Statcounter con `sc_project=12058975`, `sc_invisible=1` y `sc_security="49f17e11"`;
- ausencia total de frases prohibidas, marcadores internos y párrafos clonados.

## Estado

- [ ] Lote 1 — Tecnología — 0/50 aprobadas.
- [ ] Lote 2 — Pan y Circo — 0/50 aprobadas.
- [ ] Lote 3 — Alimentación — 0/50 aprobadas.
- [ ] Lote 4 — Deportes — 0/50 aprobadas.
- [ ] Lote 5 — Matrix — 0/50 aprobadas.
- [ ] Lote 6 — Saliendo de la Matrix — 0/50 aprobadas.

La PR no se fusiona con publicaciones parciales, genéricas o pendientes de revisión.

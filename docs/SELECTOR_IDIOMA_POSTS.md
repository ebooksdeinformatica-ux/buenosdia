# Selector de idioma en posts

Los posts con versiones en varios idiomas muestran un selector visible ES / EN / FR.

## Funcion

- Ayudar al usuario a cambiar de idioma.
- Conectar visualmente las versiones de cada publicacion.
- Mantener el sitemap principal limpio.

## Implementacion

- Logica: `assets/js/app.js`.
- Estilos: `assets/css/main.css`.
- Mapa base: `data/i18n_posts.json`.
- SEO internacional: `sitemap-i18n.xml`.

## Regla

Cada post nuevo con versiones internacionales debe quedar agregado al mapa usado por el selector.

El selector no reemplaza al sitemap internacional ni al control editorial de calidad.

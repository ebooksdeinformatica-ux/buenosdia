BUENOSDIAS2560 — pack reparado (para GitHub + Netlify)

✔ Netlify ya está bien configurado:
   - Build command: npm run build
   - Publish directory: dist
   - Node 20

Cómo probar local:
1) Abrí una terminal en la carpeta del proyecto
2) npm run build
3) Abrí dist/index.html (doble click)

Si ves {{CATEGORIES_PILLS}} o {{YEAR}} en el sitio:
- era porque el build no estaba renderizando esos placeholders.
- Este build.mjs ya los resuelve (incluye alias + YEAR).

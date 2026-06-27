# Experiencia editorial en Google Drive

Objetivo: usar Google Drive como memoria editable de experiencia editorial y mantener GitHub como version estable del proyecto.

## Idea

- Drive: libreta viva editable.
- GitHub: copia estable usada por THOT y por los auditores.
- Sitio publico: nunca depende de Drive para cargar.

## Archivo principal

Archivo local estable:

`docs/EXPERIENCIA_EDITORIAL.md`

Archivo espejo en Drive:

`EXPERIENCIA_EDITORIAL.md`

## Flujo recomendado

1. Antes de redactar: traer la version de Drive hacia GitHub.
2. THOT lee la experiencia local junto con la fuente unica y el radar.
3. Despues de corregir o publicar: actualizar experiencia local.
4. Subir la nueva experiencia a Drive.

## Secretos necesarios en GitHub Actions

- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `THOT_DRIVE_EXPERIENCE_FILE_ID`

El service account debe tener permiso sobre el archivo o carpeta de Drive.

## Regla de seguridad

No guardar credenciales dentro del repo.
No publicar el archivo de credenciales.
No poner tokens en logs.

## Estado

Pendiente de conectar cuando esten cargados los secretos y exista el archivo espejo en Drive.

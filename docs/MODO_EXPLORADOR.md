# Modo Explorador BuenosDia

MORFEO define recorridos internos para que cada publicacion tenga un siguiente paso util.

El Modo Explorador tiene dos capas:

1. Capa visible: `/explorar/`, una pagina publica con rutas de lectura por necesidad real.
2. Capa editorial: este documento y `data/concept_map.json`, usados antes de publicar para no dejar finales muertos.

## Reglas

- No repetir siempre el mismo cierre.
- No usar enlaces decorativos.
- No enlazar por keyword solamente.
- Cada ruta debe responder a una necesidad real del lector.
- Cada post nuevo debe elegir una ruta principal antes de escribirse.
- El bloque final debe parecer una decision humana, no una lista automatica.
- Si se abre categoria nueva, crear o actualizar al menos una ruta exploradora.
- Si el usuario pregunta por continuidad, revisar este archivo antes de publicar.

## Rutas activas

### ordenar-ruido

Necesidad: tengo demasiadas cosas mezcladas.

Entrada principal:

- `como-ordenar-la-cabeza-cuando-todo-parece-demasiado`

Continuar con:

- `estar-ocupado-no-es-estar-presente`
- `bitacora-para-un-dia-torcido`
- `frases-para-volver-a-vos-sin-hacer-teatro`

### salir-del-automatico

Necesidad: siento que vivo por repeticion.

Entrada principal:

- `cuando-funcionas-en-automatico-y-ya-no-sabes-que-elegiste`

Continuar con:

- `estar-ocupado-no-es-estar-presente`
- `usar-ia-sin-entregar-tu-cabeza`
- `cuando-la-manana-pesa-salir-de-la-matrix`

### avanzar-sin-epica

Necesidad: quiero mover un proyecto, pero no tengo energia heroica.

Entrada principal:

- `cuaderno-de-campo-para-avanzar-cuando-no-tenes-epica`

Continuar con:

- `usar-ia-sin-entregar-tu-cabeza`
- `estar-ocupado-no-es-estar-presente`
- `carta-a-la-parte-de-vos-que-cree-que-ya-es-tarde`

### volver-a-vos

Necesidad: necesito una frase real que me devuelva centro sin sonar prefabricada.

Entrada principal:

- `frases-para-volver-a-vos-sin-hacer-teatro`

Continuar con:

- `como-ordenar-la-cabeza-cuando-todo-parece-demasiado`
- `carta-a-la-parte-de-vos-que-cree-que-ya-es-tarde`
- `cuaderno-de-campo-para-avanzar-cuando-no-tenes-epica`

### autonomia-digital

Necesidad: quiero usar herramientas digitales sin perder criterio.

Entrada principal:

- `usar-ia-sin-entregar-tu-cabeza`

Continuar con:

- `estar-ocupado-no-es-estar-presente`
- `cuaderno-de-campo-para-avanzar-cuando-no-tenes-epica`
- `cuando-funcionas-en-automatico-y-ya-no-sabes-que-elegiste`

### volver-a-levantarse

Necesidad: siento que ya es tarde o que perdi demasiado.

Entrada principal:

- `carta-a-la-parte-de-vos-que-cree-que-ya-es-tarde`

Continuar con:

- `bitacora-para-un-dia-torcido`
- `frases-para-volver-a-vos-sin-hacer-teatro`
- `cuaderno-de-campo-para-avanzar-cuando-no-tenes-epica`

### atravesar-dia-dificil

Necesidad: el dia viene torcido y necesito una decision posible.

Entrada principal:

- `bitacora-para-un-dia-torcido`

Continuar con:

- `como-ordenar-la-cabeza-cuando-todo-parece-demasiado`
- `cuando-la-manana-pesa-salir-de-la-matrix`
- `frases-para-volver-a-vos-sin-hacer-teatro`

## Antes de publicar

1. Leer `data/concept_map.json`.
2. Elegir ruta principal.
3. Elegir ruta secundaria si aporta valor.
4. Revisar que el cierre no repita el ultimo post.
5. Usar enlaces directos a publicaciones vivas.
6. Confirmar que la ruta nueva aparece en `/explorar/` si merece visibilidad publica.

El bloque debe ayudar al lector a decidir que leer despues sin parecer una lista automatica de relacionados.

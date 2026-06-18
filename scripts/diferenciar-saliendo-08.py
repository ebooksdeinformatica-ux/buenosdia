from pathlib import Path

COMMON = [
    "La reconstrucción no necesita parecer perfecta para empezar a ser real. Necesita una prueba concreta que puedas repetir sin traicionarte.",
    "Por una acción que puedas completar hoy y que deje evidencia visible. Lo pequeño sirve si reduce desorden o abre continuidad.",
    "Volvé a la versión mínima sin convertir la interrupción en identidad. La recuperación se mide por la capacidad de retomar.",
    "Cuando la base se sostiene varios días sin depender de entusiasmo extremo. Sumá una pieza por vez y observá si conserva estabilidad.",
]

SUFFIXES = {
    "crear-una-rutina-para-reconstruirte.html": [
        "En una rutina, esa prueba es un gesto diario reconocible.",
        "Puede ser preparar el espacio o abrir el archivo a una hora fija.",
        "Retomar el ancla más sencilla protege la continuidad.",
        "Agregá una práctica sólo cuando las anteriores entren sin pelea constante.",
    ],
    "levantar-una-web-como-quien-levanta-una-casa.html": [
        "En una web, esa realidad aparece cuando una página ya puede habitarse.",
        "Empezá por una portada clara y una publicación completa.",
        "Dejá escrito el próximo arreglo para volver a la obra sin confusión.",
        "Sumá otra sección cuando la estructura actual tenga uso real.",
    ],
    "dejar-de-pedir-permiso-para-empezar.html": [
        "La autonomía se reconoce en una decisión pequeña asumida con responsabilidad.",
        "Elegí un movimiento reversible que dependa verdaderamente de vos.",
        "Ajustar un riesgo concreto no equivale a devolver la decisión.",
        "Ampliá el alcance cuando ya tengas información propia sobre costos y tiempos.",
    ],
    "hacer-foco-cuando-todo-esta-roto.html": [
        "El foco vuelve real una sola decisión dentro del caos.",
        "Priorizá la acción que reduzca una amenaza concreta hoy.",
        "Retomá escribiendo cuál es la única salida esperada del bloque.",
        "Abrí otro frente sólo cuando el primero tenga un cierre visible.",
    ],
    "recuperar-confianza-con-pruebas-pequenas.html": [
        "La confianza necesita hechos recientes, no una promesa grandiosa.",
        "Elegí un compromiso que pueda comprobarse antes de terminar el día.",
        "Si falla, reducí su tamaño y mejorá las condiciones para repetirlo.",
        "Subí la dificultad después de reunir varias evidencias parecidas.",
    ],
}

for filename, suffixes in SUFFIXES.items():
    path = Path("posts") / filename
    text = path.read_text(encoding="utf-8")
    for paragraph, suffix in zip(COMMON, suffixes):
        text = text.replace(paragraph, f"{paragraph} {suffix}")
    text = text.replace('"@type": "BlogPosting"', '"@type":"BlogPosting"')
    text = text.replace('"@type": "BreadcrumbList"', '"@type":"BreadcrumbList"')
    path.write_text(text, encoding="utf-8")

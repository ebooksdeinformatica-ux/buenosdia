export const panYCirco = [
  {
    match: /scroll|clip corto|cultura del clip|migas|notificacion/,
    key: 'scroll-y-clips',
    summary: 'El scroll infinito convierte pausas de segundos en bloques largos de consumo; medir disparadores y quitar accesos automáticos ayuda a recuperar atención.',
    opener: 'El scroll infinito no suele empezar con la decisión de perder una hora. Empieza con un gesto corto: revisar una notificación, abrir un video y deslizar una vez más.',
    mechanism: ['El contenido breve elimina los puntos naturales de cierre. Siempre aparece otra pieza y la aplicación aprende qué formato retiene tu atención. Por eso confiar únicamente en fuerza de voluntad suele fallar.', 'El momento del día cambia el costo. Diez minutos durante una pausa no producen el mismo efecto que cuarenta minutos al despertar o antes de dormir, cuando desplazan planificación y descanso.'],
    example: 'Dejar el teléfono junto a la cama puede convertir la alarma en el primer disparador. Moverlo, quitar accesos directos y decidir una hora de primera revisión cambia el entorno antes de que aparezca la negociación.',
    steps: ['Medí tres días sin intentar corregirte.', 'Anotá hora y disparador.', 'Quitá notificaciones no necesarias.', 'Sacá la aplicación de la pantalla principal.', 'Usá un temporizador externo.', 'Prepará una actividad breve para reemplazar el gesto.'],
    mistakes: ['Bloquear todo y reinstalar al día siguiente.', 'Medir solo el total diario.', 'Usar el mismo teléfono como límite y tentación.', 'Reemplazar una aplicación por otra idéntica.'],
    metrics: ['Aperturas por día.', 'Minutos al despertar.', 'Hora de cierre nocturno.', 'Tareas iniciadas antes del primer consumo.']
  },
  {
    match: /serie|maraton|pelicula/,
    key: 'series-y-maraton',
    summary: 'Una serie puede ser descanso elegido o una maratón que desplaza sueño y proyectos; la diferencia se ve en el horario de corte y en cómo termina la sesión.',
    opener: 'Mirar una serie no es perder el tiempo por definición. El problema empieza cuando el siguiente episodio se reproduce antes de que puedas decidir si todavía querés seguir.',
    mechanism: ['El cierre automático del episodio, la reproducción continua y los finales abiertos reducen la fricción para continuar. Definir de antemano cantidad y hora de salida devuelve un punto de decisión.', 'También importa el efecto posterior. Si la sesión termina con descanso, está cumpliendo una función; si termina con culpa, sueño retrasado o tareas urgentes acumuladas, el costo fue mayor que el entretenimiento.'],
    example: 'Elegir una película o dos episodios antes de empezar produce un límite visible. Abrir una plataforma sin decidir qué mirar entrega la selección y la duración al catálogo.',
    steps: ['Elegí contenido antes de sentarte.', 'Definí episodio o hora de cierre.', 'Desactivá reproducción automática.', 'No mezcles la serie con trabajo pendiente.', 'Dejá unos minutos sin pantalla antes de dormir.', 'Revisá al día siguiente cómo descansaste.'],
    mistakes: ['Usar la pantalla para tapar cansancio extremo.', 'Empezar contenido largo demasiado tarde.', 'Mirar mientras se responde trabajo.', 'Creer que terminar una temporada es una obligación.'],
    metrics: ['Hora real de cierre.', 'Episodios no planificados.', 'Calidad del sueño.', 'Sensación al terminar.']
  },
  {
    match: /television|ruido de fondo|pantalla encendida|compania falsa/,
    key: 'television-de-fondo',
    summary: 'La televisión de fondo fragmenta el silencio y puede ocupar atención incluso cuando nadie la mira; apagarla en tareas y comidas permite medir su efecto real.',
    opener: 'Una pantalla encendida de fondo parece compañía, pero también mantiene voces, cambios de imagen y publicidad entrando a la cabeza durante horas.',
    mechanism: ['Aunque la atención principal esté en otra tarea, los cambios de volumen y escena interrumpen y obligan a volver. La sensación de cansancio puede crecer sin que recuerdes qué contenido consumiste.', 'El silencio puede resultar incómodo cuando no se practica. No hace falta eliminar toda compañía sonora: se puede comparar televisión, música elegida, radio o períodos breves sin estímulo.'],
    example: 'Una comida con noticias de fondo puede terminar sin conversación y con ansiedad por temas que nadie decidió escuchar. Apagar durante esa media hora permite observar si cambia el ritmo y la atención.',
    steps: ['Elegí dos momentos sin televisión.', 'Apagala durante trabajo que requiere lectura.', 'Separá contenido elegido de ruido automático.', 'Probá música sin anuncios como alternativa.', 'Registrá concentración y cansancio.', 'Volvé a encender solo para mirar algo concreto.'],
    mistakes: ['Dejarla encendida por costumbre.', 'Confundir ruido con descanso.', 'Consumir noticias repetidas todo el día.', 'Usar volumen alto para tapar otros estímulos.'],
    metrics: ['Horas encendida frente a horas realmente mirada.', 'Interrupciones durante tareas.', 'Conversaciones sin pantalla.', 'Nivel de cansancio al final del día.']
  },
  {
    match: /noticia|escandalo|discusion|opinan|estar al dia/,
    key: 'noticias-y-escandalo',
    summary: 'La información útil tiene fuente, contexto y consecuencia; el ciclo de escándalo repite urgencia y opinión sin aumentar la capacidad de entender o actuar.',
    opener: 'Estar informado no exige mirar la misma noticia durante todo el día. Después de conocer el hecho principal, muchas actualizaciones agregan reacción, discusión y espectáculo, pero poca información nueva.',
    mechanism: ['La urgencia retiene atención porque cada titular promete un cambio decisivo. Separar hecho, interpretación y comentario ayuda a detectar cuándo ya no estás aprendiendo.', 'Elegir horarios y fuentes reduce la exposición repetida. También permite comparar versiones en lugar de recibir fragmentos aislados entre publicidad y peleas.'],
    example: 'Leer una nota completa de una fuente identificada puede aportar más que veinte clips de personas reaccionando al mismo titular. El tiempo es parecido; la calidad de contexto no.',
    steps: ['Definí uno o dos horarios de información.', 'Leé más allá del titular.', 'Buscá fuente primaria cuando exista.', 'Separá noticia de opinión.', 'Evitá seguir discusiones sin datos nuevos.', 'Cerrá con una acción o decisión si el tema te afecta.'],
    mistakes: ['Actualizar por ansiedad.', 'Compartir antes de leer.', 'Tomar una tendencia como muestra de toda la realidad.', 'Confundir volumen de opiniones con evidencia.'],
    metrics: ['Veces que revisás el mismo tema.', 'Fuentes completas leídas.', 'Contenido compartido después de verificar.', 'Ansiedad antes y después de informarte.']
  },
  {
    match: /redes|comparacion|fama|famos|reality|autoestima/,
    key: 'redes-y-comparacion',
    summary: 'Las redes muestran fragmentos seleccionados y los convierten en medida de comparación; limitar exposición y usar indicadores propios protege criterio y autoestima.',
    opener: 'Comparar tu día completo con el momento más visible de otra persona produce una medida injusta. En redes casi nunca ves la rutina, los intentos fallidos, las deudas o el trabajo que quedó fuera de cámara.',
    mechanism: ['La comparación se intensifica cuando el contenido toca una inseguridad concreta: cuerpo, dinero, pareja, éxito o reconocimiento. Identificar qué cuentas y horarios disparan ese efecto permite actuar sobre algo específico.', 'Dejar de seguir, silenciar o reducir exposición no es negar la realidad. Es elegir qué información merece entrar todos los días y qué indicador propio vas a usar para medir avance.'],
    example: 'Una publicación sobre un logro puede hacerte sentir atrasado aunque esa persona tenga otra historia, recursos y prioridades. Volver a una métrica propia cambia la comparación por evidencia.',
    steps: ['Identificá cuentas que te dejan peor.', 'Silenciá antes de eliminar si necesitás probar.', 'No abras redes en momentos de baja energía.', 'Definí dos indicadores propios.', 'Publicá con intención, no para pedir validación inmediata.', 'Revisá el efecto después de una semana.'],
    mistakes: ['Comparar resultados sin contexto.', 'Seguir cuentas por obligación.', 'Medir valor personal con reacciones.', 'Usar redes durante cada pausa.'],
    metrics: ['Tiempo después de publicaciones disparadoras.', 'Cuentas silenciadas o elegidas.', 'Frecuencia de comparación.', 'Acciones propias terminadas.']
  },
  {
    match: /algoritmo|celular|telefono|notificaciones/,
    key: 'algoritmo-y-telefono',
    summary: 'El teléfono organiza la atención mediante avisos, ubicación y recomendaciones; cambiar la configuración y el lugar físico reduce decisiones automáticas.',
    opener: 'El algoritmo no necesita obligarte. Le alcanza con estar disponible en el bolsillo, encender la pantalla con una notificación y ofrecer contenido parecido a lo que ya te retuvo.',
    mechanism: ['Las recomendaciones se ajustan a conducta observable: qué abrís, cuánto mirás, dónde frenás y qué compartís. Esa personalización puede ser útil, pero también estrecha el contenido y explota momentos de aburrimiento.', 'Cambiar el entorno suele ser más efectivo que discutir con uno mismo. Silenciar avisos, sacar aplicaciones de inicio y dejar el teléfono fuera del alcance agrega segundos para recuperar decisión.'],
    example: 'Si el teléfono está sobre el escritorio, cada vibración compite con la tarea. En otra habitación o dentro de un cajón, la misma notificación deja de convertirse automáticamente en una interrupción.',
    steps: ['Desactivá avisos promocionales.', 'Agrupá mensajes no urgentes.', 'Quitá accesos de la pantalla principal.', 'Definí lugares sin teléfono.', 'Revisá recomendaciones y dejá de seguir contenido repetitivo.', 'Medí interrupciones durante una tarea.'],
    mistakes: ['Permitir avisos de todas las aplicaciones.', 'Dormir con el teléfono en la mano.', 'Usar cada espera para consumir.', 'Pensar que el contenido recomendado es neutral.'],
    metrics: ['Desbloqueos diarios.', 'Notificaciones recibidas.', 'Bloques de trabajo sin interrupción.', 'Tiempo hasta la primera revisión.']
  },
  {
    match: /anestesia|escapar|vacian|dopamina|pantalla ocupa|mirar todo|entretenimiento vacio/,
    key: 'entretenimiento-como-escape',
    summary: 'El entretenimiento se vuelve anestesia cuando evita una emoción o tarea y deja más cansancio que descanso; reconocer el disparador permite elegir otra respuesta.',
    opener: 'A veces no buscamos una película, una red o un video porque realmente queremos verlo. Lo buscamos para no sentir cansancio, preocupación, soledad o la incomodidad de empezar una tarea pendiente.',
    mechanism: ['El alivio inmediato refuerza la conducta, aunque después aparezcan culpa y atraso. Por eso el problema no se resuelve solamente quitando la pantalla: hay que preparar una alternativa para el momento que dispara el escape.', 'Descansar de verdad suele tener principio y final. La anestesia pierde registro del tiempo y necesita otro contenido apenas termina el anterior. Observar cómo salís de la sesión aporta más información que juzgar el formato.'],
    example: 'Después de un día difícil, decidir mirar una película puede ser descanso. Abrir videos sin elegir y seguir hasta la madrugada puede estar evitando el mismo cansancio que después empeora por falta de sueño.',
    steps: ['Nombrá qué querés evitar.', 'Elegí un descanso con duración.', 'Prepará una alternativa sin pantalla.', 'Reducí la tarea pendiente a diez minutos.', 'Dejá un cierre visible.', 'Revisá cómo quedaste después.'],
    mistakes: ['Eliminar ocio por completo.', 'Usar culpa como límite.', 'Confundir agotamiento con falta de voluntad.', 'No tratar el problema que dispara el escape.'],
    metrics: ['Sesiones elegidas frente a automáticas.', 'Hora de finalización.', 'Energía posterior.', 'Tareas pequeñas iniciadas antes del consumo.']
  },
  {
    match: /silencio|apagar|descansar|ocio consciente|elegir contenido|criterio propio/,
    key: 'descanso-y-criterio',
    summary: 'Descansar con criterio significa elegir formato, duración y efecto buscado; el silencio y el ocio sin algoritmo también necesitan práctica.',
    opener: 'Apagar una pantalla puede dejar un vacío extraño cuando cada pausa estaba ocupada por contenido. Ese vacío no prueba que necesitás volver a encender: muestra que el silencio dejó de ser habitual.',
    mechanism: ['El ocio consciente no exige convertir el descanso en productividad. Exige poder elegir qué hacer y reconocer cuándo fue suficiente.', 'Alternar contenidos, conversación, caminata, música, lectura o simplemente no hacer nada amplía las formas de descanso y reduce la dependencia de una sola plataforma.'],
    example: 'Preparar una lista corta de películas, música o actividades evita entrar a una plataforma para que el catálogo decida. La elección ocurre antes del cansancio.',
    steps: ['Reservá una pausa sin recomendaciones.', 'Elegí contenido antes de abrir la aplicación.', 'Probá diez minutos de silencio.', 'Caminá sin mirar el teléfono.', 'Terminá el ocio a una hora acordada.', 'Registrá qué descanso realmente recupera energía.'],
    mistakes: ['Llenar todo silencio con audio.', 'Convertir el descanso en otra obligación.', 'Elegir cuando ya estás agotado.', 'Quedarte por inercia después de disfrutar.'],
    metrics: ['Pausas elegidas.', 'Formas distintas de descanso.', 'Capacidad de cortar.', 'Energía recuperada.']
  },
  {
    match: /.*/,
    key: 'atencion-y-entretenimiento',
    summary: '{t} se entiende observando cuánto dura, qué lo dispara y qué efecto deja sobre sueño, atención y tareas elegidas.',
    opener: '{t} no necesita ser prohibido para ser revisado. Alcanza con dejar de tratarlo como fondo invisible y medir qué lugar ocupa realmente.',
    mechanism: ['El consumo automático crece cuando no tiene horario, propósito ni punto de cierre. Una regla pequeña y visible devuelve una decisión.', 'El efecto posterior permite distinguir descanso de desgaste. La misma actividad puede cumplir funciones distintas según el momento y la duración.'],
    example: 'Registrar durante tres días el inicio, el final y la sensación posterior suele mostrar patrones que la memoria minimiza.',
    steps: ['Medí antes de cambiar.', 'Identificá el disparador.', 'Definí un punto de cierre.', 'Prepará una alternativa.', 'Reducí notificaciones.', 'Revisá el efecto semanal.'],
    mistakes: ['Juzgar sin medir.', 'Prohibir y volver por rebote.', 'Cambiar una pantalla por otra.', 'Ignorar sueño y ansiedad.'],
    metrics: ['Duración.', 'Frecuencia.', 'Horario.', 'Efecto posterior.']
  }
];

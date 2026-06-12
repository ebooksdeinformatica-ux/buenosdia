export const tecnologia = [
  {
    match: /computadora vieja|computadora lenta|notebook|equipo perfecto|pocos recursos|equipo no ayuda/,
    key: 'pc-vieja',
    summary: 'Una computadora vieja todavía puede servir para escribir, administrar una web, programar tareas livianas y vender servicios si el trabajo se adapta a sus límites.',
    opener: 'Una computadora vieja no tiene que competir con una máquina nueva para ser útil. Tiene que ejecutar sin trabarse el pequeño grupo de tareas que realmente necesitás terminar: escribir, editar HTML, responder clientes, ordenar archivos, publicar contenido o automatizar procesos livianos.',
    mechanism: [
      'El cuello de botella suele aparecer en uno de cuatro lugares: demasiados programas al iniciar, memoria ocupada por pestañas y aplicaciones, almacenamiento casi lleno o un disco lento. Antes de comprar nada, conviene abrir el administrador de tareas y observar qué recurso llega al límite durante el trabajo real.',
      'El tipo de proyecto importa más que la edad del equipo. Una web estática, un editor de texto, hojas de cálculo moderadas y scripts pequeños consumen mucho menos que edición de video, máquinas virtuales o docenas de pestañas. Elegir una carga compatible evita pelear todos los días contra la computadora.'
    ],
    example: 'Un equipo con poca memoria puede sostener un blog si se trabaja con un editor liviano, imágenes ya comprimidas y pocas pestañas. La misma máquina puede volverse inutilizable si intenta mantener videollamadas, edición pesada y varias aplicaciones abiertas al mismo tiempo.',
    steps: ['Desactivá programas de inicio que no necesitás.', 'Liberá espacio y conservá una copia externa de los archivos importantes.', 'Elegí un navegador y un editor liviano.', 'Trabajá con una tarea principal por vez.', 'Probá una entrega pequeña: una página, una publicación o un archivo terminado.', 'Recién después evaluá si conviene ampliar memoria o cambiar a un disco más rápido.'],
    mistakes: ['Instalar supuestos optimizadores de origen dudoso.', 'Abrir más herramientas de las que el proyecto necesita.', 'Guardar todo en un único disco sin respaldo.', 'Confundir lentitud del equipo con falta de método.'],
    metrics: ['Tiempo desde el encendido hasta poder trabajar.', 'Memoria usada con las aplicaciones habituales.', 'Cantidad de bloqueos durante una sesión.', 'Entregas terminadas por semana.']
  },
  {
    match: /inteligencia artificial|\bia\b|prompt/,
    key: 'ia-y-prompts',
    summary: 'La inteligencia artificial aporta más cuando recibe contexto, límites y un resultado verificable; sin eso suele producir texto correcto en apariencia pero poco útil.',
    opener: 'Usar inteligencia artificial para trabajar no consiste en pedir “haceme algo bueno”. El resultado mejora cuando explicás qué estás construyendo, para quién, con qué información, qué debe evitar y cómo vas a comprobar que la respuesta sirve.',
    mechanism: [
      'Un pedido útil incluye objetivo, contexto, material de referencia, restricciones y formato de salida. También conviene dividir tareas grandes: primero esquema, después borrador, luego verificación y finalmente edición con voz propia.',
      'La IA puede inventar datos, mezclar versiones o afirmar con seguridad algo incorrecto. Por eso no debería decidir sola sobre salud, dinero, seguridad, código en producción o información que depende de una fuente actualizada. El control humano es parte del proceso.'
    ],
    example: 'Para preparar una publicación real, primero se puede pedir una lista de preguntas que el lector necesita resolver; después, desarrollar cada respuesta con fuentes; por último, revisar afirmaciones, ejemplos y tono. Pedir el artículo entero de una vez suele aumentar el relleno.',
    steps: ['Definí una entrega concreta.', 'Pegá solo el contexto necesario y quitá datos sensibles.', 'Pedí supuestos y dudas antes del resultado.', 'Trabajá por secciones.', 'Verificá nombres, cifras, fechas y enlaces.', 'Editá el texto para que conserve tu criterio y tu forma de hablar.'],
    mistakes: ['Publicar la primera respuesta sin revisarla.', 'Usar datos privados como material de prueba.', 'Pedir objetivos contradictorios.', 'Confundir fluidez con exactitud.'],
    metrics: ['Correcciones necesarias antes de publicar.', 'Tiempo realmente ahorrado.', 'Cantidad de afirmaciones verificadas.', 'Porcentaje del resultado que termina siendo útil.']
  },
  {
    match: /contrase|cuentas|seguridad digital/,
    key: 'seguridad-cuentas',
    summary: 'Proteger cuentas empieza por contraseñas únicas, segundo factor y recuperación comprobada; una credencial reutilizada puede abrir varios servicios.',
    opener: 'La seguridad de una cuenta no depende de recordar una contraseña complicada. Depende de que cada servicio tenga una clave distinta, de activar una segunda verificación y de conservar métodos de recuperación que realmente funcionen.',
    mechanism: [
      'Cuando una contraseña se reutiliza, una filtración en un sitio menos importante puede comprometer correo, redes, dominios o servicios financieros. Un gestor de contraseñas permite crear claves largas sin convertir la memoria en el único sistema de protección.',
      'El correo principal merece prioridad porque suele recibir enlaces para restablecer otras cuentas. También conviene revisar sesiones abiertas, aplicaciones conectadas, teléfonos o correos de recuperación y códigos de emergencia.'
    ],
    example: 'Una cuenta puede tener una contraseña fuerte y seguir siendo frágil si el correo de recuperación está abandonado. La prueba real consiste en simular el proceso de recuperación sin completar el cambio y confirmar que los datos siguen bajo tu control.',
    steps: ['Empezá por correo, dominios y cuentas financieras.', 'Cambiá credenciales repetidas.', 'Activá autenticación multifactor.', 'Guardá códigos de recuperación fuera del equipo principal.', 'Revisá sesiones y aplicaciones conectadas.', 'Anotá quién administra cada cuenta de un proyecto.'],
    mistakes: ['Usar variaciones mínimas de la misma contraseña.', 'Guardar claves en un archivo sin protección.', 'Depender únicamente de mensajes SMS.', 'No actualizar datos de recuperación.'],
    metrics: ['Cuentas críticas con clave única.', 'Cuentas con segundo factor activo.', 'Métodos de recuperación comprobados.', 'Sesiones desconocidas eliminadas.'],
    sources: ['passwords']
  },
  {
    match: /archivo|carpeta|backup|respaldo|base de conocimiento|archivo maestro|organizar proyectos/,
    key: 'archivos-y-respaldo',
    summary: 'Un sistema de archivos útil permite encontrar, versionar y recuperar el trabajo sin depender de la memoria ni de una única copia.',
    opener: 'Ordenar archivos no es poner todo dentro de muchas carpetas. Es poder responder tres preguntas sin perder tiempo: dónde está la versión vigente, qué cambió y cómo se recupera el proyecto si el equipo falla.',
    mechanism: [
      'Una estructura corta suele funcionar mejor: proyecto, material, trabajo, publicado y respaldo. Los nombres deben incluir información que permita reconocer el archivo sin abrirlo, pero no necesitan convertirse en una novela.',
      'Sin versiones, un cambio accidental puede destruir horas de trabajo. Para documentos simples alcanza con copias numeradas o fechadas; para código conviene usar control de versiones. Un respaldo solo cuenta cuando está separado del equipo y puede restaurarse.'
    ],
    example: 'En una web, conviene separar textos, imágenes originales, imágenes optimizadas y archivos publicados. Si todo se mezcla en Descargas, cada corrección obliga a reconstruir la historia del proyecto.',
    steps: ['Elegí una carpeta raíz por proyecto.', 'Definí cinco o menos subcarpetas estables.', 'Renombrá primero los archivos activos.', 'Separá originales de archivos publicados.', 'Creá una copia fuera del equipo.', 'Probá recuperar un archivo antes de confiar en el respaldo.'],
    mistakes: ['Crear carpetas tan profundas que nadie recuerda el camino.', 'Usar nombres como final-final-ahora-si.', 'Sincronizar una eliminación y llamarla respaldo.', 'Guardar credenciales junto con archivos públicos.'],
    metrics: ['Tiempo para localizar la versión correcta.', 'Archivos importantes con copia separada.', 'Cantidad de duplicados confusos.', 'Proyectos que pueden retomarse sin reconstruir contexto.']
  },
  {
    match: /blog|web|pagina|sitio|seo|adsense|github|html|estatica|index|url|publicar mejor/,
    key: 'web-y-publicacion',
    summary: 'Una web útil necesita contenido claro, HTML rastreable, navegación estable y mantenimiento simple; agregar tecnología no compensa una estructura confusa.',
    opener: 'Crear o mejorar una web empieza por decidir qué tiene que encontrar una persona y qué acción debería poder realizar. El diseño, el SEO y la tecnología vienen después de esa respuesta, no antes.',
    mechanism: [
      'Para que una página sea entendible por visitantes y buscadores, el contenido principal debe estar en el HTML, con un título claro, una descripción fiel, enlaces internos y una URL estable. El rendimiento también importa: imágenes pesadas y scripts innecesarios deterioran la experiencia.',
      'Una publicación no termina al subir el archivo. Hay que comprobar enlaces, canonical, vista móvil, imagen social, sitemap y acceso desde la portada o una categoría. Una página huérfana puede existir técnicamente y seguir siendo difícil de descubrir.'
    ],
    example: 'Un sitio estático con pocas hojas de estilo y contenido bien enlazado puede ser más rápido y mantenible que una instalación cargada de plugins. La mejor arquitectura es la que permite publicar y corregir sin romper el resto.',
    steps: ['Definí la intención de la página.', 'Escribí primero el contenido principal.', 'Usá un H1 y subtítulos que describan el tema.', 'Comprimí las imágenes.', 'Enlazá desde una página que ya exista.', 'Revisá sitemap, canonical y respuesta 404.'],
    mistakes: ['Escribir para una palabra clave y no para una necesidad.', 'Ocultar el contenido detrás de JavaScript innecesario.', 'Cambiar URLs sin redirección.', 'Publicar cientos de páginas repetidas.'],
    metrics: ['Tiempo de carga percibido.', 'Páginas accesibles desde navegación interna.', 'Errores de enlaces y canonical.', 'Consultas reales que encuentran respuesta.'],
    sources: ['git']
  },
  {
    match: /programacion|aprender|conocimiento|habilidad vieja|experiencia vieja|volver a tu oficio/,
    key: 'aprendizaje-tecnico',
    summary: 'Aprender tecnología se vuelve útil cuando cada concepto termina en una pequeña entrega: un script, una página, una corrección o una explicación propia.',
    opener: 'Aprender programación o recuperar una habilidad técnica no exige memorizar un lenguaje entero. Exige trabajar con un problema pequeño, leer el error, cambiar una cosa y conservar una versión que funcione.',
    mechanism: [
      'Los tutoriales aportan vocabulario, pero la comprensión aparece al modificar el ejemplo y enfrentar una consecuencia inesperada. Por eso conviene alternar estudio corto con práctica inmediata.',
      'Un proyecto de aprendizaje debe ser lo bastante pequeño para terminarse y lo bastante real para obligarte a decidir. Copiar una aplicación enorme suele ocultar qué parte entendiste y qué parte solo reprodujiste.'
    ],
    example: 'En vez de “aprender JavaScript”, podés crear un formulario que valide tres campos, guardar la versión y después agregar una mejora. Cada cambio deja evidencia y produce preguntas concretas.',
    steps: ['Elegí una tarea de menos de una semana.', 'Construí la versión mínima.', 'Anotá errores y soluciones.', 'Explicá con tus palabras qué hace cada parte.', 'Modificá el ejemplo sin copiar.', 'Publicá o guardá una demostración.'],
    mistakes: ['Cambiar de curso cada pocos días.', 'Copiar código sin ejecutarlo por partes.', 'Empezar por una arquitectura demasiado grande.', 'Medir avance solo por horas de video.'],
    metrics: ['Entregas que funcionan.', 'Errores que podés explicar.', 'Cambios realizados sin seguir un tutorial.', 'Tiempo para retomar después de una pausa.']
  },
  {
    match: /automat|rutina digital|calendario editorial|mantenimiento web|semana de produccion|producir mas/,
    key: 'automatizacion-y-flujo',
    summary: 'Automatizar sirve cuando elimina una repetición estable y deja registros; automatizar un proceso confuso solamente repite el desorden más rápido.',
    opener: 'Antes de automatizar una tarea hay que ejecutarla manualmente y escribir sus pasos. Si cada vez cambia la entrada, la decisión o el resultado, todavía no existe un proceso suficientemente estable.',
    mechanism: [
      'Una automatización segura define entrada, transformación, salida, registro y forma de recuperación. También necesita límites: qué hace ante un archivo faltante, una respuesta inválida o una conexión interrumpida.',
      'Las mejores primeras automatizaciones son pequeñas: renombrar archivos, generar una lista, validar enlaces, crear copias o preparar metadatos. Ahorran minutos repetidos sin convertir todo el proyecto en una caja negra.'
    ],
    example: 'Un script que crea un sitemap puede ser útil si primero valida URLs y guarda un informe. Si solo sobrescribe el archivo sin comprobar nada, acelera también la publicación de errores.',
    steps: ['Documentá el proceso manual.', 'Identificá el paso repetitivo.', 'Definí entradas y salidas.', 'Probá con una copia de los datos.', 'Registrá errores y resultados.', 'Conservá una forma manual de recuperación.'],
    mistakes: ['Automatizar decisiones que todavía requieren criterio.', 'Trabajar directamente sobre archivos únicos.', 'No registrar qué cambió.', 'Depender de una herramienta que no permite exportar.'],
    metrics: ['Minutos ahorrados por ejecución.', 'Errores detectados antes de publicar.', 'Tareas completadas sin intervención.', 'Tiempo necesario para recuperar una falla.']
  },
  {
    match: /vender|ingreso|servicio|producto digital|plantilla|marca personal|oportunidad|valor digital|vivir de internet|proyecto online/,
    key: 'ingresos-digitales',
    summary: 'Convertir conocimientos informáticos en ingresos requiere una oferta concreta, una entrega demostrable y conversaciones con personas que realmente tienen ese problema.',
    opener: 'Saber hacer muchas cosas en internet no es todavía una oferta. Una persona compra cuando entiende qué problema resolvés, qué recibe, cuánto tarda y qué necesita entregarte para empezar.',
    mechanism: [
      'El primer servicio conviene que sea estrecho: optimizar una web, preparar una plantilla, ordenar un catálogo, automatizar una tarea o resolver una configuración específica. Cuanto más clara es la entrega, más fácil resulta estimar tiempo y precio.',
      'Antes de construir un producto grande, conviene probar la necesidad con conversaciones y una versión pequeña. Las respuestas reales muestran qué parte valoran, qué objeciones aparecen y qué lenguaje usa el cliente.'
    ],
    example: 'En lugar de ofrecer “soluciones digitales”, podés ofrecer una revisión de velocidad y estructura para una web pequeña con un informe y tres correcciones incluidas. Esa propuesta puede mostrarse, cotizarse y compararse.',
    steps: ['Elegí un problema que ya sepas resolver.', 'Definí una entrega visible.', 'Prepará un ejemplo o demostración.', 'Hablá con cinco posibles clientes.', 'Cobrale a la primera versión un precio de prueba razonable.', 'Registrá tiempo, dudas y cambios pedidos.'],
    mistakes: ['Crear un producto durante meses sin validarlo.', 'Prometer resultados que no controlás.', 'Aceptar trabajos sin alcance definido.', 'Confundir seguidores con clientes.'],
    metrics: ['Conversaciones con personas del público elegido.', 'Propuestas enviadas.', 'Entregas completadas dentro del alcance.', 'Horas reales y margen por trabajo.']
  },
  {
    match: /.*/,
    key: 'herramientas-digitales',
    summary: '{t} funciona mejor cuando se define una tarea concreta, se elige una herramienta principal y se conserva un resultado que pueda revisarse.',
    opener: '{t} no debería convertirse en otra colección de aplicaciones abiertas. El punto es reducir una tarea real hasta poder terminarla con los recursos que ya tenés.',
    mechanism: ['La herramienta correcta depende del archivo de entrada, la entrega esperada, el equipo disponible y la frecuencia de uso. Una opción más simple suele ser mejor si permite exportar y retomar el trabajo.', 'Cada sesión necesita un cierre visible: un archivo guardado, una publicación subida, una prueba ejecutada o el próximo paso escrito. Sin ese cierre, el trabajo digital se diluye entre pestañas.'],
    example: 'Una prueba pequeña permite comparar dos herramientas con el mismo archivo y la misma tarea. Así la elección se basa en tiempo, estabilidad y calidad del resultado, no en publicidad.',
    steps: ['Definí qué debe quedar terminado.', 'Elegí una herramienta principal.', 'Probá con datos no críticos.', 'Guardá una versión anterior.', 'Terminá una entrega mínima.', 'Anotá el siguiente paso.'],
    mistakes: ['Instalar por curiosidad sin una tarea.', 'Cambiar de herramienta antes de aprender lo básico.', 'No conservar versiones.', 'Depender de formatos cerrados.'],
    metrics: ['Tareas terminadas.', 'Tiempo de aprendizaje.', 'Errores recuperables.', 'Archivos exportables.']
  }
];

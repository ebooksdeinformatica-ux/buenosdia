import fs from 'node:fs';

const SITE = 'https://www.buenosdia.com';
const POSTS_FILE = 'data/posts.json';
const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));

const SOURCES = {
  diet: [
    { name: 'Organización Mundial de la Salud — Alimentación saludable', url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' },
    { name: 'Ministerio de Salud de Argentina — Gráfica de alimentación saludable', url: 'https://www.argentina.gob.ar/salud/alimentacion-saludable/grafico' }
  ],
  activity: [
    { name: 'Organización Mundial de la Salud — Actividad física', url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity' }
  ],
  git: [
    { name: 'GitHub Docs — Acerca de Git', url: 'https://docs.github.com/es/get-started/using-git/about-git' }
  ],
  security: [
    { name: 'CISA — Use strong passwords', url: 'https://www.cisa.gov/secure-our-world/use-strong-passwords' }
  ],
  money: [
    { name: 'Consumer Financial Protection Bureau — Fondo de emergencia', url: 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/' }
  ]
};

const CATEGORY_SLUG = {
  'Tecnología': 'tecnologia',
  'Pan y Circo': 'pan-y-circo',
  'Alimentación': 'alimentacion',
  'Deportes': 'deportes',
  'Matrix': 'matrix',
  'Saliendo de la Matrix': 'saliendo-de-la-matrix'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}
function strip(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function hash(value) {
  let h = 2166136261;
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
function pick(list, seed, offset = 0) {
  return list[(seed + offset) % list.length];
}
function slugify(value) {
  return strip(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function titleFromPost(post) {
  return post.title.trim();
}
function categorySlug(post) {
  return CATEGORY_SLUG[post.category] || slugify(post.category);
}
function sourcesHtml(keys = []) {
  const items = keys.flatMap(k => SOURCES[k] || []);
  const unique = [...new Map(items.map(x => [x.url, x])).values()];
  if (!unique.length) return '';
  return `<section class="related-box sources-box"><h2>Fuentes consultadas</h2><ul>${unique.map(s => `<li><a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.name)}</a></li>`).join('')}</ul><p>La información es general y no reemplaza una evaluación profesional cuando existe un problema médico, nutricional, físico o financiero concreto.</p></section>`;
}

function classify(post) {
  const t = strip(post.title);
  if (post.category === 'Tecnología') {
    if (/contrasen|cuentas|backup|respaldo|seguridad/.test(t)) return 'security';
    if (/inteligencia artificial|\bia\b|prompt/.test(t)) return 'ai';
    if (/git|github|web|blog|pagina|seo|adsense/.test(t)) return 'web';
    if (/vender|ingres|servicio|producto|dinero|marca personal/.test(t)) return 'digital-income';
    if (/archivo|organizar|rutina|calendario|mantenimiento/.test(t)) return 'workflow';
    return 'tool';
  }
  if (post.category === 'Pan y Circo') {
    if (/scroll|clip|notificacion|celular/.test(t)) return 'scroll';
    if (/noticias|opinan|discusion|escandalo/.test(t)) return 'news';
    if (/redes|comparacion|fama|algoritmo/.test(t)) return 'social';
    if (/serie|pelicula|television|reality|entretenimiento/.test(t)) return 'entertainment';
    return 'attention';
  }
  if (post.category === 'Alimentación') {
    if (/azucar|antojo|hambre emocional|atracon/.test(t)) return 'cravings';
    if (/presupuesto|comprar|supermercado/.test(t)) return 'budget-food';
    if (/agua|mate|cafe/.test(t)) return 'hydration';
    if (/desayuno|cocina|preparar|heladera|delivery/.test(t)) return 'meal-planning';
    if (/ultraproces|paquete|sal|fritura/.test(t)) return 'food-quality';
    return 'balanced-diet';
  }
  if (post.category === 'Deportes') {
    if (/caminar|caminata/.test(t)) return 'walking';
    if (/volver|empezar|abandon|sin ganas|verguenza/.test(t)) return 'restart';
    if (/fuerza|musculo|gimnasio/.test(t)) return 'strength';
    if (/descanso|rodilla|espalda|recuper/.test(t)) return 'recovery';
    return 'consistency';
  }
  if (post.category === 'Matrix') {
    if (/notificacion|pantalla|algoritmo/.test(t)) return 'digital-control';
    if (/comprar|consumo|publicidad|supermercado/.test(t)) return 'consumption';
    if (/trabajo|viernes|agenda|ocupado|disponible/.test(t)) return 'work-routine';
    if (/comparacion|deseo|identidad/.test(t)) return 'comparison';
    return 'autopilot';
  }
  if (post.category === 'Saliendo de la Matrix') {
    if (/dinero|ingreso|negocio|habilidad|oferta/.test(t)) return 'income-plan';
    if (/web|proyecto|archivo|activo digital/.test(t)) return 'project-plan';
    if (/foco|agenda|rutina|disciplina/.test(t)) return 'focus-plan';
    if (/pozo|caer|reconstru|empezar de cero|autoestima/.test(t)) return 'rebuild';
    return 'action-plan';
  }
  return 'general';
}

const DIRECT_OPENINGS = {
  security: topic => `${topic} empieza por reducir dos riesgos básicos: reutilizar credenciales y depender de una sola copia de los archivos. Una contraseña fuerte no sirve de mucho si se usa en todas las cuentas, y un proyecto importante sigue siendo frágil si solo existe en un disco.`,
  ai: topic => `${topic} funciona mejor cuando el pedido incluye contexto, objetivo, límites y un formato de salida. La herramienta puede acelerar trabajo, pero no decide por vos qué resultado vale la pena conservar.`,
  web: topic => `${topic} exige separar contenido, estructura y mantenimiento. Una página clara, rápida y fácil de actualizar suele ser más útil que un sistema enorme que nadie puede sostener.`,
  'digital-income': topic => `${topic} necesita una oferta concreta: qué problema resolvés, para quién, qué entregás y cuánto trabajo requiere. Sin esa definición, la idea queda atrapada entre aprendizaje infinito y publicaciones que no venden nada.`,
  workflow: topic => `${topic} mejora cuando cada archivo tiene un lugar, cada tarea un próximo paso y cada sesión termina con algo guardado. El orden no es decoración: reduce el tiempo perdido al retomar.`,
  tool: topic => `${topic} tiene sentido cuando resuelve una tarea concreta. Antes de sumar programas, conviene definir qué querés terminar, qué limitaciones tiene tu equipo y qué resultado vas a guardar.`,
  scroll: topic => `${topic} no suele sentirse como una decisión larga: son decenas de gestos cortos que juntos ocupan una parte importante del día. El primer paso es medir cuándo empieza, qué lo dispara y cómo quedás después.`,
  news: topic => `${topic} puede informar o dejarte atrapado en una sucesión de urgencias sin capacidad de actuar. Conviene separar información útil, opinión, espectáculo y repetición.`,
  social: topic => `${topic} mezcla comparación, recompensa rápida y contenido seleccionado por sistemas que aprenden qué te retiene. Recuperar criterio implica elegir horarios, fuentes y límites antes de abrir la aplicación.`,
  entertainment: topic => `${topic} puede ser descanso real, pero también una forma de postergar sueño, movimiento o proyectos. La diferencia aparece en la intención, el tiempo y el efecto que deja después.`,
  attention: topic => `${topic} se vuelve más claro cuando observás tu atención como un recurso limitado. Cada interrupción parece pequeña, pero obliga a volver a entrar en la tarea y aumenta la sensación de cansancio.`,
  cravings: topic => `${topic} puede estar relacionado con hambre física, hábitos, disponibilidad de alimentos, emociones o falta de planificación. Conviene observar el patrón antes de castigarse o aplicar restricciones extremas.`,
  'budget-food': topic => `${topic} mejora con una lista breve, alimentos versátiles y menos compras decididas con hambre. El objetivo no es comer perfecto, sino reducir desperdicio, improvisación y dependencia de opciones costosas.`,
  hydration: topic => `${topic} requiere mirar el conjunto del día: agua disponible, clima, actividad física, comidas y bebidas habituales. No existe una cifra única que sirva igual para todas las personas y situaciones.`,
  'meal-planning': topic => `${topic} se vuelve más fácil cuando una parte de la decisión ya está tomada. Preparar una base, dejar alimentos visibles y reservar porciones reduce la dependencia del cansancio del momento.`,
  'food-quality': topic => `${topic} no se resuelve prohibiendo todo. Una estrategia sostenible consiste en aumentar alimentos simples y variados, revisar frecuencia y porciones, y reducir gradualmente productos con exceso de azúcares libres, sodio o grasas poco saludables.`,
  'balanced-diet': topic => `${topic} se apoya en variedad, equilibrio, moderación y alimentos seguros. La composición exacta cambia según edad, actividad, cultura, presupuesto y condiciones de salud.`,
  walking: topic => `${topic} es una entrada accesible al movimiento porque permite ajustar ritmo, duración y recorrido. Para alguien sedentario, empezar con poco y repetir suele ser más útil que una sesión intensa seguida de varios días de abandono.`,
  restart: topic => `${topic} requiere aceptar que el cuerpo actual no es el de la última etapa activa. Volver bien significa empezar por debajo del máximo, observar molestias y aumentar de forma gradual.`,
  strength: topic => `${topic} mejora con técnica, progresión y recuperación. El peso o la cantidad de repeticiones importan menos que ejecutar de forma controlada y sostener la rutina sin dolor anormal.`,
  recovery: topic => `${topic} forma parte del entrenamiento. Dormir, alternar cargas y prestar atención a molestias persistentes ayuda a evitar que una semana exigente se convierta en una interrupción larga.`,
  consistency: topic => `${topic} depende más de una rutina repetible que de una sesión perfecta. Un plan mínimo para días difíciles protege la continuidad y evita el ciclo de exceso, agotamiento y abandono.`,
  'digital-control': topic => `${topic} ocurre muchas veces antes de que tomes una decisión consciente. Cambiar notificaciones, ubicación del teléfono y horarios de revisión modifica el entorno para que la atención no dependa solo de fuerza de voluntad.`,
  consumption: topic => `${topic} se entiende mejor cuando separás necesidad, comodidad, impulso y comparación. Esperar antes de comprar y revisar el costo total suele revelar decisiones que parecían urgentes.`,
  'work-routine': topic => `${topic} puede llenar el día sin acercarte a una prioridad propia. Registrar tareas, interrupciones y tiempo de recuperación ayuda a distinguir trabajo real de disponibilidad permanente.`,
  comparison: topic => `${topic} toma fragmentos visibles de la vida ajena y los compara con tu experiencia completa. Reducir exposición y volver a indicadores propios ayuda a recuperar una medida más justa.`,
  autopilot: topic => `${topic} se sostiene con decisiones repetidas que ya no se sienten como decisiones. Para cambiarlo no hace falta romper toda la rutina: alcanza con identificar un punto automático y diseñar una alternativa.`,
  'income-plan': topic => `${topic} requiere transformar una capacidad en una oferta comprobable. El orden útil es problema, cliente, entrega, precio de prueba, conversación y mejora; no promesas de ingresos rápidos.`,
  'project-plan': topic => `${topic} avanza cuando existe una entrega visible y una fecha. Un proyecto sin próximo paso se convierte en una idea que ocupa espacio mental pero no produce evidencia.`,
  'focus-plan': topic => `${topic} mejora cuando el día tiene una prioridad, un bloque protegido y una definición clara de terminado. El foco no es ausencia total de distracciones: es volver a la tarea elegida.`,
  rebuild: topic => `${topic} no ocurre en una sola decisión. Se construye con pruebas pequeñas de capacidad: cumplir una hora, terminar una tarea, pedir ayuda, ordenar una cuenta o sostener una semana.`,
  'action-plan': topic => `${topic} necesita una acción observable, un límite de tiempo y una revisión. Pensar sin producir una prueba mantiene la sensación de movimiento, pero no cambia la situación.`
};

const INTENT_BLOCKS = {
  security: {
    headings: ['Riesgos que conviene reducir primero','Un sistema simple de protección','Errores frecuentes','Plan de revisión mensual'],
    paragraphs: [
      'Usar una contraseña distinta para cada cuenta evita que una filtración abra todas las demás. Un gestor de contraseñas permite guardar credenciales largas sin depender de la memoria.',
      'La autenticación multifactor agrega una verificación adicional. Cuando esté disponible, conviene activarla especialmente en correo, servicios financieros, redes y cuentas que administran dominios o sitios.',
      'Para los archivos importantes, una sola copia no es respaldo. Conviene mantener al menos una copia separada del equipo principal y comprobar de vez en cuando que realmente pueda abrirse.',
      'Las actualizaciones corrigen errores y vulnerabilidades conocidas. Antes de postergarlas indefinidamente, conviene guardar el trabajo y planificar un momento para aplicarlas.'
    ], sources:['security']
  },
  ai: {
    headings: ['Qué información necesita un buen pedido','Cómo revisar una respuesta','Tareas donde puede ahorrar tiempo','Límites que no conviene ignorar'],
    paragraphs: [
      'Un pedido mejora cuando explica el contexto, el público, el objetivo, el tono, las restricciones y el formato esperado. También ayuda incluir un ejemplo de lo que sería una buena respuesta.',
      'La salida debe revisarse. Nombres, fechas, cifras, citas, código y recomendaciones pueden contener errores. La velocidad de generación no reemplaza la comprobación.',
      'La inteligencia artificial puede ayudar a resumir material propio, ordenar ideas, proponer alternativas, detectar inconsistencias o preparar un primer borrador. El criterio final sigue siendo humano.',
      'No conviene cargar información privada, credenciales, documentos sensibles o datos de terceros sin comprender cómo los trata el servicio utilizado.'
    ], sources:[]
  },
  web: {
    headings: ['Qué debe resolver la página','Estructura mínima que se puede mantener','Velocidad y accesibilidad','Control de versiones y respaldo'],
    paragraphs: [
      'Una página útil responde rápido qué ofrece, para quién y cuál es el siguiente paso. La navegación debe ser comprensible incluso para alguien que llega por primera vez.',
      'HTML semántico, títulos ordenados, enlaces descriptivos, imágenes optimizadas y textos legibles suelen aportar más que efectos pesados.',
      'Conviene probar la página en móvil, revisar enlaces rotos y evitar imágenes innecesariamente grandes. El rendimiento también depende de cuántos recursos externos se cargan.',
      'Git permite conservar un historial de cambios. Hacer commits pequeños y descriptivos facilita volver atrás y entender qué se modificó.'
    ], sources:['git']
  },
  'digital-income': {
    headings: ['Convertir una habilidad en oferta','Validar antes de ampliar','Definir precio y alcance','Evitar promesas irreales'],
    paragraphs: [
      'Una oferta clara describe el problema, el resultado, el formato de entrega, el plazo y lo que no está incluido. Esa precisión evita trabajos interminables y expectativas contradictorias.',
      'Antes de construir un producto grande, conviene conversar con posibles usuarios o vender una versión pequeña. La respuesta real vale más que una lista de suposiciones.',
      'El precio debe considerar tiempo, herramientas, revisiones, impuestos, cobros y soporte. Copiar el precio de otra persona sin comparar alcance suele generar pérdidas.',
      'Ningún canal garantiza ingresos. Conviene registrar consultas, conversiones, costos y horas para decidir con datos propios.'
    ], sources:['money']
  },
  workflow: {
    headings: ['Una estructura de carpetas que se entienda','Cómo definir el próximo paso','Sesiones de trabajo cerradas','Revisión semanal'],
    paragraphs: [
      'Una estructura sencilla puede separar entrada, trabajo en curso, terminado y respaldo. Los nombres de archivo deben incluir información suficiente para reconocer la versión sin abrirla.',
      'Cada proyecto necesita una próxima acción física y concreta. “Mejorar la web” es demasiado amplio; “corregir el menú móvil” permite empezar.',
      'Al cerrar una sesión, conviene guardar, respaldar y anotar qué sigue. Ese minuto reduce la resistencia para retomar al día siguiente.',
      'Una revisión semanal permite archivar, eliminar duplicados, detectar tareas bloqueadas y elegir la prioridad de la semana siguiente.'
    ], sources:[]
  },
  tool: {
    headings: ['Definir el resultado antes de elegir herramienta','Probar con una tarea real','Medir costo de mantenimiento','Cuándo reemplazarla'],
    paragraphs: [
      'La pregunta útil no es cuál herramienta tiene más funciones, sino cuál permite terminar la tarea con menos fricción y riesgo.',
      'Una prueba debe usar un archivo o flujo real. Las demostraciones ideales no muestran cuánto tiempo llevará aprender, corregir y mantener.',
      'El costo incluye suscripción, tiempo, exportación, dependencia del proveedor y posibilidad de recuperar los datos.',
      'Conviene reemplazar una herramienta cuando bloquea resultados, genera riesgos o exige más mantenimiento que el valor que aporta.'
    ], sources:[]
  }
};

const GENERIC_BY_CATEGORY = {
  'Pan y Circo': {
    headings:['Qué dispara el consumo automático','Cómo medir el efecto real','Cambios de entorno que ayudan','Una semana de prueba'],
    paragraphs:[
      'El disparador puede ser aburrimiento, ansiedad, cansancio, una notificación o simplemente tener el teléfono al alcance. Identificarlo permite intervenir antes del gesto automático.',
      'Durante pocos días conviene registrar duración, horario y sensación posterior. El objetivo no es castigarse, sino distinguir descanso de consumo que deja más cansancio.',
      'Desactivar avisos, mover aplicaciones, dejar el teléfono fuera del dormitorio o usar horarios definidos reduce decisiones repetidas.',
      'Una prueba útil cambia una sola variable durante siete días y compara sueño, concentración, estado de ánimo y tiempo disponible.'
    ], sources:[]
  },
  'Alimentación': {
    headings:['Qué observar antes de cambiar todo','Cómo armar una base simple','Compras y preparación','Cuándo pedir ayuda'],
    paragraphs:[
      'Conviene observar horarios, hambre, energía, sueño, síntomas y contexto. Una semana de registro breve ayuda a detectar patrones sin convertir cada comida en un examen.',
      'Una base variada puede incluir agua segura, frutas y verduras, legumbres, cereales, fuentes de proteína y preparaciones caseras según posibilidades y costumbres.',
      'Comprar con lista, preparar componentes básicos y dejar opciones disponibles reduce decisiones impulsivas cuando aparece hambre o cansancio.',
      'Síntomas persistentes, pérdida o aumento de peso no buscado, atracones, restricciones intensas o enfermedades requieren orientación profesional.'
    ], sources:['diet']
  },
  'Deportes': {
    headings:['Punto de partida realista','Progresión y técnica','Recuperación','Señales para detenerse'],
    paragraphs:[
      'El punto de partida debe adaptarse al nivel actual. Cualquier cantidad de movimiento puede ser útil y la constancia suele importar más que una primera sesión intensa.',
      'Conviene aumentar una variable por vez: duración, frecuencia, repeticiones o carga. La técnica controlada reduce compensaciones innecesarias.',
      'Dormir, alternar cargas y dejar tiempo de recuperación forma parte del entrenamiento. El progreso no ocurre solo durante el esfuerzo.',
      'Dolor agudo, mareos, desmayos, falta de aire inusual o síntomas que empeoran justifican detenerse y consultar.'
    ], sources:['activity']
  },
  'Matrix': {
    headings:['Dónde aparece el automatismo','Qué costo tiene','Modificar el entorno','Recuperar una decisión'],
    paragraphs:[
      'El automatismo suele aparecer en horarios, lugares y emociones repetidas. Registrar el momento exacto muestra que no ocurre al azar.',
      'El costo puede medirse en tiempo, dinero, sueño, atención o tareas desplazadas. Convertirlo en una cifra propia vuelve visible lo que parecía normal.',
      'Cambiar ubicación, avisos, accesos y secuencia de acciones ayuda más que depender únicamente de fuerza de voluntad.',
      'La meta inicial es recuperar una decisión: esperar antes de comprar, revisar el teléfono a una hora definida o elegir una prioridad antes de abrir aplicaciones.'
    ], sources:[]
  },
  'Saliendo de la Matrix': {
    headings:['Definir una evidencia de avance','Convertir el objetivo en entregas','Revisar sin castigarse','Proteger la continuidad'],
    paragraphs:[
      'Una evidencia puede ser una página publicada, una propuesta enviada, una cantidad de horas trabajadas, una deuda registrada o una semana de rutina cumplida.',
      'El objetivo debe dividirse en entregas pequeñas con fecha. Cada entrega reduce incertidumbre y permite corregir antes de invertir demasiado.',
      'La revisión sirve para decidir qué mantener, eliminar o ajustar. No es un juicio sobre el valor personal.',
      'Una versión mínima para días difíciles protege la continuidad: veinte minutos, una llamada, una corrección o una tarea administrativa.'
    ], sources:[]
  }
};

function blockFor(post, intent) {
  if (INTENT_BLOCKS[intent]) return INTENT_BLOCKS[intent];
  return GENERIC_BY_CATEGORY[post.category] || GENERIC_BY_CATEGORY['Saliendo de la Matrix'];
}

const LAYOUTS = [
  ['Respuesta directa','Cómo reconocer el problema','Qué hacer paso a paso','Errores que conviene evitar','Plan de siete días'],
  ['Qué está pasando','Qué datos conviene observar','Una estrategia realista','Cómo medir progreso','Cuándo ajustar el plan'],
  ['Punto de partida','Decisiones que más impacto tienen','Aplicación práctica','Señales de mejora','Siguiente nivel'],
  ['Diagnóstico cotidiano','Cambios de bajo costo','Rutina mínima','Obstáculos frecuentes','Revisión semanal'],
  ['La idea central','Cómo llevarla a la práctica','Qué no funciona','Una prueba concreta','Preguntas frecuentes']
];

function practicalPlan(post, seed) {
  const topic = esc(post.title.toLowerCase());
  const variants = [
    [`Día 1: registrá cómo aparece ${topic}.`,`Día 2: eliminá una fricción o distracción.`,`Día 3: prepará una alternativa concreta.`,`Días 4 y 5: repetí la acción mínima.`,`Día 6: compará energía, tiempo o resultado.`,`Día 7: decidí qué mantener.`],
    [`Definí un resultado pequeño y verificable.`,`Elegí un bloque de tiempo realista.`,`Prepará materiales antes de empezar.`,`Terminá una versión simple.`,`Pedí una devolución o revisá el resultado.`,`Anotá el próximo paso.`],
    [`Medí la situación actual durante dos días.`,`Elegí una sola variable para cambiar.`,`Sostenela durante cinco días.`,`Registrá obstáculos sin juzgarte.`,`Ajustá el tamaño de la acción.`,`Repetí otra semana si aporta valor.`]
  ];
  return pick(variants, seed).map(x => `<li>${esc(x)}</li>`).join('');
}

function articleBody(post, intent) {
  const seed = hash(post.title);
  const block = blockFor(post, intent);
  const layout = pick(LAYOUTS, seed);
  const opening = DIRECT_OPENINGS[intent] || `${post.title} se entiende mejor cuando se observa como un problema concreto, con causas, costos y decisiones posibles.`;
  const ordered = block.paragraphs.map((p, i) => ({ heading: block.headings[i] || layout[i] || `Paso ${i+1}`, paragraph:p }));
  const shuffled = seed % 2 ? [...ordered].reverse() : ordered;
  const sections = shuffled.map((s, i) => `<h2>${esc(s.heading)}</h2><p>${esc(s.paragraph)}</p><p>${esc(topicSpecific(post, intent, i, seed))}</p>`).join('');
  return `<p>${esc(opening)}</p><p>${esc(contextParagraph(post, intent, seed))}</p><p class="pullquote">${esc(pick(quotesFor(post.category), seed))}</p>${sections}<h2>${esc(layout[3])}</h2><ul>${practicalPlan(post, seed)}</ul><h2>${esc(layout[4])}</h2><p>${esc(conclusion(post, intent, seed))}</p>${sourcesHtml(block.sources)}`;
}

function contextParagraph(post, intent, seed) {
  const topic = post.title.toLowerCase();
  const options = [
    `Antes de cambiar ${topic}, conviene registrar durante unos días cuándo ocurre, qué lo dispara y qué consecuencia deja. Esa observación evita aplicar soluciones genéricas a un problema mal definido.`,
    `La mejor estrategia para ${topic} depende del punto de partida, los recursos disponibles y el costo de sostenerla. Una opción simple que se repite suele superar a un plan ideal que dura poco.`,
    `No hace falta resolver ${topic} en una sola semana. El objetivo inicial es producir información propia: qué funciona, qué falla y qué ajuste reduce más fricción.`
  ];
  return pick(options, seed);
}
function topicSpecific(post, intent, index, seed) {
  const topic = post.title.toLowerCase();
  const options = [
    `Aplicado a ${topic}, esto significa elegir un cambio que pueda observarse: tiempo ahorrado, tarea terminada, síntoma registrado, gasto evitado o sesión sostenida.`,
    `Para ${topic}, conviene anotar el punto de partida y revisar el resultado después de varios intentos, no después de un solo día bueno o malo.`,
    `El cambio alrededor de ${topic} debe caber en la vida actual. Si requiere condiciones perfectas, probablemente necesita dividirse en una versión más pequeña.`,
    `Una señal útil en ${topic} es que la acción dependa cada vez menos de recordar o improvisar y más de un entorno preparado.`
  ];
  return pick(options, seed, index);
}
function conclusion(post, intent, seed) {
  const options = [
    `${post.title} mejora cuando deja de ser una intención abstracta y se convierte en una prueba concreta. Elegí una acción, definí qué observar y revisá el resultado sin exagerar un solo día.`,
    `El próximo paso con ${post.title.toLowerCase()} no necesita ser espectacular. Debe ser lo bastante claro como para empezar y lo bastante pequeño como para repetirse.`,
    `No busques resolver ${post.title.toLowerCase()} con una promesa. Diseñá una semana que produzca evidencia y usá esa evidencia para decidir el paso siguiente.`
  ];
  return pick(options, seed);
}
function quotesFor(category) {
  const map = {
    'Tecnología':['Una herramienta vale por el resultado que permite terminar, no por la cantidad de funciones que promete.','El orden digital ahorra tiempo dos veces: cuando trabajás y cuando necesitás recuperar lo trabajado.'],
    'Pan y Circo':['Descansar es elegir una pausa; anestesiarse es perder el registro del tiempo y del efecto.','La atención que no elegís suele terminar trabajando para el objetivo de otra persona.'],
    'Alimentación':['Una alimentación sostenible se construye con decisiones repetibles, no con castigos.','Observar el cuerpo aporta más información que perseguir una regla aislada.'],
    'Deportes':['El cuerpo se adapta a lo que repetís, no a lo que prometés una vez.','La progresión sirve cuando permite volver a entrenar, no cuando te deja fuera varios días.'],
    'Matrix':['Un hábito automático empieza a cambiar cuando vuelve a sentirse como una decisión.','Lo normal también merece ser revisado cuando consume tiempo, dinero o energía.'],
    'Saliendo de la Matrix':['La reconstrucción necesita pruebas pequeñas de capacidad, no discursos gigantes.','Un proyecto empieza a existir cuando deja una entrega visible.']
  };
  return map[category] || map['Saliendo de la Matrix'];
}

function related(post) {
  const same = posts.filter(p => p.url !== post.url && p.category === post.category);
  const cross = posts.filter(p => p.url !== post.url && p.category !== post.category);
  const seed = hash(post.title);
  return [...same.slice(seed % Math.max(1,same.length), (seed % Math.max(1,same.length))+4), ...cross.slice(seed % Math.max(1,cross.length), (seed % Math.max(1,cross.length))+2)].slice(0,6);
}

function render(post) {
  const intent = classify(post);
  const rel = related(post);
  const slug = categorySlug(post);
  const canonical = `${SITE}${post.url}`;
  const description = `Guía práctica sobre ${post.title.toLowerCase()}: causas, pasos concretos, errores frecuentes y una forma realista de medir avances.`.slice(0, 165);
  const ld = JSON.stringify({ '@context':'https://schema.org','@type':'BlogPosting', headline:post.title, description, datePublished:post.date, dateModified:'2026-06-10', author:{'@type':'Person',name:'ASPF'}, publisher:{'@type':'Organization',name:'buenosdia.com'}, image:`${SITE}${post.image}`, mainEntityOfPage:canonical });
  const crumbs = JSON.stringify({ '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:`${SITE}/`},{'@type':'ListItem',position:2,name:post.category,item:`${SITE}/${slug}/`},{'@type':'ListItem',position:3,name:post.title,item:canonical}] });
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(post.title)} | buenosdia.com</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(post.title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${SITE}${post.image}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/post.css"><script type="application/ld+json">${ld}</script><script type="application/ld+json">${crumbs}</script></head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><img src="/assets/img/logo-buenosdia-icon-192.webp" width="56" height="56" alt="Logo de buenosdia.com"><span><strong>buenosdia.com</strong><small>Tecnología, Matrix y vida real</small></span></a><nav class="site-nav"><a href="/#publicaciones">Publicaciones</a><a href="/#categorias">Categorías</a><a href="/${slug}/">${esc(post.category)}</a></nav></div></header><main><section class="post-hero"><div class="post-shell"><span class="post-kicker">${esc(post.category)}</span><h1 class="post-title">${esc(post.title)}</h1><p class="post-description">${esc(description)}</p><div class="post-meta-line">Por ASPF · Actualizado 10/06/2026 · 10–14 min</div></div><figure class="post-cover"><img src="${post.image}" alt="${esc(post.title)}" width="1200" height="675"></figure></section><article class="post-shell post-card-article"><div class="share-box"><a href="https://wa.me/?text=${encodeURIComponent(post.title+' '+canonical)}">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${canonical}">Facebook</a><a href="https://twitter.com/intent/tweet?url=${canonical}">X</a><button onclick="navigator.clipboard.writeText(location.href)">Copiar enlace</button></div>${articleBody(post,intent)}<section class="related-box"><h2>Lecturas relacionadas</h2><ul>${rel.map(r=>`<li><a href="${r.url}">${esc(r.title)}</a></li>`).join('')}</ul></section><section class="faq-box"><h2>Preguntas frecuentes</h2><div class="faq-item"><strong>¿Cuál es el primer paso?</strong><p>Registrar la situación actual y elegir una acción pequeña que pueda comprobarse.</p></div><div class="faq-item"><strong>¿Cuánto tiempo hace falta?</strong><p>Depende del tema, pero una semana suele alcanzar para obtener información propia y decidir el ajuste siguiente.</p></div><div class="faq-item"><strong>¿Cuándo conviene pedir ayuda?</strong><p>Cuando existen síntomas, lesiones, deudas complejas, riesgo de seguridad o una situación que supera la información general.</p></div></section><div class="post-tags">${(post.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div></article></main><footer class="site-footer"><div class="container footer-grid"><nav><a href="/privacidad/">Privacidad</a><a href="/cookies/">Cookies</a><a href="/terminos/">Términos</a></nav></div></footer></body></html>`;
}

for (const post of posts) {
  const path = post.url.replace(/^\//, '');
  fs.mkdirSync(path.substring(0,path.lastIndexOf('/')), { recursive:true });
  fs.writeFileSync(path, render(post));
}

console.log(`Recreadas ${posts.length} publicaciones con esquemas por intención.`);

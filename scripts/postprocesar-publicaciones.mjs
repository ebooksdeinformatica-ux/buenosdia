import fs from 'node:fs';
import path from 'node:path';

const ROOT = '.';
const SKIP = new Set(['.git', 'node_modules']);

const STATCOUNTER = `<!-- Default Statcounter code for BUENOSDIA
http://https:buenosdia.com -->
<script type="text/javascript">
var sc_project=12058975;
var sc_invisible=1;
var sc_security="49f17e11";
</script>
<script type="text/javascript" src="https://www.statcounter.com/counter/counter.js" async></script>
<noscript><div class="statcounter"><a title="free hit counter" href="https://statcounter.com/" target="_blank"><img class="statcounter" src="https://c.statcounter.com/12058975/0/49f17e11/1/" alt="free hit counter" referrerPolicy="no-referrer-when-downgrade"></a></div></noscript>
<!-- End of Statcounter Code -->`;

const bannedReplacements = [
  ['Buenosdia.com trabaja estos temas con una idea clara: no escribir para llenar internet, sino para construir una red de textos útiles, humanos y conectados. Cada publicación tiene que dejar una pregunta, una acción o una incomodidad productiva. Si no mueve nada, no sirve.', 'El problema no suele ser no saber qué hacer. El problema suele ser que todo parece demasiado grande, demasiado tarde o demasiado difícil. La salida empieza cuando reducís el problema a una decisión concreta que puedas tomar hoy.'],
  ['Este sitio no separa el contenido de la vida. Una publicación puede hablar de tecnología y terminar tocando disciplina. Puede hablar de alimentación y terminar tocando foco. Puede hablar de Matrix y terminar en una acción digital. Esa mezcla es parte de la identidad editorial: internet, cuerpo, cabeza y proyecto viviendo en la misma mesa.', 'La vida real no viene separada por temas. La tecnología se mezcla con el cuerpo, la comida con el foco, el descanso con las ganas y una decisión pequeña puede cambiar el tono de todo el día.'],
  ['Una idea sirve cuando te deja algo para hacer, no solo algo para asentir con la cabeza. El paso importante es bajarla al día y convertirla en una acción concreta.', 'La diferencia aparece cuando la idea baja al día: una decisión, una prueba y un resultado que puedas observar por vos mismo.'],
  ['En términos de SEO moderno, un texto fuerte no es solo largo. Tiene intención, contexto, enlaces internos, lenguaje natural, estructura clara y una respuesta que una persona real puede usar. Por eso cada publicación conecta con otras: para que el lector arme camino, no para encerrarlo en una página suelta.', 'La diferencia aparece cuando la idea baja al día: una decisión, una prueba y un resultado que puedas observar por vos mismo.'],
  ['<h2>Cómo se conecta con SEO, proyectos y vida diaria</h2>', '<h2>Cómo llevarlo al día de hoy</h2>'],
  ['Eso es SEO para la vida real: intención clara, estructura clara y acción clara.', 'Eso es avance real: una intención clara, un paso concreto y una acción que puedas terminar.'],
  ['¿Por qué se conecta con otros posts?', '¿Cómo sigo después de leer esto?'],
  ['Porque la vida real no viene separada por temas. Tecnología, cuerpo, comida, foco y Matrix se mezclan todos los días.', 'Elegí una acción pequeña, terminala y después sumá una segunda que refuerce la primera.'],
  ['Buscá una publicación relacionada dentro del sitio y seguí el hilo.', 'Elegí una segunda acción que refuerce la primera.']
];

const enrichments = {
  'Tecnología': [
    `<h2>Qué conviene revisar antes de empezar</h2><p>Antes de instalar otra herramienta o abrir diez pestañas, revisá tres cosas: qué tarea querés terminar, qué recursos ya tenés y cuál es el límite real de tu equipo. Muchas computadoras lentas mejoran cuando se reducen programas de inicio, se liberan archivos innecesarios y se trabaja con una sola tarea por vez.</p><p>También conviene separar el trabajo en carpetas claras: ideas, borradores, imágenes, publicados y respaldos. Ese orden evita perder tiempo buscando archivos y permite retomar un proyecto sin empezar de cero cada día.</p><ul><li>Guardá una copia de los archivos importantes en otra unidad o servicio confiable.</li><li>Actualizá navegador y sistema cuando sea posible.</li><li>No instales programas de fuentes dudosas.</li><li>Elegí herramientas livianas antes que soluciones enormes.</li></ul>`,
    `<h2>Cómo convertir la herramienta en resultado</h2><p>La tecnología aporta valor cuando termina en algo visible: una página publicada, un archivo ordenado, un servicio preparado, una plantilla terminada o una tarea automatizada. Para llegar ahí, trabajá en ciclos cortos: definir, hacer, revisar y guardar.</p><p>Una buena prueba dura entre veinte y sesenta minutos. Si después de ese tiempo no existe ningún resultado concreto, la tarea probablemente era demasiado amplia. Dividila hasta que puedas cerrar una parte.</p><ul><li>Definí un resultado verificable.</li><li>Usá una herramienta principal.</li><li>Guardá versiones para poder volver atrás.</li><li>Anotá el siguiente paso antes de cerrar.</li></ul>`
  ],
  'Pan y Circo': [
    `<h2>Cómo saber si una pantalla te descansa o te vacía</h2><p>La señal aparece después del consumo. Si terminás más tranquilo, con una idea o con energía recuperada, probablemente fue descanso. Si terminás ansioso, comparándote, saltando entre aplicaciones o con culpa por el tiempo perdido, fue otra cosa.</p><p>Probá registrar durante tres días qué mirás, cuánto tiempo y cómo quedás después. No hace falta eliminar todo: alcanza con detectar qué formato, horario o aplicación te deja peor.</p><ul><li>Desactivá notificaciones que no sean necesarias.</li><li>No empieces la mañana con contenido elegido por un algoritmo.</li><li>Definí una hora de cierre de pantalla.</li><li>Elegí de antemano qué vas a mirar.</li></ul>`,
    `<h2>Una forma práctica de recuperar atención</h2><p>La atención mejora cuando reducís interrupciones. Dejá el teléfono fuera del alcance durante una tarea, cerrá aplicaciones que no necesitás y agrupá los momentos de entretenimiento en vez de mezclarlos con todo el día.</p><p>No se trata de vivir sin series, música o redes. Se trata de que el entretenimiento ocupe un lugar elegido y no se convierta en el fondo permanente de la vida.</p><ul><li>Usá temporizadores para cortar el scroll.</li><li>Reservá períodos sin pantalla.</li><li>Reemplazá una hora de consumo por una actividad concreta.</li><li>Revisá semanalmente qué aplicaciones realmente te aportan algo.</li></ul>`
  ],
  'Alimentación': [
    `<h2>Cómo ordenar la alimentación sin volverla una obsesión</h2><p>Una base simple suele funcionar mejor que un plan extremo: agua disponible, horarios razonables, comidas con alguna fuente de proteína, vegetales o frutas cuando sea posible y menos productos que se comen sin registrar cantidad.</p><p>Preparar algo antes de tener hambre reduce decisiones impulsivas. Puede ser una comida cocida, huevos, fruta lavada, arroz, verduras o porciones guardadas. No hace falta cocinar perfecto; hace falta evitar que cada comida dependa del cansancio del momento.</p><ul><li>Comprá con una lista.</li><li>Tomá agua de forma regular.</li><li>Comé sentado y sin apuro cuando puedas.</li><li>Consultá a un profesional ante síntomas persistentes o necesidades médicas.</li></ul>`,
    `<h2>Señales para observar durante una semana</h2><p>Prestá atención a la energía después de comer, el hambre nocturna, el sueño, la irritabilidad y la necesidad constante de azúcar o cafeína. Esas señales no dan un diagnóstico, pero ayudan a descubrir patrones.</p><p>Cambiá una sola variable por vez. Por ejemplo, mejorar el desayuno, reducir una bebida azucarada o preparar la cena con anticipación. Así podés notar qué cambio realmente te ayuda.</p><ul><li>Anotá horarios y sensaciones durante pocos días.</li><li>No uses la culpa como método.</li><li>Evitá compensaciones extremas.</li><li>Buscá ayuda profesional si la relación con la comida genera sufrimiento.</li></ul>`
  ],
  'Deportes': [
    `<h2>Cómo empezar sin lastimarte ni abandonar</h2><p>El error más común es hacer demasiado el primer día. El cuerpo necesita adaptación. Empezá con una carga que puedas repetir: caminar, movilidad, ejercicios básicos o una sesión corta. La intensidad puede subir después.</p><p>Dolor agudo, mareos, falta de aire fuera de lo esperable o molestias que empeoran no deben ignorarse. Si tenés una condición médica, una lesión o mucho tiempo de inactividad, conviene consultar antes de exigir el cuerpo.</p><ul><li>Calentá de forma progresiva.</li><li>Aumentá tiempo o carga de a poco.</li><li>Dejá días de recuperación.</li><li>Priorizá técnica antes que cantidad.</li></ul>`,
    `<h2>Cómo sostener una rutina cuando faltan ganas</h2><p>La constancia mejora cuando el plan es simple. Elegí días, horario aproximado y una versión mínima de la sesión. Si el día viene mal, hacé la versión corta en lugar de abandonar por completo.</p><p>Registrar entrenamientos ayuda a ver progreso que el espejo no muestra: más repeticiones, mejor respiración, menos cansancio o mayor regularidad.</p><ul><li>Prepará ropa y elementos con anticipación.</li><li>Definí una sesión mínima de diez o veinte minutos.</li><li>Medí continuidad, no solo rendimiento.</li><li>Dormí y recuperate lo mejor posible.</li></ul>`
  ],
  'Matrix': [
    `<h2>Cómo detectar el piloto automático</h2><p>Durante un día, anotá las acciones que repetís sin haberlas elegido de forma consciente: mirar el teléfono al despertar, comprar por impulso, aceptar interrupciones, responder mensajes de inmediato o llenar cada silencio con ruido.</p><p>Después elegí un solo automatismo y cambialo durante una semana. No hace falta desmontar toda la rutina: alcanza con recuperar una decisión que antes ocurría sola.</p><ul><li>Retrasá el teléfono durante los primeros minutos del día.</li><li>Silenciá avisos innecesarios.</li><li>Preguntate quién decidió cada prioridad.</li><li>Reservá un momento sin consumo ni estímulos.</li></ul>`,
    `<h2>Una auditoría sencilla de tiempo y atención</h2><p>Revisá en qué se fueron las últimas veinticuatro horas. Separá obligaciones, descanso, consumo automático y actividades elegidas. El objetivo no es juzgarte, sino encontrar fugas.</p><p>Una fuga pequeña repetida todos los días puede ocupar semanas completas al año. Recuperar media hora diaria alcanza para leer, entrenar, aprender o avanzar en algo propio.</p><ul><li>Medí tiempo de pantalla.</li><li>Agrupá mensajes y trámites.</li><li>Definí una prioridad diaria.</li><li>Dejá espacio para pensar sin estímulos.</li></ul>`
  ],
  'Saliendo de la Matrix': [
    `<h2>Cómo convertir una intención en un plan visible</h2><p>Escribí qué querés cambiar durante los próximos treinta días y reducí el objetivo a acciones semanales. Un proyecto mejora cuando tiene entregables claros: una página publicada, una propuesta enviada, una habilidad practicada o una cantidad concreta de horas de trabajo.</p><p>No dependas de recordar todo. Usá una lista simple con tres columnas: pendiente, en curso y terminado. Ver lo terminado ayuda a recuperar confianza y evita la sensación de estar siempre empezando.</p><ul><li>Elegí un proyecto principal.</li><li>Definí una tarea diaria pequeña.</li><li>Revisá resultados una vez por semana.</li><li>Eliminá compromisos que no aportan al objetivo.</li></ul>`,
    `<h2>Cómo reconstruir sin esperar motivación</h2><p>La motivación cambia, pero una estructura mínima puede sostenerte: horario de inicio, espacio despejado, tarea definida y cierre con el siguiente paso anotado. Esa repetición reduce la energía necesaria para volver a empezar.</p><p>Si el objetivo incluye ingresos, separá aprendizaje de oferta. Aprender es importante, pero también necesitás preparar algo que otra persona pueda comprar: un servicio, una plantilla, una página, una solución o una propuesta concreta.</p><ul><li>Hacé inventario de habilidades útiles.</li><li>Convertí una habilidad en una oferta simple.</li><li>Probala con pocas personas antes de ampliarla.</li><li>Guardá registro de avances y respuestas.</li></ul>`
  ]
};

function hashText(value) {
  let h = 0;
  for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function getCategory(html) {
  return html.match(/<span class="post-kicker">([^<]+)<\/span>/)?.[1]?.trim() || '';
}

function getTitle(html) {
  return html.match(/<h1 class="post-title">([^<]+)<\/h1>/)?.[1]?.trim() || '';
}

function cleanPublicText(input) {
  let text = input;
  for (const [from, to] of bannedReplacements) text = text.split(from).join(to);
  text = text.replace(/Una publicación de buenosdia\.com sobre ([^"<]+?), conectada con [^"<]+?, con mirada práctica, humana y sin relleno\./g, 'Una guía práctica sobre $1, con ideas concretas para entender el problema y empezar a actuar hoy.');
  text = text.replace(/<p>Hay frases que suenan simples hasta que las llevás al día real\. ([\s\S]*?) es una de esas\. No alcanza con entenderla mentalmente: hay que verla en la mañana, en las decisiones chicas, en el cansancio, en el teléfono, en la comida, en la computadora y en la forma en que uno evita o enfrenta lo que tiene pendiente\.<\/p>/g, '<p>$1 puede parecer una idea simple, pero cambia cuando la llevás al día real. El punto no es entenderla de lejos, sino reconocer dónde aparece en tu rutina y qué decisión concreta podés tomar hoy.</p>');
  text = text.replace(/<p>([^<]+?) no aparece aislado\. Se mezcla con la manera en que usamos el tiempo, cuidamos el cuerpo, administramos la atención y tomamos decisiones cuando nadie nos mira\. Por eso esta publicación no está escrita como una receta mágica, sino como un mapa para mirar mejor y actuar mejor\.<\/p>/g, '<p>$1 se mezcla con la manera en que usamos el tiempo, cuidamos el cuerpo y administramos la atención. No hace falta una receta mágica: alcanza con reconocer dónde aparece en tu rutina y qué podés cambiar de manera concreta.</p>');
  text = text.replace(/<p>Este sitio[^<]*<\/p>/gi, '');
  text = text.replace(/<p>Esta publicación[^<]*<\/p>/gi, '');
  text = text.replace(/<p>Buenosdia\.com[^<]*<\/p>/gi, '');
  return text;
}

function removeOldCounters(input) {
  return input
    .replace(/<!-- Default Statcounter code[\s\S]*?<!-- End of Statcounter Code -->/gi, '')
    .replace(/<script[^>]*>\s*var\s+sc_project\s*=\s*\d+;[\s\S]*?sc_security\s*=\s*["'][^"']+["'];?\s*<\/script>/gi, '')
    .replace(/<script[^>]*src=["']https:\/\/www\.statcounter\.com\/counter\/counter\.js["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<noscript>[\s\S]*?c\.statcounter\.com[\s\S]*?<\/noscript>/gi, '');
}

function enrichPost(html) {
  if (!html.includes('class="post-card-article"')) return html;
  if (html.includes('data-value-block="true"')) return html;
  const category = getCategory(html);
  const title = getTitle(html);
  const options = enrichments[category];
  if (!options?.length) return html;
  const block = `<section data-value-block="true">${options[hashText(title) % options.length]}</section>`;
  if (html.includes('<h2 id="acciones">')) return html.replace('<h2 id="acciones">', `${block}<h2 id="acciones">`);
  if (html.includes('<h2>Acciones para hoy</h2>')) return html.replace('<h2>Acciones para hoy</h2>', `${block}<h2>Acciones para hoy</h2>`);
  return html.replace('</article>', `${block}</article>`);
}

function processHtml(file) {
  let html = fs.readFileSync(file, 'utf8');
  html = enrichPost(cleanPublicText(removeOldCounters(html))).trim();
  html = html.includes('</body>') ? html.replace('</body>', `${STATCOUNTER}\n</body>`) : `${html}\n${STATCOUNTER}\n`;
  fs.writeFileSync(file, html);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) processHtml(full);
  }
}

walk(ROOT);

if (fs.existsSync('data/posts.json')) {
  const posts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));
  for (const post of posts) post.description = cleanPublicText(post.description || '');
  fs.writeFileSync('data/posts.json', `${JSON.stringify(posts, null, 2)}\n`);
}

console.log('Textos internos eliminados, contenido práctico ampliado y Statcounter instalado.');

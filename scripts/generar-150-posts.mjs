import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.buenosdia.com';
const IMG = '/assets/img/posts/empezar-de-cero-cuando-sentis-que-perdiste-demasiado.svg';
const today = '2026-06-09';

const categories = [
  { name: 'Tecnología', slug: 'tecnologia', tone: 'tecnología real, internet, IA, herramientas digitales y proyectos online' },
  { name: 'Pan y Circo', slug: 'pan-y-circo', tone: 'pantallas, entretenimiento, consumo digital y atención robada' },
  { name: 'Alimentación', slug: 'alimentacion', tone: 'comida, energía mental, hábitos, cuerpo y claridad diaria' },
  { name: 'Deportes', slug: 'deportes', tone: 'entrenamiento, disciplina, cuerpo, movimiento y mentalidad' },
  { name: 'Matrix', slug: 'matrix', tone: 'rutina, algoritmos, consumo, piloto automático y vida cotidiana' },
  { name: 'Saliendo de la Matrix', slug: 'saliendo-de-la-matrix', tone: 'reconstrucción, proyectos, foco, libertad práctica y salida del piloto automático' }
];

const seeds = {
  'Tecnología': [
    'usar una computadora vieja para crear valor digital','inteligencia artificial como herramienta de trabajo diario','organizar archivos para no perder proyectos','crear un blog aunque no tengas equipo perfecto','aprender programación cuando venís de cero','automatizar tareas simples sin complicarte','vender plantillas digitales a gente común','usar internet para recuperar ingresos perdidos','crear contenido sin depender de redes sociales','convertir ideas sueltas en publicaciones útiles','usar IA para ordenar un proyecto online','herramientas livianas para una notebook vieja','crear una rutina digital de una hora por día','hacer SEO sin volverse esclavo de los trucos','publicar mejor con pocos recursos','armar una base de conocimiento personal','usar la tecnología para salir del estancamiento','crear servicios digitales simples para vender','ordenar contraseñas y cuentas sin caos','hacer una web estática que cargue rápido','escribir mejores prompts con intención real','usar GitHub como taller de proyectos','crear imágenes web limpias y livianas','transformar experiencia vieja en contenido nuevo','volver a vivir de internet sin nostalgia'
  ],
  'Pan y Circo': [
    'cuando el entretenimiento se vuelve anestesia','series que descansan y series que te vacían','el scroll infinito y la mañana perdida','televisión como ruido de fondo mental','mirar menos para pensar mejor','la pantalla como premio barato','consumo digital y cansancio invisible','noticias que informan y noticias que intoxican','famosos, escándalos y atención robada','la cultura del clip corto','cuando todos opinan pero nadie piensa','el algoritmo que aprende tus debilidades','cómo recuperar silencio después de tanto ruido','entretenimiento sin culpa pero con límite','el celular como circo de bolsillo','redes sociales y comparación diaria','ver contenido para escapar de uno mismo','cuando la pantalla ocupa el lugar del proyecto','la dopamina rápida que te deja quieto','aprender a apagar sin sentir culpa','consumir cultura sin entregar la cabeza','películas, series y criterio propio','la falsa urgencia de estar al día','cómo elegir qué mirar sin ser arrastrado','salir del ruido sin volverse ermitaño'
  ],
  'Alimentación': [
    'comer mal y pensar con niebla','desayunar mejor para empezar distinto','azúcar, ansiedad y energía prestada','ultraprocesados y cansancio cotidiano','agua, cuerpo y claridad mental','comida real sin fanatismo','ordenar la alimentación cuando no hay ganas','la cocina simple como acto de control','comer apurado y vivir acelerado','hábitos pequeños que cambian el día','proteína, energía y decisiones mejores','hambre emocional y pantalla encendida','comprar comida con más conciencia','el cuerpo como base del proyecto','alimentación y disciplina sin obsesión','cuando el cansancio empieza en el plato','comer mejor con poco presupuesto','la ansiedad que se disfraza de antojo','rutina de comida para mente clara','menos paquete y más energía real','alimentarse para sostener trabajo digital','la Matrix del consumo alimentario','volver a escuchar al cuerpo','comida simple para días difíciles','ordenar la heladera para ordenar la cabeza'
  ],
  'Deportes': [
    'entrenar aunque no tengas ganas','caminar como primer acto de disciplina','el cuerpo como ancla mental','volver al gimnasio después de abandonar','disciplina sin motivación barata','hacer poco pero hacerlo siempre','cansancio mental y movimiento físico','entrenamiento para recuperar respeto propio','cuando el cuerpo pide rutina','deporte como salida del ruido','la constancia que nadie aplaude','empezar a moverse sin vergüenza','fuerza, paciencia y días malos','entrenar para pensar mejor','rutina mínima para no romper la cadena','ganarle una hora al sedentarismo','movimiento contra piloto automático','el entrenamiento como promesa cumplida','cuidar el cuerpo sin obsesionarse','deporte y reconstrucción personal','cuando el sofá también programa','caminar para ordenar ideas','fútbol, cuerpo y descarga mental','hacer ejercicio en una etapa difícil','volver a sentir energía real'
  ],
  'Matrix': [
    'la rutina normal que te va apagando','piloto automático y días repetidos','algoritmos que ordenan tu atención','consumo diario y libertad perdida','cuando la comodidad se vuelve jaula','trabajar, consumir y dormir sin pensar','la agenda que no elegiste','el cansancio como estado social','publicidad, deseo y comparación','la normalidad que nadie cuestiona','vivir ocupado pero no avanzar','la Matrix de las pequeñas costumbres','pantallas, compras y ruido mental','cuando todos corren hacia ningún lado','el sistema que premia distracción','la vida administrada por notificaciones','salir de la jaula invisible','rutinas que parecen naturales','la cultura de estar siempre disponible','el miedo a quedarse en silencio','la Matrix también vive en la casa','automatismos que roban decisión','normalizar el agotamiento','cuando obedecer parece elegir','despertar sin volverse paranoico'
  ],
  'Saliendo de la Matrix': [
    'empezar de cero sin fuerza','reconstruir una vida con poco dinero','volver a crear después de abandonar','ordenar proyectos que parecían muertos','hacer una cosa útil por día','salir del pozo con rutina mínima','recuperar foco después del caos','crear ingresos online sin humo','levantarte aunque nadie te empuje','convertir bronca en trabajo','aprender otra vez desde abajo','dejar de esperar el momento perfecto','crear una web como acto de rescate','volver a creer en tu oficio','hacer dinero con habilidades digitales','sostener esperanza sin vender fantasía','romper una etapa con acciones pequeñas','salir del modo víctima sin negarte dolor','reconstruirte sin aplausos','crear un sistema personal de avance','dejar de mirar y empezar a hacer','internet como segunda oportunidad','ordenar la cabeza para ordenar la vida','trabajar en silencio hasta ver movimiento','volver a subir sin caer abruptamente'
  ]
};

function slugify(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function esc(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function titleCase(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function relatedFor(post, all) {
  const same = all.filter(p => p.slug !== post.slug && (p.category === post.category || p.tags.some(t => post.tags.includes(t))));
  const rest = all.filter(p => p.slug !== post.slug && !same.includes(p));
  return [...same, ...rest].slice(0, 5);
}

const basePosts = [];
for (const cat of categories) {
  seeds[cat.name].forEach((topic, i) => {
    const slug = slugify(topic);
    const tags = [cat.slug, ...topic.split(' ').filter(w => w.length > 5).slice(0, 4)].slice(0, 5);
    basePosts.push({
      title: titleCase(topic),
      h1: titleCase(topic) + ': una mirada real para empezar a moverte',
      description: `Un texto de buenosdia.com sobre ${topic}, conectado con ${cat.tone}, sin humo y con enfoque práctico para la vida real.`,
      category: cat.name,
      categorySlug: cat.slug,
      slug,
      url: `/posts/${slug}.html`,
      date: today,
      image: IMG,
      tags,
      readingTime: '9 min',
      topic,
      tone: cat.tone
    });
  });
}

function html(post, all) {
  const rel = relatedFor(post, all);
  const jsonLd = JSON.stringify({
    '@context':'https://schema.org','@type':'BlogPosting',headline:post.title,description:post.description,datePublished:post.date,dateModified:post.date,
    author:{'@type':'Person',name:'ASPF'},publisher:{'@type':'Organization',name:'buenosdia.com'},image:SITE+post.image,mainEntityOfPage:SITE+post.url
  });
  const relHtml = rel.map(r => `<li><a href="${r.url}">${esc(r.title)}</a></li>`).join('');
  const tags = post.tags.map(t => `<span>${esc(t)}</span>`).join('');
  const body = `
<p>Hay temas que parecen chicos hasta que uno los mira de cerca. ${esc(post.topic)} no es una frase decorativa: es una puerta para revisar cómo vivimos, qué repetimos y qué podemos cambiar sin esperar una vida perfecta.</p>
<p>En buenosdia.com la idea no es escribir para llenar espacio. La idea es bajar a tierra lo que pasa todos los días: la pantalla, el cuerpo, la comida, el cansancio, la tecnología, el trabajo, los hábitos y esa sensación de estar dentro de una rutina que muchas veces no elegimos.</p>
<p>Este texto entra en la categoría ${esc(post.category)} porque toca directamente ${esc(post.tone)}. No desde la teoría fría, sino desde una pregunta simple: qué hacemos con esto mañana cuando nos levantamos.</p>
<p class="pullquote">No hace falta cambiar toda la vida de golpe. Hace falta detectar una pieza del sistema y moverla con intención.</p>
<h2>Por qué este tema importa ahora</h2>
<p>Vivimos rodeados de estímulos. Hay demasiada información, demasiadas promesas y demasiadas recetas rápidas. Pero la mayoría de los cambios reales no empiezan por una revelación gigante, sino por una decisión pequeña que se repite.</p>
<p>${esc(titleCase(post.topic))} importa porque conecta con una zona concreta de la vida. Puede ser el modo en que usamos internet, la manera en que comemos, el tiempo que entregamos a una pantalla, la disciplina que evitamos o el proyecto que seguimos postergando.</p>
<h2>La trampa de mirar sin actuar</h2>
<p>Uno puede leer mucho, mirar muchos videos, guardar muchas publicaciones y aun así seguir igual. Eso pasa cuando el contenido se vuelve consumo y no herramienta. Leer tiene sentido si después deja una acción, aunque sea mínima.</p>
<p>La pregunta práctica es esta: después de terminar este texto, qué podés ordenar, apagar, escribir, limpiar, preparar o empezar. Si no aparece ninguna acción, el sistema ganó otra vez un rato de tu atención.</p>
<h2>Una forma simple de aplicarlo</h2>
<p>Elegí una sola mejora. No diez. Una. Si el tema es digital, ordená una carpeta o publicá una página. Si el tema es cuerpo, caminá veinte minutos. Si el tema es alimentación, prepará una comida más limpia. Si el tema es Matrix, detectá qué hábito te roba más energía.</p>
<p>La mejora tiene que ser tan concreta que no puedas esconderte detrás de la confusión. Eso es SEO para la vida real: intención clara, estructura clara y acción clara.</p>
<h2>Cómo se conecta con otros temas del sitio</h2>
<p>Ningún tema vive solo. La tecnología conecta con foco. La alimentación conecta con energía. El deporte conecta con disciplina. Pan y Circo conecta con atención. Matrix conecta con rutina. Saliendo de la Matrix conecta con reconstrucción.</p>
<p>Por eso cada publicación del sitio queda enlazada con otras. No por decoración, sino para formar un mapa. La persona que entra por una idea puede seguir hacia otra y armar su propio camino.</p>
<h2>Qué evitar para no volver al mismo lugar</h2>
<p>Evitar el exceso de planes. Evitar la promesa gigante. Evitar la comparación. Evitar esperar ganas. Evitar creer que porque algo no cambió en una semana ya no sirve. Lo que se sostiene modifica más que lo que impresiona.</p>
<p>También conviene evitar la trampa de la identidad rota: pensar que porque abandonaste antes, vas a abandonar siempre. No. Una etapa anterior explica algo, pero no firma el futuro.</p>
<h2>Cierre real</h2>
<p>${esc(titleCase(post.topic))} es una excusa para hablar de algo más grande: recuperar mando. Un poco de mando sobre el día, sobre la atención, sobre el cuerpo, sobre la herramienta, sobre el proyecto y sobre la dirección.</p>
<p>No hace falta que hoy sea perfecto. Hace falta que hoy no sea idéntico a ayer.</p>`;
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(post.title)} | buenosdia.com</title><meta name="description" content="${esc(post.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${post.url}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(post.title)}"><meta property="og:description" content="${esc(post.description)}"><meta property="og:image" content="${SITE}${post.image}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/post.css"><script type="application/ld+json">${jsonLd}</script></head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><img src="/assets/img/logo-buenosdia-icon-192.webp" width="56" height="56" alt="Logo de buenosdia.com"><span><strong>buenosdia.com</strong><small>Tecnología, Matrix y vida real</small></span></a><nav class="site-nav"><a href="/#publicaciones">Publicaciones</a><a href="/#categorias">Categorías</a><a href="/${post.categorySlug}/">${esc(post.category)}</a></nav></div></header><main><section class="post-hero"><div class="post-shell"><span class="post-kicker">${esc(post.category)}</span><h1 class="post-title">${esc(post.h1)}</h1><p class="post-description">${esc(post.description)}</p><div class="post-meta-line">Por ASPF · ${post.date} · ${post.readingTime}</div></div><figure class="post-cover"><img src="${post.image}" alt="${esc(post.title)}" width="1200" height="675"></figure></section><article class="post-shell post-card-article"><div class="share-box"><a href="https://wa.me/?text=${encodeURIComponent(post.title+' '+SITE+post.url)}">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${SITE}${post.url}">Facebook</a><a href="https://twitter.com/intent/tweet?url=${SITE}${post.url}">X</a><button onclick="navigator.clipboard.writeText(location.href)">Copiar enlace</button></div>${body}<section class="related-box"><h2>Seguí leyendo</h2><ul>${relHtml}</ul></section><section class="faq-box"><h2>Preguntas rápidas</h2><div class="faq-item"><strong>¿Por dónde empiezo con este tema?</strong><p>Por una acción pequeña y medible hoy. La claridad llega más rápido cuando dejás de pensar en abstracto.</p></div><div class="faq-item"><strong>¿Este contenido es motivación?</strong><p>Es motivación con tierra: reflexión, contexto y una salida práctica para no quedarse solo mirando.</p></div></section><div class="post-tags">${tags}</div></article></main><footer class="site-footer"><div class="container footer-grid"><p>buenosdia.com · Tecnología, Matrix y vida real</p></div></footer><script type="text/javascript">var sc_project=13215021;var sc_invisible=1;var sc_security="4ef10514";</script><script type="text/javascript" src="https://www.statcounter.com/counter/counter.js" async></script></body></html>`;
}

fs.mkdirSync('posts', { recursive: true });
fs.mkdirSync('data', { recursive: true });

for (const post of basePosts) {
  fs.writeFileSync(path.join('posts', `${post.slug}.html`), html(post, basePosts));
}

const feed = basePosts.map(({title,description,category,url,date,image,tags,readingTime}) => ({ title, description, category, url, date, image, tags, readingTime }));
fs.writeFileSync('data/posts.json', JSON.stringify(feed, null, 2) + '\n');

const fixed = ['/', '/tecnologia/', '/pan-y-circo/', '/alimentacion/', '/deportes/', '/matrix/', '/saliendo-de-la-matrix/', '/youtube/', '/autor/aspf.html', '/contacto/', '/privacidad/', '/cookies/', '/terminos/', '/aviso-legal/'];
const urls = [...fixed, ...basePosts.map(p => p.url)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync('sitemap.xml', sitemap);
console.log(`Generadas ${basePosts.length} publicaciones SEO, data/posts.json y sitemap.xml`);

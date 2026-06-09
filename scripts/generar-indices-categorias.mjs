import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.buenosdia.com';
const today = '2026-06-09';
const posts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));

const categories = [
  {
    name: 'Tecnología',
    slug: 'tecnologia',
    title: 'Tecnología real, IA e internet práctico',
    description: 'Publicaciones sobre inteligencia artificial, internet, herramientas digitales, proyectos online, computadoras viejas y tecnología usada para crear valor real.',
    intro: 'La tecnología no sirve solo para mirar novedades. Sirve para trabajar, crear, automatizar, ordenar ideas y recuperar movimiento. Esta categoría reúne publicaciones sobre IA, internet, herramientas digitales, proyectos online y uso práctico de la computadora, incluso cuando no tenés el equipo perfecto.',
    promise: 'Acá la tecnología se mira como taller: menos humo, más uso real.'
  },
  {
    name: 'Pan y Circo',
    slug: 'pan-y-circo',
    title: 'Pan y Circo: pantallas, cultura digital y atención robada',
    description: 'Textos sobre entretenimiento, series, televisión, redes, pantallas, consumo digital y el ruido que muchas veces nos mantiene quietos.',
    intro: 'El entretenimiento puede descansar, pero también puede anestesiar. Pan y Circo mira las pantallas, el scroll, las series, los escándalos y la cultura digital con una pregunta central: qué nos suma y qué nos deja más dormidos.',
    promise: 'No se trata de odiar la pantalla. Se trata de recuperar criterio.'
  },
  {
    name: 'Alimentación',
    slug: 'alimentacion',
    title: 'Alimentación, energía mental y hábitos reales',
    description: 'Publicaciones sobre comida real, energía mental, ultraprocesados, ansiedad, cuerpo, claridad diaria y hábitos sostenibles.',
    intro: 'La comida no es solo cuerpo. También es ánimo, foco, paciencia y energía para sostener el día. En esta categoría hablamos de alimentación sin fanatismo, desde lo práctico: comer mejor para pensar mejor, moverse mejor y no vivir con energía prestada.',
    promise: 'Menos culpa, más claridad. Menos paquete, más energía real.'
  },
  {
    name: 'Deportes',
    slug: 'deportes',
    title: 'Deportes, disciplina y cuerpo en movimiento',
    description: 'Textos sobre entrenamiento, disciplina, caminar, gimnasio, cuerpo, movimiento, deportes y mentalidad para seguir cuando no hay ganas.',
    intro: 'El cuerpo también piensa. Caminar, entrenar, moverse o volver al gimnasio puede ordenar una parte de la cabeza que ninguna frase motivacional arregla. Esta categoría mira el deporte como disciplina práctica, no como pose.',
    promise: 'Mover el cuerpo para recuperar mando sobre el día.'
  },
  {
    name: 'Matrix',
    slug: 'matrix',
    title: 'Matrix cotidiana, rutina y piloto automático',
    description: 'Publicaciones sobre rutina, algoritmos, consumo, pantallas, agotamiento, automatismos y vida diaria en piloto automático.',
    intro: 'La Matrix no siempre parece ciencia ficción. A veces parece agenda, notificación, deuda, cansancio, comparación, compra impulsiva o rutina repetida. Esta categoría mira esos mecanismos diarios que parecen normales hasta que empiezan a apagar la vida.',
    promise: 'Detectar el piloto automático es el primer paso para dejar de obedecerlo.'
  },
  {
    name: 'Saliendo de la Matrix',
    slug: 'saliendo-de-la-matrix',
    title: 'Saliendo de la Matrix: reconstrucción, foco y proyectos',
    description: 'Publicaciones sobre reconstrucción personal, proyectos online, foco, hábitos, libertad práctica y acciones pequeñas para volver a subir.',
    intro: 'Salir no es gritar que despertaste. Salir es ordenar una parte del día, levantar un proyecto, cuidar el cuerpo, recuperar foco, aprender de nuevo y hacer algo útil aunque nadie aplauda. Esta categoría es el puente entre mirar la Matrix y construir una salida concreta.',
    promise: 'Una acción pequeña sostenida puede valer más que una revelación gigante.'
  }
];

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function card(p) {
  return `<a class="post-card" href="${esc(p.url)}"><div class="post-card-media"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" decoding="async"></div><div class="post-card-body"><span class="badge">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="post-meta"><span>${esc(p.date)}</span><span>·</span><span>${esc(p.readingTime)}</span></div></div></a>`;
}
function relatedCategories(current) {
  return categories.filter(c => c.slug !== current.slug).slice(0, 5).map(c => `<a href="/${c.slug}/">${esc(c.name)}</a>`).join('');
}
function categoryHtml(cat) {
  const list = posts.filter(p => p.category === cat.name);
  const featured = list.slice(0, 6).map(card).join('');
  const latest = list.slice(6).map(card).join('');
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.title,
    description: cat.description,
    url: `${SITE}/${cat.slug}/`,
    isPartOf: { '@type': 'WebSite', name: 'buenosdia.com', url: SITE },
    about: cat.name
  });
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(cat.title)} | buenosdia.com</title><meta name="description" content="${esc(cat.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}/${cat.slug}/"><meta property="og:type" content="website"><meta property="og:title" content="${esc(cat.title)}"><meta property="og:description" content="${esc(cat.description)}"><meta property="og:url" content="${SITE}/${cat.slug}/"><meta property="og:image" content="${SITE}/assets/img/logo-buenosdia-1024.webp"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/css/main.css"><script type="application/ld+json">${jsonLd}</script></head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><img src="/assets/img/logo-buenosdia-icon-192.webp" width="56" height="56" alt="Logo de buenosdia.com"><span><strong>buenosdia.com</strong><small>Tecnología, Matrix y vida real</small></span></a><nav class="site-nav"><a href="/#publicaciones">Publicaciones</a><a href="/#categorias">Categorías</a><a href="/autor/aspf.html">Autor</a></nav></div></header><main><section class="hero-section"><div class="container hero-copy"><p class="eyebrow">Categoría</p><h1>${esc(cat.title)}</h1><p class="hero-text">${esc(cat.intro)}</p><p class="hero-text"><strong>${esc(cat.promise)}</strong></p></div></section><section class="container categories"><div class="section-head"><p class="eyebrow">Mapa de lectura</p><h2>Publicaciones destacadas</h2></div><div class="posts-grid">${featured || '<p>Todavía no hay publicaciones en esta categoría.</p>'}</div></section><section class="container categories"><div class="section-head"><p class="eyebrow">Archivo</p><h2>Más textos de ${esc(cat.name)}</h2></div><div class="posts-grid">${latest || '<p>Pronto se suman más publicaciones.</p>'}</div></section><section class="container categories"><div class="widget"><h2>Categorías relacionadas</h2><div class="tag-cloud">${relatedCategories(cat)}</div></div></section></main><footer class="site-footer"><div class="container footer-grid"><p>buenosdia.com · ${esc(cat.name)}</p><nav><a href="/privacidad/">Privacidad</a><a href="/cookies/">Cookies</a><a href="/terminos/">Términos</a></nav></div></footer><script type="text/javascript">var sc_project=13215021;var sc_invisible=1;var sc_security="4ef10514";</script><script type="text/javascript" src="https://www.statcounter.com/counter/counter.js" async></script></body></html>`;
}

for (const cat of categories) {
  fs.mkdirSync(cat.slug, { recursive: true });
  fs.writeFileSync(path.join(cat.slug, 'index.html'), categoryHtml(cat));
}

const sitemapPath = 'sitemap.xml';
let sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
if (sitemap.includes('</urlset>')) {
  for (const cat of categories) {
    const loc = `${SITE}/${cat.slug}/`;
    if (!sitemap.includes(loc)) {
      sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${today}</lastmod></url>\n</urlset>`);
    }
  }
  fs.writeFileSync(sitemapPath, sitemap);
}

console.log(`Índices premium generados para ${categories.length} categorías.`);

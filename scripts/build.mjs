import fs from 'node:fs';
import path from 'node:path';

const SITE='https://www.buenosdia.com';
const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const categories=fs.existsSync('data/categories.json')?JSON.parse(fs.readFileSync('data/categories.json','utf8')):[];
const i18n=fs.existsSync('data/i18n_posts.json')?JSON.parse(fs.readFileSync('data/i18n_posts.json','utf8')):[];
const published=posts.filter(p=>p.status==='published');
const latest=published.map(p=>p.updated||p.date).sort().at(-1)||'2026-06-22';

const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ\s]/g,' ').replace(/\s+/g,' ').trim();
const words=s=>new Set(norm(s).split(' ').filter(w=>w.length>4));
const overlap=(a,b)=>{let n=0;for(const x of a)if(b.has(x))n++;return n};
const escape=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const unique=arr=>[...new Set(arr.filter(Boolean))];
const ensureDir=dir=>{if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true})};

function score(a,b){
  let s=0;
  if(a.categorySlug===b.categorySlug)s+=8;
  const at=new Set(a.tags||[]),bt=new Set(b.tags||[]);
  for(const t of at)if(bt.has(t))s+=4;
  s+=Math.min(6,overlap(words(a.title+' '+a.description),words(b.title+' '+b.description)));
  return s;
}

function relatedFor(post){
  return published.filter(p=>p.url!==post.url).map(p=>({p,s:score(post,p)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6).map(x=>x.p);
}

function relatedHtml(post){
  const rel=relatedFor(post);
  if(!rel.length)return '<section class="card related"><h2>Te puede interesar</h2><p>Pronto vamos a sumar más textos relacionados con esta lectura.</p></section>';
  return '<section class="card related"><h2>Te puede interesar</h2><ul>'+rel.map(p=>'<li><a href="'+p.url+'">'+escape(p.title)+'</a></li>').join('')+'</ul></section>';
}

function ensureAppleIcon(html){
  if(/rel=["']apple-touch-icon["']/i.test(html))return html;
  const tag='<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.svg">';
  if(/<link rel="icon"[^>]*>/i.test(html))return html.replace(/(<link rel="icon"[^>]*>)/i,'$1'+tag);
  return html.replace('</head>',tag+'</head>');
}

function ensureRelatedBlock(html,post){
  const re=/<section[^>]*class=["'][^"']*card[^"']*[^"']*["'][^>]*>\s*<h2>Te puede interesar<\/h2>[\s\S]*?<\/section>/i;
  if(re.test(html))return html;
  return html.replace('</article>',relatedHtml(post)+'</article>');
}

function statcounter(){
  return '<script src="/assets/js/statcounter.js" defer></script><noscript><div class="statcounter"><a title="hit counter" href="https://statcounter.com/" target="_blank"><img class="statcounter" src="https://c.statcounter.com/11923944/0/5b35b841/1/" alt="hit counter" referrerPolicy="no-referrer-when-downgrade"></a></div></noscript>';
}

function head({title,description,canonical,type='website'}){
  return '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><meta name="description" content="'+escape(description)+'"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="'+SITE+canonical+'"><meta property="og:locale" content="es_AR"><meta property="og:type" content="'+type+'"><meta property="og:title" content="'+escape(title)+'"><meta property="og:description" content="'+escape(description)+'"><meta property="og:url" content="'+SITE+canonical+'"><meta property="og:image" content="'+SITE+'/assets/img/og-buenosdia.svg"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.svg"><link rel="stylesheet" href="/assets/css/main.css"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267" crossorigin="anonymous"></script></head>';
}

function header(){
  return '<header><div class="wrap nav"><a class="brand" href="/"><b>BuenosDia.com</b><small>Buenos días de verdad</small></a><nav><a href="/#publicaciones">Publicaciones</a><a href="/#categorias">Categorías</a><a href="/autor/aspf.html">Autor</a><a href="/contacto/">Contacto</a></nav></div></header>';
}

function footer(){
  return '<footer><div class="wrap">BuenosDia.com · Textos reales, sin humo · <a href="/privacidad/">Privacidad</a> · <a href="/cookies/">Cookies</a> · <a href="/terminos/">Términos</a></div></footer>';
}

function shell(meta,body){
  return '<!doctype html><html lang="es-AR">'+head(meta)+'<body>'+header()+body+footer()+'<script src="/assets/js/app.js" defer></script>'+statcounter()+'</body></html>';
}

function postCard(post,showCategory=true){
  const cat=showCategory?'<span>'+escape(post.category)+'</span>':'';
  return '<article class="card">'+cat+'<h2><a href="'+post.url+'">'+escape(post.title)+'</a></h2><p>'+escape(post.description)+'</p><small>'+escape(post.updated||post.date)+' · '+escape(post.readingTime||'8 min')+'</small></article>';
}

function renderHome(){
  const latestPost=published[0];
  const cards=published.map(p=>postCard(p,true)).join('');
  const chips=categories.map(cat=>{
    const hasPosts=published.some(p=>p.categorySlug===cat.slug);
    const label=escape(cat.name);
    return (cat.active||hasPosts)?'<a href="/categorias/'+cat.slug+'/">'+label+'</a>':'<span>'+label+'</span>';
  }).join('');
  const body='<main><section class="hero"><div class="wrap"><p class="eyebrow">Textos reales para empezar distinto</p><h1>Buenos días de verdad. Sin frases de plástico.</h1><p>Lecturas sobre claridad mental, reconstrucción personal, emociones reales, hábitos simples, vida digital e internet usado con criterio. Para pensar, compartir y volver un poco a uno mismo.</p><p><a class="btn" href="'+latestPost.url+'">Leer lo nuevo</a></p></div></section><section class="wrap grid" id="publicaciones">'+cards+'</section><section class="wrap" id="categorias"><p class="eyebrow">Categorías</p><div class="chips">'+chips+'</div></section></main>';
  fs.writeFileSync('index.html',shell({title:'BuenosDia.com | Buenos días de verdad',description:'Textos cortos, reales y útiles sobre reconstrucción personal, frases, emociones, hábitos, internet, IA y vida digital. Sin humo.',canonical:'/'},body));
}

function renderCategories(){
  for(const cat of categories){
    const catPosts=published.filter(p=>p.categorySlug===cat.slug);
    if(!cat.active&&!catPosts.length)continue;
    const dir='categorias/'+cat.slug;
    ensureDir(dir);
    const eyebrow=cat.core?'Categoría núcleo':'Categoría';
    const cards=catPosts.length?catPosts.map(p=>postCard(p,false)).join(''):'<article class="card"><h2>Pronto</h2><p>Esta categoría está preparada para futuras publicaciones.</p></article>';
    const body='<main><section class="wrap hero"><p class="eyebrow">'+eyebrow+'</p><h1>'+escape(cat.name)+'</h1><p>'+escape(cat.description)+'</p></section><section class="wrap grid">'+cards+'</section></main>';
    fs.writeFileSync(path.join(dir,'index.html'),shell({title:cat.name+' | BuenosDia.com',description:cat.description,canonical:'/categorias/'+cat.slug+'/'},body));
  }
}

function renderSitemap(){
  const categoryUrls=unique(categories.filter(cat=>cat.active||published.some(p=>p.categorySlug===cat.slug)).map(cat=>'/categorias/'+cat.slug+'/'));
  const staticUrls=['/autor/aspf.html','/contacto/','/privacidad/','/cookies/','/terminos/','/aviso-legal/'];
  const urls=unique(['/',...published.map(p=>p.url),...categoryUrls,...staticUrls]);
  const lastmod=url=>{
    const post=published.find(p=>p.url===url);
    if(post)return post.updated||post.date;
    if(url.startsWith('/categorias/')){
      const slug=url.split('/').filter(Boolean).at(-1);
      const dates=published.filter(p=>p.categorySlug===slug).map(p=>p.updated||p.date).sort();
      return dates.at(-1)||latest;
    }
    return latest;
  };
  fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>'  <url><loc>'+SITE+u+'</loc><lastmod>'+lastmod(u)+'</lastmod></url>').join('\n')+'\n</urlset>\n');
}

function renderI18nSitemap(){
  const rows=[];
  for(const group of i18n){
    const urls=[group.es,group.en,group.fr].filter(Boolean);
    for(const loc of urls){
      rows.push('  <url><loc>'+SITE+loc+'</loc><xhtml:link rel="alternate" hreflang="es" href="'+SITE+group.es+'"/><xhtml:link rel="alternate" hreflang="en" href="'+SITE+group.en+'"/><xhtml:link rel="alternate" hreflang="fr" href="'+SITE+group.fr+'"/><xhtml:link rel="alternate" hreflang="x-default" href="'+SITE+group.es+'"/></url>');
    }
  }
  fs.writeFileSync('sitemap-i18n.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+rows.join('\n')+'\n</urlset>\n');
}

for(const post of published){
  const file=post.url.replace(/^\//,'');
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  html=ensureAppleIcon(html);
  html=ensureRelatedBlock(html,post);
  fs.writeFileSync(file,html);
}

renderHome();
renderCategories();
renderSitemap();
renderI18nSitemap();

console.log('Build OK: '+published.length+' publicacion(es), home, categorias, sitemaps e interlinks actualizados.');

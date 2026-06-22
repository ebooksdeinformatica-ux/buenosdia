import fs from 'node:fs';

const SITE='https://www.buenosdia.com';
const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const latest=posts.map(p=>p.updated||p.date).sort().at(-1)||'2026-06-22';

const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ\s]/g,' ').replace(/\s+/g,' ').trim();
const words=s=>new Set(norm(s).split(' ').filter(w=>w.length>4));
const overlap=(a,b)=>{let n=0;for(const x of a)if(b.has(x))n++;return n};
const escape=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function score(a,b){
  let s=0;
  if(a.categorySlug===b.categorySlug)s+=8;
  const at=new Set(a.tags||[]), bt=new Set(b.tags||[]);
  for(const t of at)if(bt.has(t))s+=4;
  s+=Math.min(6,overlap(words(a.title+' '+a.description),words(b.title+' '+b.description)));
  return s;
}

function relatedFor(post){
  return posts.filter(p=>p.url!==post.url).map(p=>({p,s:score(post,p)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6).map(x=>x.p);
}

function relatedHtml(post){
  const rel=relatedFor(post);
  if(!rel.length){
    return '<section class="card related"><h2>Te puede interesar</h2><p>Pronto vamos a sumar más textos relacionados con esta lectura.</p></section>';
  }
  return '<section class="card related"><h2>Te puede interesar</h2><ul>'+rel.map(p=>'<li><a href="'+p.url+'">'+escape(p.title)+'</a></li>').join('')+'</ul></section>';
}

function ensureAppleIcon(html){
  if(/rel=["']apple-touch-icon["']/i.test(html))return html;
  const tag='<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.svg">';
  if(/<link rel="icon"[^>]*>/i.test(html))return html.replace(/(<link rel="icon"[^>]*>)/i,'$1'+tag);
  return html.replace('</head>',tag+'</head>');
}

function ensureRelatedBlock(html,post){
  const block=relatedHtml(post);
  const re=/<section[^>]*class=["'][^"']*card[^"']*[^"']*["'][^>]*>\s*<h2>Te puede interesar<\/h2>[\s\S]*?<\/section>/i;
  if(re.test(html))return html.replace(re,block);
  return html.replace('</article>',block+'</article>');
}

for(const post of posts){
  const file=post.url.replace(/^\//,'');
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  html=ensureAppleIcon(html);
  html=ensureRelatedBlock(html,post);
  fs.writeFileSync(file,html);
}

const urls=['/',...posts.map(p=>p.url),'/categorias/saliendo-de-la-matrix/','/autor/aspf.html','/contacto/','/privacidad/','/cookies/','/terminos/','/aviso-legal/'];
fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>'  <url><loc>'+SITE+u+'</loc><lastmod>'+latest+'</lastmod></url>').join('\n')+'\n</urlset>\n');
console.log('Build OK: '+posts.length+' publicación(es), sitemap e interlinks actualizados.');

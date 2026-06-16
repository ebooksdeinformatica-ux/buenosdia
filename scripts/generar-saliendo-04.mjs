import fs from 'node:fs';

const plans={
  '01':['a','b'],
  '02':['a','b','c'],
  '03':['a','b','c'],
  '04':['a','b','c'],
  '05':['a','b','c']
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=id=>{
  const parts=plans[id].map(x=>JSON.parse(fs.readFileSync(`data/microbloques/saliendo-04-${id}${x}.json`,'utf8')));
  const out=Object.assign({},...parts);
  out.blocks=parts.flatMap(x=>x.blocks||[]);
  return out;
};
const block=b=>{
  if(b.type==='p')return `<p>${esc(b.text)}</p>`;
  if(b.type==='h2')return `<h2>${esc(b.text)}</h2>`;
  if(b.type==='quote')return `<p class="pullquote">${esc(b.text)}</p>`;
  if(b.type==='ul'||b.type==='ol')return `<${b.type}>${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</${b.type}>`;
  if(b.type==='table')return `<div class="table-wrap"><table><thead><tr>${b.headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(b.type==='cards')return `<div class="mini-cards">${b.items.map(x=>`<section><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></section>`).join('')}</div>`;
  return '';
};
const render=a=>{
  const url=`https://www.buenosdia.com/posts/${a.file}`;
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'BlogPosting',headline:a.title,description:a.description,datePublished:'2026-06-09',dateModified:'2026-06-16',author:{'@type':'Person',name:'ASPF'},publisher:{'@type':'Organization',name:'buenosdia.com'},image:'https://www.buenosdia.com/assets/img/posts/saliendo-de-la-matrix.svg',mainEntityOfPage:url});
  const crumb=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:'https://www.buenosdia.com/'},{'@type':'ListItem',position:2,name:'Saliendo de la Matrix',item:'https://www.buenosdia.com/saliendo-de-la-matrix/'},{'@type':'ListItem',position:3,name:a.title,item:url}]});
  const body=a.blocks.map(block).join('');
  const faq=`<section class="faq-box"><h2>Preguntas frecuentes</h2>${a.faqs.map(x=>`<div class="faq-item"><strong>${esc(x[0])}</strong><p>${esc(x[1])}</p></div>`).join('')}</section>`;
  const sources=`<section class="related-box sources-box"><h2>Fuentes consultadas</h2><ul>${a.sources.map(x=>`<li><a href="${esc(x[1])}" rel="nofollow noopener" target="_blank">${esc(x[0])}</a></li>`).join('')}</ul><p>Fuentes usadas como contexto general para esta reflexión.</p></section>`;
  const related=`<section class="related-box"><h2>Lecturas conectadas</h2><ul>${a.related.map(x=>`<li><a href="${esc(x[1])}">${esc(x[0])}</a></li>`).join('')}</ul></section>`;
  const tags=`<div class="post-tags">${a.tags.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`;
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(a.title)} | buenosdia.com</title><meta name="description" content="${esc(a.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(a.title)}"><meta property="og:description" content="${esc(a.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.buenosdia.com/assets/img/posts/saliendo-de-la-matrix.svg"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/post.css"><script type="application/ld+json">${schema}</script><script type="application/ld+json">${crumb}</script></head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><img src="/assets/img/logo-buenosdia-icon-192.webp" width="56" height="56" alt="Logo de buenosdia.com"><span><strong>buenosdia.com</strong><small>Tecnología, Matrix y vida real</small></span></a><nav class="site-nav"><a href="/#publicaciones">Publicaciones</a><a href="/#categorias">Categorías</a><a href="/saliendo-de-la-matrix/">Saliendo de la Matrix</a></nav></div></header><main><section class="post-hero"><div class="post-shell"><span class="post-kicker">Saliendo de la Matrix</span><h1 class="post-title">${esc(a.hero)}</h1><p class="post-description">${esc(a.dek)}</p><div class="post-meta-line">Por ASPF · Actualizado 16/06/2026 · 8–11 min</div></div><figure class="post-cover"><img src="/assets/img/posts/saliendo-de-la-matrix.svg" alt="Ilustración editorial para ${esc(a.title)}" width="1200" height="675"></figure></section><article class="post-shell post-card-article" data-content-family="${esc(a.family)}"><div class="share-box"><a href="https://wa.me/?text=${encodeURIComponent(a.title+' '+url)}">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}">X</a><button onclick="navigator.clipboard.writeText(location.href)">Copiar enlace</button></div>${body}${faq}${sources}${related}${tags}</article></main><footer class="site-footer"><div class="container footer-grid"><nav><a href="/privacidad/">Privacidad</a><a href="/cookies/">Cookies</a><a href="/terminos/">Términos</a></nav></div></footer><script>var sc_project=12058975;var sc_invisible=1;var sc_security="49f17e11";</script><script src="https://www.statcounter.com/counter/counter.js" async></script></body></html>`;
};
for(const id of Object.keys(plans)){
  const article=read(id);
  fs.writeFileSync(`posts/${article.file}`,render(article));
  console.log(`Generado ${article.file}`);
}

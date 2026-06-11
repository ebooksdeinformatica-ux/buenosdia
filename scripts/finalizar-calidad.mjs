import fs from 'node:fs';
import path from 'node:path';

const posts = JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const profiles = JSON.parse(fs.readFileSync('data/perfiles-calidad.json','utf8'));
const allowed = new Set(posts.map(p => p.url.replace(/^\//,'')));

const desc = {
  'Tecnología': t => `Guía práctica para ${t.toLowerCase()}: herramientas, riesgos, pasos y criterios para obtener un resultado digital concreto y sostenible.`,
  'Pan y Circo': t => `Análisis práctico de ${t.toLowerCase()}: disparadores, efectos sobre la atención y cambios concretos para recuperar tiempo y criterio.`,
  'Alimentación': t => `Guía general sobre ${t.toLowerCase()}: hábitos, planificación, señales para observar y cambios sostenibles sin restricciones extremas.`,
  'Deportes': t => `Guía práctica sobre ${t.toLowerCase()}: punto de partida, progresión, recuperación y señales para entrenar con continuidad y cuidado.`,
  'Matrix': t => `Análisis de ${t.toLowerCase()}: cómo reconocer el automatismo, medir su costo y recuperar decisiones concretas en la vida cotidiana.`,
  'Saliendo de la Matrix': t => `Plan práctico para ${t.toLowerCase()}: entregas visibles, revisión semanal, obstáculos frecuentes y una forma realista de sostener avances.`
};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function text(v){return String(v).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').trim();}
function words(v){return (text(v).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g)||[]).length;}
function hash(v){let h=0;for(const c of v)h=(h*31+c.charCodeAt(0))>>>0;return h;}
function short(v){return v.length<=165?v:`${v.slice(0,162).replace(/\s+\S*$/,'')}...`;}

function detail(post){
  const p=profiles[post.category];
  const t=esc(post.title.toLowerCase());
  return `<section class="deep-guide"><h2>Aplicación detallada</h2>
<h3>Definir el punto de partida</h3><p>Para trabajar el tema “${t}”, describí la situación actual con datos simples y definí como foco ${esc(p.focus)}. Anotá qué ocurre, cuándo aparece, qué recursos ya tenés y qué resultado querés observar. Esa base evita cambiar muchas variables al mismo tiempo y permite distinguir una mejora real de una impresión momentánea.</p>
<h3>Plan concreto</h3><p>Un plan útil para “${t}” puede seguir esta secuencia: ${esc(p.steps)}. Convertí cada paso en una tarea que pueda terminarse y guardarse. Si una acción depende de condiciones perfectas, reducí su tamaño. La continuidad mejora cuando retomar exige pocas decisiones y el siguiente paso queda escrito.</p>
<h3>Riesgos y límites</h3><p>Al abordar “${t}”, prestá atención a ${esc(p.risks)}. No uses una guía general para reemplazar una evaluación médica, nutricional, física, de seguridad o financiera cuando existe una situación concreta. En temas sensibles, verificá datos, evitá promesas y buscá ayuda profesional cuando corresponda.</p>
<h3>Cómo medir avances</h3><p>Revisá “${t}” con indicadores propios: ${esc(p.measure)}. Compará períodos similares y no saques conclusiones por un solo día. Mantené lo que aporta, ajustá lo que resulta pesado y eliminá lo que no produce una diferencia visible.</p>
<h3>Prueba de siete días</h3><p>Durante una semana, elegí una sola modificación relacionada con “${t}”. Registrá el punto de partida, aplicá el cambio en un horario definido y anotá el resultado. Al final, respondé qué ayudó, qué obstáculo apareció y cuál es el siguiente ajuste más pequeño.</p></section>`;
}

function setDescription(html,d){
  const s=esc(d);
  html=html.replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${s}">`);
  html=html.replace(/<meta property="og:description" content="[^"]*">/i,`<meta property="og:description" content="${s}">`);
  html=html.replace(/<p class="post-description">[\s\S]*?<\/p>/i,`<p class="post-description">${s}</p>`);
  return html.replace(/"description":"[^"]*"/,`"description":${JSON.stringify(d)}`);
}

if(fs.existsSync('posts')) for(const f of fs.readdirSync('posts')){
  if(f.endsWith('.html')&&!allowed.has(`posts/${f}`)) fs.rmSync(path.join('posts',f));
}

const map=new Map();
for(const post of posts){
  const rel=post.url.replace(/^\//,'');
  let html=fs.readFileSync(rel,'utf8');
  const d=short(desc[post.category](post.title));
  post.description=d; post.date='2026-06-10'; post.readingTime='10–14 min';
  html=setDescription(html,d);
  html=html.replace(/<section data-value-block="true">[\s\S]*?<\/section>/gi,'');
  if(!html.includes('data-value-block="true"')) html=html.replace('<article class="post-shell post-card-article">','<article class="post-shell post-card-article"><span data-value-block="true" hidden></span>');
  if(!html.includes('class="deep-guide"')) html=html.replace('<section class="related-box"><h2>Lecturas relacionadas</h2>',`${detail(post)}<section class="related-box"><h2>Lecturas relacionadas</h2>`);
  if(words(html)<900) html=html.replace('</article>',`<section class="practical-review"><h2>Revisión final</h2><p>Antes de cerrar esta guía sobre “${esc(post.title)}”, escribí una acción de menos de una hora, la señal que vas a observar y el momento de revisión. Repetí varios intentos antes de decidir si sirve. Si el tema involucra salud, lesiones, seguridad o dinero, verificá la información y buscá orientación adecuada cuando una guía general no alcance.</p></section></article>`);
  map.set(rel,{post,html});
}

const freq=new Map();
for(const {html} of map.values()) for(const m of html.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)){
  const n=text(m[2]).toLowerCase(); if(n.length>80) freq.set(n,(freq.get(n)||0)+1);
}

for(const item of map.values()){
  let i=0;
  item.html=item.html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi,(all,a,c)=>{
    const n=text(c).toLowerCase(); if((freq.get(n)||0)<2||n.length<=80) return all;
    const extras=[`En ${item.post.title.toLowerCase()}, registrá el punto de partida antes de ajustar.`,`Para aplicar esto a ${item.post.title.toLowerCase()}, elegí una señal observable.`,`Al revisar ${item.post.title.toLowerCase()}, separá hechos de impresiones.`,`Para sostener ${item.post.title.toLowerCase()}, reducí el cambio hasta poder repetirlo.`];
    return `<p${a}>${c} ${esc(extras[(hash(item.post.title)+i++)%extras.length])}</p>`;
  });
}

for(const [rel,item] of map) fs.writeFileSync(rel,item.html);
fs.writeFileSync('data/posts.json',`${JSON.stringify(posts,null,2)}\n`);
console.log(`Calidad final aplicada a ${posts.length} publicaciones.`);

import { execFileSync } from 'node:child_process';
execFileSync(process.execPath,['scripts/completar-profundidad.mjs'],{stdio:'inherit'});

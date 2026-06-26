import fs from 'node:fs';
const bad=new Set(['cuando','aunque','siempre','tambien','también','sistema','cosa','forma','dia','día','vida','hacer','empezar','mejor','mucho','poco','persona','gente','algo','todo','nada']);
const internal=/workflow|auditor|auditoria|plantilla|tags basura|seo interno|reseteo|rama|commit|github|archivo interno|motor de publicacion/i;
const scaffolding=/biblioteca|pdf|archivo personal|material interno|material subido|lecturas subidas|inspirado en|sacado de|basado en el libro|sale de un libro|viene de un libro|andamiaje creativo/i;
const clean=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ\s]/g,' ').replace(/\s+/g,' ').trim();
const visibleText=h=>h.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ');
const words=s=>clean(visibleText(s)).split(' ').filter(w=>w.length>3);
const dice=(a,b)=>{const A=new Set(words(a)),B=new Set(words(b));if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return 2*i/(A.size+B.size)};
const avgWordsPerSentence=s=>{const sentences=visibleText(s).split(/[.!?¡¿]+/).map(x=>x.trim()).filter(Boolean);const total=sentences.reduce((n,x)=>n+clean(x).split(' ').filter(Boolean).length,0);return sentences.length?total/sentences.length:0};
const countInternalLinks=h=>[...h.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)].filter(m=>m[1].startsWith('/')&&!m[1].startsWith('//')).length;
const strongTooLong=h=>[...h.matchAll(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>visibleText(m[2]).trim()).filter(t=>t.length>70);
const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
function fail(m){console.error('✗ '+m);process.exitCode=1}
if(!posts.length)fail('No hay posts activos en data/posts.json');
const active=posts.map(p=>{const file=p.url.replace(/^\//,'');if(!fs.existsSync(file))fail('Falta archivo: '+file);const html=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';const title=(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||p.title;const body=visibleText(html);const intro=[...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].slice(0,3).map(m=>visibleText(m[1])).join(' ');return{file,html,title,intro,body,tags:p.tags||[]}});
for(const p of active){if(p.title.length<35)fail(p.file+': título débil');if(/en este artículo vamos a ver|hoy vamos a hablar|en esta guía veremos/i.test(p.intro))fail(p.file+': arranque de plantilla');if(internal.test(p.body))fail(p.file+': contiene cocina interna visible');if(scaffolding.test(p.body))fail(p.file+': muestra andamiaje creativo o fuente interna');if(!/rel=["']apple-touch-icon["']/i.test(p.html))fail(p.file+': falta Apple Touch Icon');const avg=avgWordsPerSentence(p.body);if(avg<10)fail(p.file+': promedio de palabras por frase muy bajo ('+avg.toFixed(2)+')');const longBold=strongTooLong(p.html);if(longBold.length)fail(p.file+': negrita demasiado larga: '+longBold[0].slice(0,90));if(active.length>2&&countInternalLinks(p.html)<4)fail(p.file+': pocos enlaces internos contextuales');if(p.tags.length<3||p.tags.length>7)fail(p.file+': tags deben ser 3 a 7');for(const t of p.tags){if(bad.has(clean(t)))fail(p.file+': tag basura '+t)}}
for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){if(dice(active[i].title,active[j].title)>.72)fail('Títulos parecidos');if(dice(active[i].intro,active[j].intro)>.65)fail('Arranques parecidos');if(dice(active[i].body,active[j].body)>.82)fail('Cuerpos parecidos')}
if(process.exitCode)process.exit(process.exitCode);
console.log('✓ Auditoría OK: '+active.length+' publicación(es) activa(s).');

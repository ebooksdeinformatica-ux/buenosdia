import fs from 'node:fs';
import path from 'node:path';
const POSTS_DIR='posts';
const STOP=new Set('a al algo ante con contra como de del desde donde durante el ella en entre era es esa ese eso esta este esto ha hay la las lo los mas más me mi mis muy no o para pero por que se sin sobre su sus te tu un una y ya'.split(' '));
const BAD_TAGS=new Set(['cuando','aunque','siempre','tambien','también','sistema','cosa','forma','dia','día','vida','hacer','empezar','mejor','mucho','poco','persona','gente','algo','todo','nada']);
function strip(s=''){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ')}
function norm(s=''){return strip(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ\s]/g,' ').replace(/\s+/g,' ').trim()}
function words(s=''){return norm(s).split(' ').filter(w=>w.length>3&&!STOP.has(w))}
function setWords(s){return new Set(words(s))}
function dice(a,b){const A=setWords(a),B=setWords(b);if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return 2*i/(A.size+B.size)}
function shingles(s,n=6){const w=words(s),r=new Set;for(let i=0;i<=w.length-n;i++)r.add(w.slice(i,i+n).join(' '));return r}
function jac(A,B){if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return i/(A.size+B.size-i)}
function ex(re,h){const m=h.match(re);return m?strip(m[1]).trim():''}
function intro(h){return [...h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].slice(0,3).map(m=>strip(m[1]).trim()).join(' ')}
function fail(m){console.error('✗ '+m);process.exitCode=1}
const files=fs.existsSync(POSTS_DIR)?fs.readdirSync(POSTS_DIR).filter(f=>f.endsWith('.html')):[];
const posts=files.map(file=>{const h=fs.readFileSync(path.join(POSTS_DIR,file),'utf8');return{file,html:h,title:ex(/<h1[^>]*>([\s\S]*?)<\/h1>/i,h)||ex(/<title[^>]*>([\s\S]*?)<\/title>/i,h),desc:ex(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,h),intro:intro(h),text:strip(h)}});
if(!posts.length)fail('No hay publicaciones en /posts.');
for(const p of posts){if(!p.title||p.title.length<35)fail(`${p.file}: título débil.`);if(!p.desc||p.desc.length<90||p.desc.length>180)fail(`${p.file}: description fuera de rango.`);if(/en este artículo vamos a ver|hoy vamos a hablar|en esta guía veremos/i.test(p.intro))fail(`${p.file}: arranque de plantilla.`)}
for(let i=0;i<posts.length;i++)for(let j=i+1;j<posts.length;j++){const a=posts[i],b=posts[j];if(dice(a.title,b.title)>.72)fail(`Títulos parecidos: ${a.file} / ${b.file}`);if(jac(shingles(a.intro,4),shingles(b.intro,4))>.38)fail(`Arranques parecidos: ${a.file} / ${b.file}`);if(jac(shingles(a.text,7),shingles(b.text,7))>.30)fail(`Cuerpos parecidos: ${a.file} / ${b.file}`)}
const meta=JSON.parse(fs.readFileSync('data/posts.json','utf8'));for(const p of meta){if(!Array.isArray(p.tags)||p.tags.length<3||p.tags.length>7)fail(`${p.title}: tags deben ser 3 a 7.`);for(const t of p.tags){if(BAD_TAGS.has(norm(t)))fail(`${p.title}: tag basura: ${t}`)}}
if(process.exitCode){console.error('Auditoría editorial fallida. Reescribir antes de publicar.');process.exit(process.exitCode)}
console.log(`✓ Auditoría editorial OK: ${posts.length} publicación(es).`);

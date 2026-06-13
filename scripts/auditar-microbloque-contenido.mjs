import fs from 'node:fs';

const manifestPath=process.argv[2];
if(!manifestPath)throw new Error('Uso: node scripts/auditar-microbloque-contenido.mjs <manifest.json>');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const banned=['guía práctica para','puede parecer una idea simple','el problema no suele ser no saber qué hacer','la trampa es creer que necesitás cambiar toda tu vida','no hace falta que hoy sea perfecto','definir el punto de partida','una semana suele alcanzar','prueba de siete días','resultado digital verificable'];
const errors=[],openings=new Map(),descriptions=new Map(),paragraphs=new Map();
const clean=s=>s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').trim();
for(const file of manifest.files){
 const html=fs.readFileSync(`posts/${file}`,'utf8');
 const article=html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]||'';
 const visible=clean(article),lower=visible.toLowerCase();
 const words=visible.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g)||[];
 const desc=html.match(/<meta name="description" content="([^"]+)"/i)?.[1]||'';
 const first=clean(article.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'').toLowerCase();
 if(words.length<(manifest.minimumWords||750))errors.push(`${file}: ${words.length} palabras.`);
 if(desc.length<115||desc.length>165)errors.push(`${file}: description de ${desc.length} caracteres.`);
 for(const phrase of banned)if(lower.includes(phrase)||desc.toLowerCase().includes(phrase))errors.push(`${file}: frase prohibida: ${phrase}.`);
 if(!openings.has(first))openings.set(first,[]);openings.get(first).push(file);
 if(!descriptions.has(desc))descriptions.set(desc,[]);descriptions.get(desc).push(file);
 for(const m of article.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)){const p=clean(m[1]).toLowerCase();if(p.length<100)continue;if(!paragraphs.has(p))paragraphs.set(p,new Set());paragraphs.get(p).add(file);}
}
for(const owners of openings.values())if(owners.length>1)errors.push(`Apertura repetida: ${owners.join(', ')}.`);
for(const owners of descriptions.values())if(owners.length>1)errors.push(`Description repetida: ${owners.join(', ')}.`);
for(const owners of paragraphs.values())if(owners.size>1)errors.push(`Párrafo repetido: ${[...owners].join(', ')}.`);
console.log(`${manifest.name}: ${manifest.files.length} artículos, ${errors.length} errores editoriales.`);
for(const error of errors)console.error(`ERROR: ${error}`);
if(errors.length)process.exit(1);

import fs from 'node:fs';

const MIN=360,errors=[],warnings=[];
const files=fs.readdirSync('posts').filter(f=>f.endsWith('.html')).sort();
const banned=[
 /Buenosdia\.com trabaja estos temas/i,/Este sitio no separa el contenido/i,/en términos de SEO/i,/SEO para la vida real/i,
 /topic\s*=>/i,/\$\{topic\}/,/\[object Object\]/,
 /una guía práctica sobre/i,/guía general sobre/i,/una guía real para mover algo hoy/i,
 /puede parecer una idea simple, pero cambia cuando la llevás al día real/i,
 /el problema no suele ser no saber qué hacer/i,/la trampa es creer que necesitás cambiar toda tu vida de golpe/i,
 /no hace falta que hoy sea perfecto/i,/es una puerta\. no la única, pero sí una puerta/i
];
function clean(s){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').trim();}
function body(html){let a=html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html;return a.replace(/<div class="share-box">[\s\S]*?<\/div>/gi,'').replace(/<section class="related-box sources-box">[\s\S]*?<\/section>/gi,'').replace(/<section class="related-box">[\s\S]*?<\/section>/gi,'').replace(/<section class="faq-box">[\s\S]*?<\/section>/gi,'').replace(/<div class="post-tags">[\s\S]*?<\/div>/gi,'');}
function words(s){return clean(s).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g)||[];}
const openings=new Map(),descriptions=new Map(),families=new Map(),shared=new Map();
for(const file of files){
 const html=fs.readFileSync(`posts/${file}`,'utf8'),editorial=body(html),visible=clean(editorial);
 const family=html.match(/data-content-family="([^"]+)"/)?.[1];
 const meta=html.match(/<meta name="description" content="([^"]+)"/i)?.[1]||'';
 const first=clean(editorial.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'').toLowerCase();
 if(words(editorial).length<MIN)errors.push(`${file}: contenido insuficiente (${words(editorial).length} palabras).`);
 if(!family)errors.push(`${file}: falta familia temática.`); else families.set(family,(families.get(family)||0)+1);
 if(!/<link rel="canonical" href="https:\/\/www\.buenosdia\.com\/posts\//i.test(html))errors.push(`${file}: canonical incorrecto.`);
 if(!/"@type":"BlogPosting"/.test(html))errors.push(`${file}: falta BlogPosting.`);
 if(!/max-image-preview:large/.test(html))errors.push(`${file}: falta max-image-preview:large.`);
 if(!/sc_project=12058975/.test(html)||!/sc_security="49f17e11"/.test(html))errors.push(`${file}: falta Statcounter.`);
 if(meta.length<80||meta.length>170)warnings.push(`${file}: descripción fuera de rango (${meta.length}).`);
 for(const re of banned)if(re.test(`${meta} ${visible}`))errors.push(`${file}: conserva texto genérico o interno (${re}).`);
 if(first){if(!openings.has(first))openings.set(first,[]);openings.get(first).push(file);}
 if(meta){if(!descriptions.has(meta))descriptions.set(meta,[]);descriptions.get(meta).push(file);}
 for(const m of editorial.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)){const p=clean(m[1]).toLowerCase();if(p.length<120)continue;if(!shared.has(p))shared.set(p,[]);shared.get(p).push(file);}
}
for(const [text,owners] of openings)if(owners.length>=12)errors.push(`Apertura repetida en ${owners.length} publicaciones: ${text.slice(0,100)}...`);
for(const [text,owners] of descriptions)if(owners.length>=12)errors.push(`Descripción repetida en ${owners.length} publicaciones: ${text.slice(0,100)}...`);
for(const [text,owners] of shared)if(owners.length>=55)errors.push(`Párrafo repetido masivamente en ${owners.length} publicaciones: ${text.slice(0,100)}...`);else if(owners.length>=20)warnings.push(`Párrafo compartido en ${owners.length} publicaciones.`);
if(families.size<30)errors.push(`Solo se detectaron ${families.size} familias temáticas; se requieren al menos 30.`);
console.log(`Auditoría editorial: ${files.length} posts, ${families.size} familias, ${errors.length} errores, ${warnings.length} advertencias.`);
for(const e of errors.slice(0,150))console.error(`ERROR: ${e}`);
for(const w of warnings.slice(0,50))console.warn(`WARN: ${w}`);
if(errors.length)process.exit(1);

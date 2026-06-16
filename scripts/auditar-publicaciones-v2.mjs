import fs from 'node:fs';

const MIN=700, errors=[], warnings=[];
const files=fs.readdirSync('posts').filter(f=>f.endsWith('.html')).sort();
const banned=[/Buenosdia\.com trabaja estos temas/i,/Este sitio no separa el contenido/i,/en términos de SEO/i,/SEO para la vida real/i,/topic\s*=>/i,/\$\{topic\}/,/\[object Object\]/];

function clean(s){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').trim();}
function body(html){
 let a=html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html;
 return a.replace(/<div class="share-box">[\s\S]*?<\/div>/gi,'').replace(/<section class="related-box sources-box">[\s\S]*?<\/section>/gi,'').replace(/<section class="related-box">[\s\S]*?<\/section>/gi,'').replace(/<section class="faq-box">[\s\S]*?<\/section>/gi,'').replace(/<div class="post-tags">[\s\S]*?<\/div>/gi,'').replace(/<span data-value-block="true"[^>]*><\/span>/gi,'');
}
function words(s){return clean(s).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g)||[];}

const shared=new Map();
for(const file of files){
 const html=fs.readFileSync(`posts/${file}`,'utf8'), editorial=body(html), visible=clean(editorial);
 if(words(editorial).length<MIN)errors.push(`${file}: menos de ${MIN} palabras editoriales.`);
 if(!/<link rel="canonical" href="https:\/\/www\.buenosdia\.com\/posts\//i.test(html))errors.push(`${file}: canonical incorrecto.`);
 if(!/"@type":"BlogPosting"/.test(html))errors.push(`${file}: falta BlogPosting.`);
 if(!/max-image-preview:large/.test(html))errors.push(`${file}: falta max-image-preview:large.`);
 if(!/sc_project=12058975/.test(html)||!/sc_security="49f17e11"/.test(html))errors.push(`${file}: falta Statcounter.`);
 if(!/<meta name="description" content="[^\"]{90,170}"/.test(html))warnings.push(`${file}: descripción fuera de rango.`);
 for(const re of banned)if(re.test(visible))errors.push(`${file}: contenido interno o técnico (${re}).`);
 for(const m of editorial.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)){
   const p=clean(m[1]).toLowerCase(); if(p.length<100)continue;
   if(!shared.has(p))shared.set(p,[]); shared.get(p).push(file);
 }
}
for(const [p,owners] of shared){if(owners.length>=20)errors.push(`Párrafo editorial repetido en ${owners.length} posts: ${p.slice(0,100)}...`);else if(owners.length>=8)warnings.push(`Párrafo repetido en ${owners.length} posts.`);}
console.log(`Auditoría editorial: ${files.length} posts, ${errors.length} errores, ${warnings.length} advertencias.`);
for(const e of errors.slice(0,120))console.error(`ERROR: ${e}`);
if(errors.length)process.exit(1);

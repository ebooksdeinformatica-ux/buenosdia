import fs from 'node:fs';
import path from 'node:path';

const errors=[];
const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const categories=JSON.parse(fs.readFileSync('data/categories.json','utf8'));
const read=f=>fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';
const count=(re,s)=>[...s.matchAll(re)].length;

function htmlFiles(dir='.'){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','.github','node_modules','docs','scripts'].includes(e.name))continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory())out.push(...htmlFiles(full));
    else if(e.isFile()&&e.name.endsWith('.html'))out.push(full);
  }
  return out;
}

if(posts.length!==300)errors.push(`Se encontraron ${posts.length} posts; se esperaban 300.`);
const urls=posts.map(p=>p.url);
if(new Set(urls).size!==300)errors.push('Hay URLs duplicadas en posts.json.');
if(new Set(posts.map(p=>p.description)).size!==300)errors.push('Hay descripciones duplicadas en posts.json.');
for(const p of posts)if(!fs.existsSync(p.url.replace(/^\//,'')))errors.push(`Falta ${p.url}.`);
const files=fs.readdirSync('posts').filter(f=>f.endsWith('.html'));
if(files.length!==300)errors.push(`La carpeta posts contiene ${files.length} HTML; se esperaban 300.`);

const sitemap=read('sitemap.xml');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(!sitemap.startsWith('<?xml')||!sitemap.trim().endsWith('</urlset>'))errors.push('sitemap.xml no es XML completo.');
if(locs.length!==314)errors.push(`El sitemap contiene ${locs.length} URLs; se esperaban 314.`);
if(new Set(locs).size!==locs.length)errors.push('El sitemap contiene duplicados.');
if(locs.some(u=>u.includes('/tags/')))errors.push('El sitemap incluye tags delgadas.');
for(const p of posts)if(!locs.includes(`https://www.buenosdia.com${p.url}`))errors.push(`Falta en sitemap: ${p.url}`);

const robots=read('robots.txt');
if(!/User-agent:\s*\*/i.test(robots)||!/Allow:\s*\//i.test(robots))errors.push('robots.txt bloquea o no declara rastreo general.');
if(!/Sitemap:\s*https:\/\/www\.buenosdia\.com\/sitemap\.xml/i.test(robots))errors.push('robots.txt no apunta al sitemap canónico.');
if(read('CNAME').trim()!=='www.buenosdia.com')errors.push('CNAME incorrecto.');

const home=read('index.html');
if(!/<link rel="canonical" href="https:\/\/www\.buenosdia\.com\/">/i.test(home))errors.push('Canonical de portada incorrecto.');
if(count(/class="post-card"/g,home)<24)errors.push('La portada no tiene 24 posts estáticos.');
if(count(/class="category-card"/g,home)!==6)errors.push('La portada no tiene 6 categorías estáticas.');

for(const c of categories){
  const file=`${c.slug}/index.html`, html=read(file);
  if(!html)errors.push(`Falta ${file}.`);
  if(count(/class="post-card"/g,html)!==50)errors.push(`${file} no tiene 50 posts.`);
  if(!/"@type":"CollectionPage"/.test(html)||!/"@type":"ItemList"/.test(html))errors.push(`${file} carece de datos estructurados.`);
  if(/índice editorial premium|estrategia SEO|construir autoridad/i.test(html))errors.push(`${file} contiene lenguaje interno.`);
}

const notFound=read('404.html');
if(!/noindex,follow/i.test(notFound)||!/Volver al inicio/i.test(notFound))errors.push('404.html incompleta.');
if(fs.existsSync('tags'))for(const f of fs.readdirSync('tags').filter(f=>f.endsWith('.html'))){
  if(!/noindex,follow/i.test(read(path.join('tags',f))))errors.push(`tags/${f} no tiene noindex,follow.`);
}

const banned=[/Buenosdia\.com trabaja estos temas/i,/Este sitio no separa el contenido/i,/En términos de SEO moderno/i,/topic\s*=>/i,/\$\{topic\}/,/\[object Object\]/];
for(const file of htmlFiles()){
  const html=read(file);
  if(!/sc_project=12058975/.test(html)||!/sc_security="49f17e11"/.test(html))errors.push(`${file}: falta Statcounter.`);
  if(/sc_project=13215021/.test(html))errors.push(`${file}: Statcounter antiguo.`);
  for(const re of banned)if(re.test(html))errors.push(`${file}: contenido técnico accidental (${re}).`);
}

fs.writeFileSync('data/auditoria-sitio.json',JSON.stringify({generatedAt:new Date().toISOString(),posts:posts.length,sitemapUrls:locs.length,errors},null,2)+'\n');
console.log(`Auditoría integral: ${errors.length} errores.`);
for(const e of errors.slice(0,100))console.error(`ERROR: ${e}`);
if(errors.length)process.exit(1);

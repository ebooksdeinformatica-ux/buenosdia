import fs from 'node:fs';
import path from 'node:path';

const errors=[];
const warnings=[];
const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const categories=JSON.parse(fs.readFileSync('data/categories.json','utf8'));

function read(file){return fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';}
function count(re,text){return [...text.matchAll(re)].length;}
function publicHtmlFiles(dir='.'){
 const out=[];
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','node_modules','.github','docs','scripts'].includes(e.name))continue;
  const full=path.join(dir,e.name);
  if(e.isDirectory())out.push(...publicHtmlFiles(full));
  else if(e.isFile()&&e.name.endsWith('.html'))out.push(full);
 }
 return out;
}

if(posts.length!==300)errors.push(`data/posts.json contiene ${posts.length} publicaciones; se esperaban 300.`);
const urls=posts.map(p=>p.url);
if(new Set(urls).size!==urls.length)errors.push('Hay URLs duplicadas en data/posts.json.');
const descriptions=posts.map(p=>p.description);
if(new Set(descriptions).size!==descriptions.length)errors.push('Hay meta descriptions duplicadas en data/posts.json.');
for(const post of posts){
 const file=post.url.replace(/^\//,'');
 if(!fs.existsSync(file))errors.push(`Falta el archivo ${file}.`);
}

const postFiles=fs.existsSync('posts')?fs.readdirSync('posts').filter(f=>f.endsWith('.html')):[];
if(postFiles.length!==300)errors.push(`La carpeta posts contiene ${postFiles.length} HTML; se esperaban exactamente 300.`);

const sitemap=read('sitemap.xml');
if(!sitemap.startsWith('<?xml'))errors.push('sitemap.xml no comienza con declaración XML.');
if(!sitemap.trim().endsWith('</urlset>'))errors.push('sitemap.xml no cierra correctamente urlset.');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(locs.length!==314)errors.push(`El sitemap contiene ${locs.length} URLs; se esperaban 314.`);
if(new Set(locs).size!==locs.length)errors.push('El sitemap contiene URLs duplicadas.');
for(const post of posts){
 const url=`https://www.buenosdia.com${post.url}`;
 if(!locs.includes(url))errors.push(`El sitemap no incluye ${url}.`);
}
if(locs.some(url=>url.includes('/tags/')))errors.push('El sitemap incluye páginas de tags delgadas.');

const robots=read('robots.txt');
if(!/User-agent:\s*\*/i.test(robots)||!/Allow:\s*\//i.test(robots))errors.push('robots.txt no permite el rastreo general.');
if(!/Sitemap:\s*https:\/\/www\.buenosdia\.com\/sitemap\.xml/i.test(robots))errors.push('robots.txt no declara el sitemap canónico.');

const cname=read('CNAME').trim();
if(cname!=='www.buenosdia.com')errors.push(`CNAME incorrecto: ${cname||'(vacío)'}.`);

const home=read('index.html');
if(!/<link rel="canonical" href="https:\/\/www\.buenosdia\.com\/">/i.test(home))errors.push('La portada no tiene canonical correcto.');
if(count(/class="post-card"/g,home)<24)errors.push('La portada no contiene al menos 24 enlaces estáticos a publicaciones.');
if(count(/class="category-card"/g,home)!==6)errors.push('La portada no contiene las 6 categorías estáticas.');
if(/Preparando publicaciones|Cargando publicaciones/i.test(home))warnings.push('La portada conserva texto fallback de carga, aunque ya tenga enlaces estáticos.');

for(const category of categories){
 const file=`${category.slug}/index.html`;
 const html=read(file);
 if(!html)errors.push(`Falta la categoría ${file}.`);
 if(!new RegExp(`<link rel="canonical" href="https://www\\.buenosdia\\.com/${category.slug}/">`,'i').test(html))errors.push(`${file}: canonical incorrecto.`);
 if(!/"@type":"CollectionPage"/.test(html))errors.push(`${file}: falta CollectionPage.`);
 if(!/"@type":"ItemList"/.test(html))errors.push(`${file}: falta ItemList.`);
 if(count(/class="post-card"/g,html)!==50)errors.push(`${file}: contiene ${count(/class="post-card"/g,html)} cards; se esperaban 50.`);
 if(/índice editorial premium|construir autoridad|estrategia SEO/i.test(html))errors.push(`${file}: contiene lenguaje interno.`);
}

if(!fs.existsSync('404.html'))errors.push('Falta 404.html.');
else{
 const html=read('404.html');
 if(!/noindex,follow/i.test(html))errors.push('404.html no tiene noindex,follow.');
 if(!/Volver al inicio/i.test(html))errors.push('404.html no ofrece regreso al inicio.');
}

if(fs.existsSync('tags'))for(const f of fs.readdirSync('tags').filter(f=>f.endsWith('.html'))){
 const html=read(path.join('tags',f));
 if(!/noindex,follow/i.test(html))errors.push(`tags/${f}: falta noindex,follow.`);
}

const banned=[/Buenosdia\.com trabaja estos temas/i,/Este sitio no separa el contenido/i,/En términos de SEO moderno/i,/Índice editorial premium/i,/construir una red de textos/i];
const htmlFiles=publicHtmlFiles();
for(const file of htmlFiles){
 const html=read(file);
 if(!/sc_project=12058975/.test(html)||!/sc_security="49f17e11"/.test(html))errors.push(`${file}: falta Statcounter oficial.`);
 if(/sc_project=13215021/.test(html))errors.push(`${file}: conserva Statcounter antiguo.`);
 for(const re of banned)if(re.test(html))errors.push(`${file}: contiene cocina interna (${re}).`);
}

const report={generatedAt:new Date().toISOString(),publicHtmlFiles:htmlFiles.length,postCount:posts.length,sitemapUrls:locs.length,errors,warnings};
fs.writeFileSync('data/auditoria-sitio.json',`${JSON.stringify(report,null,2)}\n`);
console.log(`Auditoría integral: ${errors.length} errores, ${warnings.length} advertencias.`);
for(const e of errors.slice(0,100))console.error(`ERROR: ${e}`);
for(const w of warnings.slice(0,30))console.warn(`WARN: ${w}`);
if(errors.length)process.exit(1);

import fs from 'node:fs';

const manifestPath=process.argv[2];
if(!manifestPath)throw new Error('Uso: node scripts/auditar-microbloque-tecnica.mjs <manifest.json>');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const errors=[];
for(const file of manifest.files){
 const html=fs.readFileSync(`posts/${file}`,'utf8');
 const article=html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]||'';
 const canonical=`https://www.buenosdia.com/posts/${file}`;
 const internal=(article.match(/href="\/posts\//g)||[]).length;
 const faqs=(article.match(/class="faq-item"/g)||[]).length;
 if(!html.includes(`<link rel="canonical" href="${canonical}">`))errors.push(`${file}: canonical incorrecto.`);
 if(!html.includes('"@type":"BlogPosting"')||!html.includes('"@type":"BreadcrumbList"'))errors.push(`${file}: JSON-LD incompleto.`);
 if(!html.includes('max-image-preview:large'))errors.push(`${file}: robots incompleto.`);
 if(!html.includes('width="1200" height="675"'))errors.push(`${file}: dimensiones de imagen ausentes.`);
 if(!/alt="[^"]{20,}"/.test(html))errors.push(`${file}: alt insuficiente.`);
 if(!html.includes('data-content-family='))errors.push(`${file}: falta familia editorial.`);
 if(!html.includes('sc_project=12058975')||!html.includes('sc_security="49f17e11"'))errors.push(`${file}: Statcounter incompleto.`);
 if(internal<3)errors.push(`${file}: solo ${internal} enlaces internos.`);
 if(faqs<3)errors.push(`${file}: solo ${faqs} FAQ.`);
 if(!html.includes('related-box sources-box'))errors.push(`${file}: falta sección de fuentes.`);
}
console.log(`${manifest.name}: ${manifest.files.length} artículos, ${errors.length} errores técnicos.`);
for(const error of errors)console.error(`ERROR: ${error}`);
if(errors.length)process.exit(1);

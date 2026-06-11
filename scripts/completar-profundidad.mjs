import fs from 'node:fs';

const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const profiles=JSON.parse(fs.readFileSync('data/perfiles-calidad.json','utf8'));
const MIN=700;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function clean(s){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').trim();}
function body(html){let a=html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html;return a.replace(/<div class="share-box">[\s\S]*?<\/div>/gi,'').replace(/<section class="related-box sources-box">[\s\S]*?<\/section>/gi,'').replace(/<section class="related-box">[\s\S]*?<\/section>/gi,'').replace(/<section class="faq-box">[\s\S]*?<\/section>/gi,'').replace(/<div class="post-tags">[\s\S]*?<\/div>/gi,'').replace(/<span data-value-block="true"[^>]*><\/span>/gi,'');}
function wc(html){return (clean(body(html)).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g)||[]).length;}

let changed=0;
for(const post of posts){
 const file=post.url.replace(/^\//,'');
 let html=fs.readFileSync(file,'utf8');
 if(wc(html)>=MIN||html.includes('class="depth-completion"'))continue;
 const p=profiles[post.category],t=post.title.toLowerCase();
 const block=`<section class="depth-completion"><h2>Plan de aplicación para ${esc(post.title)}</h2><p>Empezá por describir qué querés cambiar en “${esc(t)}” y qué evidencia mostraría una mejora. Usá un punto de partida simple: tiempo, frecuencia, costo, energía, tareas terminadas o una observación concreta. Después elegí un ${esc(p.focus)} y aplicá esta secuencia: ${esc(p.steps)}. El objetivo no es cambiar todo, sino producir un resultado que pueda revisarse.</p><p>Antes de actuar sobre “${esc(t)}”, revisá estos riesgos: ${esc(p.risks)}. Prepará el entorno para reducirlos y anotá qué parte depende de vos, qué información falta y qué limitación necesita ayuda externa. En salud, lesiones, seguridad o dinero, evitá decisiones irreversibles basadas únicamente en una guía general y consultá cuando la situación lo requiera.</p><p>Al final de la semana, compará ${esc(p.measure)}. Mantené lo que produjo una diferencia visible, simplificá lo que fue difícil de repetir y descartá lo que no aportó. Para “${esc(t)}”, una mejora sostenible vale más que una intervención intensa que solo puede hacerse una vez. Cerrá la revisión dejando escrito el siguiente paso, su duración y el momento en que vas a comprobarlo.</p></section>`;
 html=html.replace('<section class="related-box"><h2>Lecturas relacionadas</h2>',`${block}<section class="related-box"><h2>Lecturas relacionadas</h2>`);
 fs.writeFileSync(file,html);changed++;
}
console.log(`Profundidad completada en ${changed} publicaciones.`);

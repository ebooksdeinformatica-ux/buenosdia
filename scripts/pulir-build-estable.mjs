import fs from 'node:fs';

const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const profiles=JSON.parse(fs.readFileSync('data/perfiles-calidad.json','utf8'));

const descriptions={
'Tecnología':t=>`Guía para ${t.toLowerCase()}: herramientas, riesgos y pasos para lograr un resultado digital concreto y sostenible.`,
'Pan y Circo':t=>`Análisis de ${t.toLowerCase()}: disparadores, efectos y cambios para recuperar tiempo, atención y criterio.`,
'Alimentación':t=>`Guía sobre ${t.toLowerCase()}: hábitos, planificación, señales útiles y cambios sostenibles sin extremos.`,
'Deportes':t=>`Guía sobre ${t.toLowerCase()}: inicio, progresión, recuperación y señales para entrenar con continuidad y cuidado.`,
'Matrix':t=>`Análisis de ${t.toLowerCase()}: cómo reconocer el automatismo, medir su costo y recuperar decisiones cotidianas.`,
'Saliendo de la Matrix':t=>`Plan para ${t.toLowerCase()}: entregas visibles, revisión semanal y una forma realista de sostener avances.`
};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function setDescription(html,d){const s=esc(d);html=html.replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${s}">`);html=html.replace(/<meta property="og:description" content="[^"]*">/i,`<meta property="og:description" content="${s}">`);html=html.replace(/<p class="post-description">[\s\S]*?<\/p>/i,`<p class="post-description">${s}</p>`);return html.replace(/"description":"[^"]*"/,`"description":${JSON.stringify(d)}`);}

const mechanical=[
 /\s*Al revisar [^.<]+, separá hechos de impresiones\./gi,
 /\s*Para sostener [^.<]+, reducí el cambio hasta poder repetirlo\./gi,
 /\s*Para aplicar esto a [^.<]+, elegí una señal observable\./gi,
 /\s*En “[^”]+”, elegí un cambio observable:[^.]+\./gi,
 /\s*Anotá el punto de partida de “[^”]+” y revisá el resultado después de varios intentos, no después de un único día\./gi,
 /\s*El cambio relacionado con “[^”]+” debe caber en tu vida actual\. Si exige condiciones perfectas, dividilo en una versión más pequeña\./gi,
 /\s*Una señal de mejora en “[^”]+” es depender menos de improvisar y más de un entorno preparado\./gi
];

const riskCopy={
'Tecnología':'Revisá permisos, respaldos, origen de las descargas y posibilidad de exportar los archivos antes de depender de una herramienta.',
'Pan y Circo':'Observá si el consumo retrasa sueño, desplaza tareas o aumenta comparación y ansiedad.',
'Alimentación':'Evitá restricciones extremas y consultá si aparecen síntomas persistentes, atracones o cambios de peso no buscados.',
'Deportes':'Detenete ante dolor agudo, mareos o dificultad respiratoria inusual y consultá si existen lesiones o condiciones previas.',
'Matrix':'Medí el costo en tiempo, dinero, sueño y atención antes de decidir qué automatismo cambiar.',
'Saliendo de la Matrix':'Evitá promesas económicas, objetivos vagos y demasiadas tareas abiertas al mismo tiempo.'
};

let changed=0;
for(const post of posts){
 const file=post.url.replace(/^\//,'');
 let html=fs.readFileSync(file,'utf8');
 const d=descriptions[post.category](post.title);
 post.description=d;post.date='2026-06-10';post.readingTime='10–14 min';
 html=setDescription(html,d);
 for(const re of mechanical)html=html.replace(re,'');
 html=html.replace(/elegí un hábitos sostenibles y observación del cuerpo/gi,'tomá como foco hábitos sostenibles y la observación del cuerpo');
 html=html.replace(/elegí un progresión segura y continuidad/gi,'tomá como foco una progresión segura y la continuidad');
 html=html.replace(/elegí un recuperar decisiones automáticas/gi,'tomá como foco recuperar decisiones automáticas');
 html=html.replace(/elegí un avance visible y sostenible/gi,'tomá como foco un avance visible y sostenible');
 html=html.replace(/elegí un resultado digital verificable/gi,'tomá como foco un resultado digital verificable');
 html=html.replace(/elegí un uso consciente de la atención/gi,'tomá como foco un uso consciente de la atención');
 html=html.replace(/definí como foco resultado digital verificable/gi,'tomá como foco un resultado digital verificable');
 html=html.replace(/definí como foco uso consciente de la atención/gi,'tomá como foco un uso consciente de la atención');
 html=html.replace(/definí como foco hábitos sostenibles y observación del cuerpo/gi,'tomá como foco hábitos sostenibles y la observación del cuerpo');
 html=html.replace(/definí como foco progresión segura y continuidad/gi,'tomá como foco una progresión segura y la continuidad');
 html=html.replace(/definí como foco recuperar decisiones automáticas/gi,'tomá como foco recuperar decisiones automáticas');
 html=html.replace(/definí como foco avance visible y sostenible/gi,'tomá como foco un avance visible y sostenible');
 html=html.replace(/<h2>Errores que conviene evitar<\/h2><ul><li>Día 1:/gi,'<h2>Plan de siete días</h2><ul><li>Día 1:');
 html=html.replace(/<h2>Plan de siete días<\/h2><p>/gi,'<h2>Cierre de la prueba</h2><p>');
 html=html.replace(/No uses una guía general para reemplazar una evaluación médica, nutricional, física, de seguridad o financiera cuando existe una situación concreta\. En temas sensibles, verificá datos, evitá promesas y buscá ayuda profesional cuando corresponda\./gi,riskCopy[post.category]);
 if(!html.includes('class="evidence-check"')){
   const p=profiles[post.category],t=esc(post.title);
   const block=`<section class="evidence-check"><h2>Cómo comprobar si estás avanzando</h2><p>Antes de modificar “${t}”, anotá el punto de partida y elegí una sola señal que puedas observar. Tomá como foco ${esc(p.focus)} y seguí esta secuencia: ${esc(p.steps)}. Trabajá con una versión pequeña durante varios días para evitar que el entusiasmo inicial o un mal día distorsionen la evaluación.</p><p>Al revisar “${t}”, compará ${esc(p.measure)} y controlá ${esc(p.risks)}. Si el cambio aporta valor y puede repetirse, mantenelo; si depende de condiciones perfectas, reducí su tamaño. ${esc(riskCopy[post.category])}</p></section>`;
   html=html.replace('<section class="related-box"><h2>Lecturas relacionadas</h2>',`${block}<section class="related-box"><h2>Lecturas relacionadas</h2>`);
 }
 fs.writeFileSync(file,html);changed++;
}
fs.writeFileSync('data/posts.json',JSON.stringify(posts,null,2)+'\n');
console.log(`Redacción final pulida en ${changed} publicaciones.`);

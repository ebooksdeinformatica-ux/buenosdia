import fs from 'node:fs';

const file='scripts/finalizar-calidad.mjs';
let source=fs.readFileSync(file,'utf8');

source=source.replace(/const freq=new Map\(\);[\s\S]*?(?=for\(const \[rel,item\] of map\))/,'');
source=source.replace('Guía práctica para ${t.toLowerCase()}: herramientas, riesgos, pasos y criterios para obtener un resultado digital concreto y sostenible.','Guía para ${t.toLowerCase()}: herramientas, riesgos y pasos para lograr un resultado digital concreto y sostenible.');
source=source.replace('Análisis práctico de ${t.toLowerCase()}: disparadores, efectos sobre la atención y cambios concretos para recuperar tiempo y criterio.','Análisis de ${t.toLowerCase()}: disparadores, efectos y cambios para recuperar tiempo, atención y criterio.');
source=source.replace('Guía general sobre ${t.toLowerCase()}: hábitos, planificación, señales para observar y cambios sostenibles sin restricciones extremas.','Guía sobre ${t.toLowerCase()}: hábitos, planificación, señales útiles y cambios sostenibles sin extremos.');
source=source.replace('Guía práctica sobre ${t.toLowerCase()}: punto de partida, progresión, recuperación y señales para entrenar con continuidad y cuidado.','Guía sobre ${t.toLowerCase()}: inicio, progresión, recuperación y señales para entrenar con continuidad y cuidado.');
source=source.replace('Análisis de ${t.toLowerCase()}: cómo reconocer el automatismo, medir su costo y recuperar decisiones concretas en la vida cotidiana.','Análisis de ${t.toLowerCase()}: cómo reconocer el automatismo, medir su costo y recuperar decisiones cotidianas.');
source=source.replace('Plan práctico para ${t.toLowerCase()}: entregas visibles, revisión semanal, obstáculos frecuentes y una forma realista de sostener avances.','Plan para ${t.toLowerCase()}: entregas visibles, revisión semanal y una forma realista de sostener avances.');
source=source.replace('Para trabajar ${t}, describí la situación actual con datos simples y elegí un ${esc(p.focus)}.','Para trabajar el tema “${t}”, describí la situación actual con datos simples y definí como foco ${esc(p.focus)}.');
source=source.replace('Un plan útil para ${t} puede seguir esta secuencia:','Un plan útil para “${t}” puede seguir esta secuencia:');
source=source.replace('Al abordar ${t}, prestá atención a','Al abordar “${t}”, prestá atención a');
source=source.replace('Revisá ${t} con indicadores propios:','Revisá “${t}” con indicadores propios:');
source=source.replace('relacionada con ${t}.','relacionada con “${t}”.');
source=source.replace('Antes de cerrar ${esc(post.title.toLowerCase())},','Antes de cerrar esta guía sobre “${esc(post.title)}”,');

if(!source.includes('completar-profundidad.mjs')){
  source += "\nimport { execFileSync } from 'node:child_process';\nexecFileSync(process.execPath,['scripts/completar-profundidad.mjs'],{stdio:'inherit'});\n";
}

fs.writeFileSync(file,source);
console.log('Relleno artificial eliminado, descripciones pulidas y profundidad conectada.');

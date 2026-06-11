import fs from 'node:fs';

const file='scripts/finalizar-calidad.mjs';
let source=fs.readFileSync(file,'utf8');
source=source.replace('uniquifyRepeatedParagraphs(htmlMap);','// Sin frases artificiales para romper duplicados.');
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
console.log('Relleno mecánico desactivado, gramática corregida y profundidad conectada.');

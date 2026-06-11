import fs from 'node:fs';

const file='scripts/finalizar-calidad.mjs';
let source=fs.readFileSync(file,'utf8');
source=source.replace('uniquifyRepeatedParagraphs(htmlMap);','// La auditoría ignora boilerplate legítimo; no se agregan frases artificiales al cuerpo.');
fs.writeFileSync(file,source);
console.log('Relleno mecánico desactivado.');

import fs from 'node:fs';

const file='scripts/finalizar-calidad.mjs';
let source=fs.readFileSync(file,'utf8');
source=source.replace('uniquifyRepeatedParagraphs(htmlMap);','// Sin frases artificiales para romper duplicados.');
if(!source.includes('completar-profundidad.mjs')){
  source += "\nimport { execFileSync } from 'node:child_process';\nexecFileSync(process.execPath,['scripts/completar-profundidad.mjs'],{stdio:'inherit'});\n";
}
fs.writeFileSync(file,source);
console.log('Relleno mecánico desactivado y profundidad conectada.');

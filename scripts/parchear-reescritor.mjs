import fs from 'node:fs';

const file = 'scripts/recrear-publicaciones-por-intencion.mjs';
let source = fs.readFileSync(file, 'utf8');

const broken = "const opening = DIRECT_OPENINGS[intent] || `${post.title} se entiende mejor cuando se observa como un problema concreto, con causas, costos y decisiones posibles.`;";
const fixed = "const opener = DIRECT_OPENINGS[intent];\n  const opening = typeof opener === 'function' ? opener(post.title) : `${post.title} se entiende mejor cuando se observa como un problema concreto, con causas, costos y decisiones posibles.`;";

if (!source.includes(broken) && !source.includes("const opener = DIRECT_OPENINGS[intent];")) {
  throw new Error('No se encontró la línea esperada del reescritor.');
}

source = source.replace(broken, fixed);
fs.writeFileSync(file, source);
console.log('Reescritor corregido: las funciones de apertura se ejecutan con el título del artículo.');

import fs from 'node:fs';

const file='scripts/recrear-publicaciones-por-intencion.mjs';
let source=fs.readFileSync(file,'utf8');

source=source.replace(
  /<section class="faq-box"><h2>Preguntas frecuentes<\/h2><div class="faq-item"><strong>¿Cuál es el primer paso\?<\/strong><p>Registrar la situación actual y elegir una acción pequeña que pueda comprobarse\.<\/p><\/div><div class="faq-item"><strong>¿Cuánto tiempo hace falta\?<\/strong><p>Depende del tema, pero una semana suele alcanzar para obtener información propia y decidir el ajuste siguiente\.<\/p><\/div><div class="faq-item"><strong>¿Cuándo conviene pedir ayuda\?<\/strong><p>Cuando existen síntomas, lesiones, deudas complejas, riesgo de seguridad o una situación que supera la información general\.<\/p><\/div><\/section>/,
  `<section class="faq-box"><h2>Preguntas frecuentes</h2><div class="faq-item"><strong>¿Cuál es el primer paso?</strong><p>Para “\${esc(post.title)}”, registrá la situación actual y elegí una acción pequeña que pueda comprobarse.</p></div><div class="faq-item"><strong>¿Cuánto tiempo conviene probar?</strong><p>Una semana suele alcanzar para obtener información propia sobre “\${esc(post.title)}” y decidir el ajuste siguiente.</p></div><div class="faq-item"><strong>¿Cuándo conviene pedir ayuda?</strong><p>Buscá orientación cuando “\${esc(post.title)}” involucre síntomas, lesiones, deudas complejas, seguridad o una situación que supera una guía general.</p></div></section>`
);

fs.writeFileSync(file,source);
console.log('Preguntas frecuentes personalizadas por título.');

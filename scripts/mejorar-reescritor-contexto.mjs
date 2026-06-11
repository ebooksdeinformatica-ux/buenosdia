import fs from 'node:fs';
const file='scripts/recrear-publicaciones-por-intencion.mjs';
let s=fs.readFileSync(file,'utf8');

s=s.replace(/function contextParagraph\(post, intent, seed\) \{[\s\S]*?\n\}/,`function contextParagraph(post, intent, seed) {
  const topic = post.title;
  const options = [
    \`Para evaluar “\${topic}”, registrá el punto de partida, el contexto y la consecuencia que querés modificar. Esa observación evita aplicar soluciones generales a un problema mal definido.\`,
    \`La estrategia para “\${topic}” depende del punto de partida, los recursos disponibles y el costo de sostenerla. Una opción simple y repetible suele superar a un plan ideal que dura poco.\`,
    \`No hace falta resolver “\${topic}” en una semana. El objetivo inicial es obtener información propia: qué funciona, qué falla y qué ajuste reduce más fricción.\`
  ];
  return pick(options, seed);
}`);

s=s.replace(/function topicSpecific\(post, intent, index, seed\) \{[\s\S]*?\n\}/,`function topicSpecific(post, intent, index, seed) {
  const topic = post.title;
  const options = [
    \`En “\${topic}”, elegí un cambio observable: tiempo ahorrado, tarea terminada, gasto evitado, síntoma registrado o sesión sostenida.\`,
    \`Anotá el punto de partida de “\${topic}” y revisá el resultado después de varios intentos, no después de un único día.\`,
    \`El cambio relacionado con “\${topic}” debe caber en tu vida actual. Si exige condiciones perfectas, dividilo en una versión más pequeña.\`,
    \`Una señal de mejora en “\${topic}” es depender menos de improvisar y más de un entorno preparado.\`
  ];
  return pick(options, seed, index);
}`);

s=s.replace("[`Día 1: registrá cómo aparece ${topic}.`,`Día 2: eliminá una fricción o distracción.`,`Día 3: prepará una alternativa concreta.`,`Días 4 y 5: repetí la acción mínima.`,`Día 6: compará energía, tiempo o resultado.`,`Día 7: decidí qué mantener.`]","[`Día 1: describí el punto de partida de “${topic}”.`,`Día 2: identificá el obstáculo principal.`,`Día 3: prepará una acción concreta.`,`Días 4 y 5: repetí una versión sostenible.`,`Día 6: compará el resultado con el inicio.`,`Día 7: decidí qué mantener o ajustar.`]");

fs.writeFileSync(file,s);
console.log('Contexto y planes ligados al tema.');

import fs from 'node:fs';
const file='scripts/recrear-publicaciones-por-intencion.mjs';
let s=fs.readFileSync(file,'utf8');
function r(a,b,n){if(s.includes(b))return;if(!s.includes(a))throw new Error(`Falta ${n}`);s=s.replace(a,b);}
r("if (/git|github|web|blog|pagina|seo|adsense/.test(t)) return 'web';","if (/(?:\\bgit\\b|github|\\bweb\\b|blog|pagina|seo|adsense)/.test(t)) return 'web';",'clasificación web');
r("function sourcesHtml(keys = []) {","function sourcesHtml(keys = [], topic = '') {",'firma fuentes');
r('<p>La información es general y no reemplaza una evaluación profesional cuando existe un problema médico, nutricional, físico o financiero concreto.</p>','<p>Estas fuentes permiten verificar y ampliar “${esc(topic)}”. Cuando el tema involucra salud, dinero o seguridad, una guía general no reemplaza asesoramiento profesional.</p>','texto fuentes');
r("const sections = shuffled.map((s, i) => `<h2>${esc(s.heading)}</h2><p>${esc(s.paragraph)}</p><p>${esc(topicSpecific(post, intent, i, seed))}</p>`).join('');","const sections = shuffled.map((s, i) => `<h2>${esc(s.heading)}</h2><p>${esc(`${s.paragraph} ${topicSpecific(post, intent, i, seed)}`)}</p>`).join('');",'secciones');
r("${sourcesHtml(block.sources)}`;","${sourcesHtml(block.sources, post.title)}`;",'llamada fuentes');
fs.writeFileSync(file,s);
console.log('Base del reescritor mejorada.');

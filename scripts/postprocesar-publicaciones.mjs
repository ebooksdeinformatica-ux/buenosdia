import fs from 'node:fs';
import path from 'node:path';

const ROOT = '.';
const SKIP = new Set(['.git', 'node_modules']);

const STATCOUNTER = `<!-- Default Statcounter code for BUENOSDIA
http://https:buenosdia.com -->
<script type="text/javascript">
var sc_project=12058975; 
var sc_invisible=1; 
var sc_security="49f17e11"; 
</script>
<script type="text/javascript"
src="https://www.statcounter.com/counter/counter.js"
async></script>
<noscript><div class="statcounter"><a title="free hit
counter" href="https://statcounter.com/"
target="_blank"><img class="statcounter"
src="https://c.statcounter.com/12058975/0/49f17e11/1/"
alt="free hit counter"
referrerPolicy="no-referrer-when-downgrade"></a></div></noscript>
<!-- End of Statcounter Code -->`;

const replacements = [
  ['Buenosdia.com trabaja estos temas con una idea clara: no escribir para llenar internet, sino para construir una red de textos útiles, humanos y conectados. Cada publicación tiene que dejar una pregunta, una acción o una incomodidad productiva. Si no mueve nada, no sirve.', 'El problema no suele ser no saber qué hacer. El problema suele ser que todo parece demasiado grande, demasiado tarde o demasiado difícil. La salida empieza cuando reducís el problema a una decisión concreta que puedas tomar hoy.'],
  ['<h2>Cómo se conecta con SEO, proyectos y vida diaria</h2>', '<h2>Cómo llevarlo al día de hoy</h2>'],
  ['En términos de SEO moderno, un texto fuerte no es solo largo. Tiene intención, contexto, enlaces internos, lenguaje natural, estructura clara y una respuesta que una persona real puede usar. Por eso cada publicación conecta con otras: para que el lector arme camino, no para encerrarlo en una página suelta.', 'Una idea sirve cuando te deja algo para hacer, no solo algo para asentir con la cabeza. El paso importante es bajarla al día y convertirla en una acción concreta.'],
  ['Eso es SEO para la vida real: intención clara, estructura clara y acción clara.', 'Eso es avance real: una intención clara, un paso concreto y una acción que puedas terminar.'],
  ['¿Por qué se conecta con otros posts?', '¿Cómo sigo después de leer esto?'],
  ['Porque la vida real no viene separada por temas. Tecnología, cuerpo, comida, foco y Matrix se mezclan todos los días.', 'Elegí una acción pequeña, terminala y después sumá una segunda que refuerce la primera.'],
  ['Buscá una publicación relacionada dentro del sitio y seguí el hilo.', 'Elegí una segunda acción que refuerce la primera.']
];

function cleanPublicText(input) {
  let text = input;
  for (const [from, to] of replacements) text = text.split(from).join(to);
  text = text.replace(/Una publicación de buenosdia\.com sobre ([^"<]+?), conectada con [^"<]+?, con mirada práctica, humana y sin relleno\./g, 'Una guía práctica sobre $1, con ideas concretas para entender el problema y empezar a actuar hoy.');
  text = text.replace(/<p>Hay frases que suenan simples hasta que las llevás al día real\. ([\s\S]*?) es una de esas\. No alcanza con entenderla mentalmente: hay que verla en la mañana, en las decisiones chicas, en el cansancio, en el teléfono, en la comida, en la computadora y en la forma en que uno evita o enfrenta lo que tiene pendiente\.<\/p>/g, '<p>$1 puede parecer una idea simple, pero cambia cuando la llevás al día real. El punto no es entenderla de lejos, sino reconocer dónde aparece en tu rutina y qué decisión concreta podés tomar hoy.</p>');
  return text;
}

function removeOldCounters(input) {
  return input
    .replace(/<!-- Default Statcounter code[\s\S]*?<!-- End of Statcounter Code -->/gi, '')
    .replace(/<script[^>]*>\s*var\s+sc_project\s*=\s*\d+;[\s\S]*?sc_security\s*=\s*["'][^"']+["'];?\s*<\/script>/gi, '')
    .replace(/<script[^>]*src=["']https:\/\/www\.statcounter\.com\/counter\/counter\.js["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<noscript>[\s\S]*?c\.statcounter\.com[\s\S]*?<\/noscript>/gi, '');
}

function processHtml(file) {
  let html = fs.readFileSync(file, 'utf8');
  html = cleanPublicText(removeOldCounters(html)).trim();
  html = html.includes('</body>')
    ? html.replace('</body>', `${STATCOUNTER}\n</body>`)
    : `${html}\n${STATCOUNTER}\n`;
  fs.writeFileSync(file, html);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) processHtml(full);
  }
}

walk(ROOT);

if (fs.existsSync('data/posts.json')) {
  const posts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));
  for (const post of posts) post.description = cleanPublicText(post.description || '');
  fs.writeFileSync('data/posts.json', `${JSON.stringify(posts, null, 2)}\n`);
}

console.log('Publicaciones limpiadas y Statcounter 12058975 instalado en todas las páginas HTML.');

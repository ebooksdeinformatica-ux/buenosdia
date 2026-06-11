import fs from 'node:fs';
import path from 'node:path';

const POSTS_DIR = 'posts';
const MIN_WORDS = 850;
const INTERNAL_PATTERNS = [
  /Buenosdia\.com trabaja estos temas/i,
  /Este sitio no separa el contenido/i,
  /Esta publicación (?:está|fue|se encuentra|conecta)/i,
  /cómo se conecta con SEO/i,
  /en términos de SEO/i,
  /SEO moderno/i,
  /SEO para la vida real/i,
  /por qué se conecta con otros posts/i,
  /construir una red de textos/i,
  /identidad editorial/i,
  /nuestra estrategia/i,
  /nuestro SEO/i,
  /cómo hacemos/i,
  /generador de publicaciones/i
];

function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text) {
  return text.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g) || [];
}

function paragraphSet(html) {
  return new Set(
    [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => plainText(m[1]).toLowerCase())
      .filter(p => p.length > 80)
  );
}

const errors = [];
const warnings = [];
const files = fs.existsSync(POSTS_DIR)
  ? fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html')).sort()
  : [];

if (!files.length) errors.push('No se encontraron publicaciones HTML.');

const paragraphsByFile = new Map();

for (const file of files) {
  const full = path.join(POSTS_DIR, file);
  const html = fs.readFileSync(full, 'utf8');
  const text = plainText(html);
  const count = words(text).length;
  paragraphsByFile.set(file, paragraphSet(html));

  if (count < MIN_WORDS) errors.push(`${file}: solo ${count} palabras; mínimo ${MIN_WORDS}.`);
  if (!/<link rel="canonical" href="https:\/\/www\.buenosdia\.com\/posts\//i.test(html)) errors.push(`${file}: falta canonical correcto.`);
  if (!/"@type":"BlogPosting"/.test(html)) errors.push(`${file}: falta JSON-LD BlogPosting.`);
  if (!/max-image-preview:large/.test(html)) errors.push(`${file}: falta max-image-preview:large.`);
  if (!/sc_project=12058975/.test(html) || !/sc_security="49f17e11"/.test(html)) errors.push(`${file}: falta Statcounter oficial.`);
  if (/sc_project=13215021/.test(html)) errors.push(`${file}: conserva contador Statcounter viejo.`);
  if (!/<h1 class="post-title">[^<]{15,}<\/h1>/.test(html)) errors.push(`${file}: H1 ausente o demasiado corto.`);
  if (!/<meta name="description" content="[^\"]{90,170}"/.test(html)) warnings.push(`${file}: meta description fuera del rango recomendado.`);
  if (!/<section class="related-box">/.test(html)) warnings.push(`${file}: falta bloque relacionado.`);
  if (!/data-value-block="true"/.test(html)) warnings.push(`${file}: falta bloque de valor específico de categoría.`);

  for (const pattern of INTERNAL_PATTERNS) {
    if (pattern.test(text)) errors.push(`${file}: contiene cocina interna: ${pattern}.`);
  }
}

const shared = new Map();
for (const [file, set] of paragraphsByFile) {
  for (const paragraph of set) {
    if (!shared.has(paragraph)) shared.set(paragraph, []);
    shared.get(paragraph).push(file);
  }
}

for (const [paragraph, owners] of shared) {
  if (owners.length >= 20) {
    errors.push(`Párrafo repetido en ${owners.length} publicaciones: "${paragraph.slice(0, 110)}..."`);
  } else if (owners.length >= 8) {
    warnings.push(`Párrafo repetido en ${owners.length} publicaciones: "${paragraph.slice(0, 110)}..."`);
  }
}

console.log(`Auditadas ${files.length} publicaciones.`);
if (errors.length) {
  console.error(`Errores: ${errors.length}`);
  for (const error of errors.slice(0, 80)) console.error(`ERROR: ${error}`);
  console.log(`Advertencias adicionales: ${warnings.length}`);
  process.exit(1);
}

console.log(`Advertencias: ${warnings.length}`);
for (const warning of warnings.slice(0, 40)) console.warn(`WARN: ${warning}`);
console.log('Auditoría aprobada: contenido extenso, limpio y técnicamente completo.');

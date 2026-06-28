import fs from 'node:fs';

const posts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));
const active = posts.filter(post => post.status === 'published');
const failures = [];

function readPost(post) {
  const filePath = post.url.replace(/^\//, '');
  if (!fs.existsSync(filePath)) {
    failures.push(`${post.title}: no existe ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headings(html) {
  return [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(match => stripHtml(match[1]).toLowerCase());
}

function paragraphs(html) {
  return [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)].map(match => stripHtml(match[1])).filter(Boolean);
}

function signature(post, html) {
  const ps = paragraphs(html);
  const hs = headings(html);
  const first = ps.slice(0, 4).join(' ').toLowerCase();
  const last = ps.slice(-3).join(' ').toLowerCase();
  const avgParagraphWords = ps.length ? Math.round(ps.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / ps.length) : 0;
  const markerWords = ['telefono','pantalla','mesa','taza','ventana','cuerpo','ruido','mañana','cocina','automatico','claridad','dia'];
  const markers = markerWords.filter(word => stripHtml(html).toLowerCase().includes(word));

  return {
    title: post.title,
    format: post.format || '',
    h2Count: hs.length,
    headings: hs,
    paragraphCount: ps.length,
    avgParagraphWords,
    first,
    last,
    markers
  };
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(item => setB.has(item)).length;
  const union = new Set([...setA, ...setB]).size || 1;
  return intersection / union;
}

function words(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñáéíóúü]+/gi, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
}

const signatures = active.map(post => signature(post, readPost(post)));

for (let i = 0; i < signatures.length; i += 1) {
  const current = signatures[i];
  const previous = signatures.slice(Math.max(0, i - 3), i);

  for (const older of previous) {
    const openingSimilarity = jaccard(words(current.first), words(older.first));
    const closingSimilarity = jaccard(words(current.last), words(older.last));
    const markerSimilarity = jaccard(current.markers, older.markers);
    const h2Delta = Math.abs(current.h2Count - older.h2Count);
    const paragraphDelta = Math.abs(current.paragraphCount - older.paragraphCount);
    const sameFormat = current.format && current.format === older.format;

    if (sameFormat) {
      failures.push(`${current.title}: repite formato cercano con ${older.title} (${current.format})`);
    }

    if (openingSimilarity > 0.34 && markerSimilarity > 0.55) {
      failures.push(`${current.title}: apertura demasiado parecida a ${older.title}`);
    }

    if (closingSimilarity > 0.34 && markerSimilarity > 0.55) {
      failures.push(`${current.title}: cierre demasiado parecido a ${older.title}`);
    }

    if (h2Delta <= 1 && paragraphDelta <= 4 && markerSimilarity > 0.7) {
      failures.push(`${current.title}: estructura y simbolos demasiado cercanos a ${older.title}`);
    }
  }
}

for (const sig of signatures) {
  if (sig.h2Count > 9) failures.push(`${sig.title}: demasiados H2, revisar molde de secciones`);
  if (sig.h2Count >= 5 && sig.avgParagraphWords >= 45 && sig.avgParagraphWords <= 75) {
    failures.push(`${sig.title}: ritmo de parrafos demasiado uniforme, revisar respiracion`);
  }
}

if (failures.length) {
  console.error('Auditoria de variedad editorial fallo:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Auditoria de variedad editorial OK.');

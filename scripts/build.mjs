import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.buenosdia.com';
const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DATA_DIR = path.join(ROOT, 'data');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const POSTS_JSON = path.join(DATA_DIR, 'posts.json');

if (!fs.existsSync(POSTS_DIR)) {
  console.error('No existe la carpeta /posts');
  process.exit(1);
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html'));

const posts = files.map(file => {
  const fullPath = path.join(POSTS_DIR, file);
  const html = fs.readFileSync(fullPath, 'utf8');

  const title =
    match(html, /<title>(.*?)<\/title>/is) ||
    match(html, /<h1[^>]*>(.*?)<\/h1>/is) ||
    cleanSlug(file.replace('.html', ''));

  const description =
    match(html, /<meta\s+name="description"\s+content="(.*?)"\s*\/?>/is) ||
    match(html, /<p[^>]*class="lead"[^>]*>(.*?)<\/p>/is) ||
    'Reflexión en buenosdia.com';

  const keywords = match(html, /<meta\s+name="keywords"\s+content="(.*?)"\s*\/?>/is) || '';
  const articleDate = match(html, /"datePublished"\s*:\s*"(.*?)"/is) || today();
  const lead = match(html, /<p[^>]*class="lead"[^>]*>(.*?)<\/p>/is) || '';
  const articleHtml = match(html, /<article[^>]*>([\s\S]*?)<\/article>/is) || '';

  return {
    title: strip(title.replace(/\|\s*buenosdia\.com/i, '').trim()),
    description: strip(description),
    lead: strip(lead),
    body: strip(articleHtml),
    tags: keywords.split(',').map(normalizeTag).filter(Boolean).slice(0, 10),
    date: articleDate.slice(0, 10),
    slug: file.replace('.html', ''),
    url: `/posts/${file}`,
    file,
    fullPath,
    html
  };
}).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'));

const exportedPosts = posts.map(post => ({
  title: post.title,
  description: post.description,
  tags: post.tags,
  date: post.date,
  slug: post.slug,
  url: post.url,
  related: computeRelatedPosts(post, posts, 4).map(p => ({
    title: p.title,
    description: shortDescription(p.description, 140),
    url: p.url,
    slug: p.slug
  }))
}));

fs.writeFileSync(POSTS_JSON, JSON.stringify(exportedPosts, null, 2), 'utf8');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today()}</lastmod>\n  </url>\n${posts.map(post => `  <url>\n    <loc>${SITE_URL}${post.url}</loc>\n    <lastmod>${post.date}</lastmod>\n  </url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');

for (const post of posts) {
  const related = computeRelatedPosts(post, posts, 4);
  const relatedHtml = renderRelatedSection(related);
  let updatedHtml = post.html;

  const relatedSectionRegex = /<section class="card"[^>]*>\s*<h2[^>]*class="section-title"[^>]*>Seguí leyendo<\/h2>[\s\S]*?<\/section>/i;
  const faqSectionRegex = /<section class="card faq"[^>]*>/i;

  if (relatedSectionRegex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(relatedSectionRegex, relatedHtml);
  } else if (faqSectionRegex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(faqSectionRegex, `${relatedHtml}\n\n    <section class="card faq"`);
  }

  fs.writeFileSync(post.fullPath, updatedHtml, 'utf8');
}

console.log(`Generados ${posts.length} posts en data/posts.json, sitemap.xml e interlinks automáticos.`);

function renderRelatedSection(relatedPosts) {
  if (!relatedPosts.length) {
    return `    <section class="card" aria-labelledby="interlinks-post">\n      <h2 id="interlinks-post" class="section-title">Seguí leyendo</h2>\n      <div class="links-grid">\n        <a class="related" href="/">\n          <strong>Volver al inicio</strong>\n          <span>Explorá más textos reales, humanos y respirados en buenosdia.com.</span>\n        </a>\n      </div>\n    </section>`;
  }

  return `    <section class="card" aria-labelledby="interlinks-post">\n      <h2 id="interlinks-post" class="section-title">Seguí leyendo</h2>\n      <div class="links-grid">\n${relatedPosts.map(post => `        <a class="related" href="${post.url}">\n          <strong>${escapeHtml(post.title)}</strong>\n          <span>${escapeHtml(shortDescription(post.description, 130))}</span>\n        </a>`).join('\n\n')}\n      </div>\n    </section>`;
}

function computeRelatedPosts(currentPost, allPosts, limit = 4) {
  const currentTags = new Set((currentPost.tags || []).map(normalizeTag));
  const currentTokens = tokenize(`${currentPost.title} ${currentPost.description} ${currentPost.lead} ${currentPost.body}`);

  return allPosts
    .filter(post => post.slug !== currentPost.slug)
    .map(post => {
      const postTags = new Set((post.tags || []).map(normalizeTag));
      const postTokens = tokenize(`${post.title} ${post.description} ${post.lead} ${post.body}`);
      const sharedTags = intersectionSize(currentTags, postTags);
      const sharedTokens = intersectionSize(currentTokens, postTokens);
      const score = (sharedTags * 12) + (sharedTokens * 2) + (post.date === currentPost.date ? 1 : 0);
      return { ...post, _score: score };
    })
    .filter(post => post._score > 0)
    .sort((a, b) => b._score - a._score || b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'))
    .slice(0, limit);
}

function tokenize(str = '') {
  const stopwords = new Set([
    'de','la','el','los','las','y','en','a','un','una','unos','unas','con','sin','por','para','que','del','al','se','me','mi','tu','te','lo','le','les','su','sus','como','pero','porque','ya','muy','mas','hay','es','son','fue','ser','si','no','yo','vos','este','esta','estos','estas','eso','esa','esos','esas','cada','entre','sobre','cuando','donde','todo','toda','todos','todas','solo','sola','aunque','tambien','hasta','desde','otra','otro','otras','otros','dia','dias','manana','mañana','buenos','buena','buen','hoy','ayer','igual','tener','tenes','tenés','queda','quedar','cosas','vida','real','reales'
  ]);

  return new Set(
    normalizeText(str)
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word))
  );
}

function normalizeText(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTag(tag = '') {
  return normalizeText(tag).replace(/\s+/g, ' ').trim();
}

function intersectionSize(a, b) {
  let count = 0;
  for (const item of a) if (b.has(item)) count++;
  return count;
}

function shortDescription(text = '', max = 140) {
  const clean = strip(text);
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/[\s,;:.!?-]+$/g, '') + '…';
}

function match(str, regex) {
  const m = str.match(regex);
  return m?.[1]?.trim() || '';
}

function strip(str) {
  return String(str)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanSlug(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

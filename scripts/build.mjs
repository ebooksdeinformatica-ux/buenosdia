import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.buenosdia.com';
const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DATA_DIR = path.join(ROOT, 'data');
const TAGS_DIR = path.join(ROOT, 'tags');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const POSTS_JSON = path.join(DATA_DIR, 'posts.json');

if (!fs.existsSync(POSTS_DIR)) {
  console.error('No existe la carpeta /posts');
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });
if (fs.existsSync(TAGS_DIR)) fs.rmSync(TAGS_DIR, { recursive: true, force: true });
fs.mkdirSync(TAGS_DIR, { recursive: true });

const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.html'));

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
  const metaTags = keywords.split(',').map(normalizeTag).filter(Boolean);
  const visibleTags = getVisibleTags(html).map(normalizeTag).filter(Boolean);
  const tags = [...new Set([...metaTags, ...visibleTags])];

  return {
    title: strip(title.replace(/\|\s*buenosdia\.com/i, '').trim()),
    description: strip(description),
    lead: strip(lead),
    body: strip(articleHtml),
    tags,
    date: articleDate.slice(0, 10),
    slug: file.replace('.html', ''),
    url: `/posts/${file}`,
    fullPath,
    html
  };
}).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'));

const tagMap = buildTagMap(posts);

for (const post of posts) {
  const related = computeRelatedPosts(post, posts, 4);
  let updatedHtml = post.html;
  const relatedHtml = renderRelatedSection(related);

  const relatedSectionRegex = /<section class="card"[^>]*aria-labelledby="interlinks-post"[^>]*>[\s\S]*?<\/section>/i;
  const faqSectionRegex = /<section class="card faq"[^>]*>/i;

  if (relatedSectionRegex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(relatedSectionRegex, relatedHtml);
  } else if (faqSectionRegex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(faqSectionRegex, `${relatedHtml}\n\n    <section class="card faq"`);
  }

  updatedHtml = patchPostHtml(updatedHtml);
  fs.writeFileSync(post.fullPath, updatedHtml, 'utf8');
}

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

patchIndexHtml();
renderTagPages(tagMap);
write404Page(tagMap);
writeSitemap(posts, tagMap);

console.log(`Generados ${posts.length} posts, ${Object.keys(tagMap).length} páginas de etiquetas, data/posts.json y sitemap.xml.`);

function patchPostHtml(html) {
  let out = html;
  out = out.replace(/href="\/#etiquetas"/g, 'href="/tags/"');

  out = out.replace(/(<section[^>]*aria-labelledby="tags-post"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));
  out = out.replace(/(<section[^>]*class="[^"]*tags-box[^"]*"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));

  return out;
}

function rewriteTagLinks(sectionHtml) {
  return sectionHtml.replace(/<a([^>]*)href="[^"]*"([^>]*)>(.*?)<\/a>/gis, (full, before, after, inner) => {
    const tagText = strip(inner);
    const slug = slugify(tagText);
    if (!slug) return full;
    return `<a${before}href="/tags/${slug}.html"${after}>${inner}</a>`;
  });
}

function getVisibleTags(html = '') {
  const sections = [];
  const oldSections = [...html.matchAll(/<section[^>]*aria-labelledby="tags-post"[^>]*>([\s\S]*?)<\/section>/gis)];
  const newSections = [...html.matchAll(/<section[^>]*class="[^"]*tags-box[^"]*"[^>]*>([\s\S]*?)<\/section>/gis)];
  sections.push(...oldSections.map(match => match[1]));
  sections.push(...newSections.map(match => match[1]));

  const source = sections.join(' ');
  if (!source.trim()) return [];

  const tagsContainers = [...source.matchAll(/<div[^>]*class="[^"]*tags[^"]*"[^>]*>([\s\S]*?)<\/div>/gis)];
  const tagsSource = tagsContainers.length ? tagsContainers.map(match => match[1]).join(' ') : source;
  const anchors = [...tagsSource.matchAll(/<a[^>]*>(.*?)<\/a>/gis)];
  return anchors.map(match => strip(match[1])).filter(Boolean);
}

function buildTagMap(posts) {
  const map = {};
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const normalized = normalizeTag(tag);
      if (!normalized) continue;
      const slug = slugify(normalized);
      if (!slug) continue;
      if (!map[slug]) {
        map[slug] = { slug, name: tag, count: 0, posts: [] };
      }
      map[slug].count += 1;
      map[slug].posts.push({
        title: post.title,
        description: post.description,
        date: post.date,
        url: post.url,
        slug: post.slug
      });
    }
  }

  for (const tag of Object.values(map)) {
    tag.posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'));
  }
  return map;
}

function renderTagPages(tagMap) {
  const tags = Object.values(tagMap).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));

  const tagsIndexHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Etiquetas | buenosdia.com</title>
  <meta name="description" content="Explorá todas las etiquetas de buenosdia.com y entrá a las publicaciones relacionadas con cada tema.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${SITE_URL}/tags/">
  <style>${sharedTagPageCss()}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">buenosdia.com</a>
      <nav>
        <a href="/">Inicio</a>
        <a href="/#publicaciones">Publicaciones</a>
        <a href="/tags/" aria-current="page">Etiquetas</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Etiquetas</p>
        <h1>Todas las etiquetas</h1>
        <p>Entrá por tema y encontrá las publicaciones relacionadas. Cada etiqueta tiene su propia página.</p>
      </section>
      <section class="card">
        <div class="tag-cloud">
          ${tags.map(tag => `<a class="tag" href="/tags/${tag.slug}.html">${escapeHtml(tag.name)} <span>${tag.count}</span></a>`).join('')}
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(TAGS_DIR, 'index.html'), tagsIndexHtml, 'utf8');

  for (const tag of tags) {
    const pageHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(tag.name)} | Etiquetas | buenosdia.com</title>
  <meta name="description" content="Leé las publicaciones de buenosdia.com relacionadas con ${escapeHtml(tag.name)}.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${SITE_URL}/tags/${tag.slug}.html">
  <style>${sharedTagPageCss()}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">buenosdia.com</a>
      <nav>
        <a href="/">Inicio</a>
        <a href="/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Etiqueta</p>
        <h1>${escapeHtml(tag.name)}</h1>
        <p>${tag.count} publicación${tag.count === 1 ? '' : 'es'} relacionadas con este tema.</p>
      </section>
      <section class="card">
        <div class="tag-cloud small">
          ${tags.map(item => `<a class="tag${item.slug === tag.slug ? ' active' : ''}" href="/tags/${item.slug}.html">${escapeHtml(item.name)} <span>${item.count}</span></a>`).join('')}
        </div>
      </section>
      <section class="posts-grid">
        ${tag.posts.map(post => `<article class="post-card"><h2>${escapeHtml(post.title)}</h2><p>${escapeHtml(post.description)}</p><a class="read-link" href="${post.url}">Leer publicación →</a></article>`).join('')}
      </section>
    </main>
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(TAGS_DIR, `${tag.slug}.html`), pageHtml, 'utf8');
  }
}

function patchIndexHtml() {
  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf8');

  html = html.replace('<a href="#etiquetas">Etiquetas</a>', '<a href="/tags/">Etiquetas</a>');

  const scriptRegex = /<script>[\s\S]*?loadPosts\(\);\s*<\/script>/i;
  const script = `<script>
    async function loadPosts() {
      const postsList = document.getElementById('postsList');
      const tagCloud = document.getElementById('tagCloud');

      try {
        const res = await fetch('/data/posts.json?v=' + Date.now());
        const posts = await res.json();

        if (!Array.isArray(posts) || posts.length === 0) {
          postsList.innerHTML = '<div class="empty">Todavía no hay publicaciones visibles.</div>';
          tagCloud.innerHTML = '<div class="empty">Todavía no hay etiquetas.</div>';
          return;
        }

        posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        postsList.innerHTML = posts.map(post =>
          '<article class="post-card">' +
            '<h3>' + escapeHtml(post.title || 'Sin título') + '</h3>' +
            '<p>' + escapeHtml(post.description || 'Sin descripción.') + '</p>' +
            '<div class="tags">' +
              ((post.tags || []).slice(0, 6).map(tag => '<a class="tag" href="/tags/' + slugify(tag) + '.html">' + escapeHtml(tag) + '</a>').join('')) +
            '</div>' +
            '<a class="read-link" href="' + post.url + '">Leer publicación →</a>' +
          '</article>'
        ).join('');

        const counts = {};
        posts.forEach(post => {
          (post.tags || []).forEach(tag => {
            const key = String(tag || '').trim();
            if (!key) return;
            counts[key] = (counts[key] || 0) + 1;
          });
        });

        const sortedTags = Object.entries(counts)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es', { sensitivity: 'base' }))
          .slice(0, 30);

        tagCloud.innerHTML = sortedTags.length
          ? sortedTags.map(([tag, count]) => '<a class="tag" href="/tags/' + slugify(tag) + '.html" title="Ver publicaciones con la etiqueta ' + escapeHtml(tag) + '">' + escapeHtml(tag) + ' (' + count + ')</a>').join('')
          : '<div class="empty">Todavía no hay etiquetas.</div>';
      } catch (err) {
        postsList.innerHTML = '<div class="empty">No se pudieron cargar las publicaciones.</div>';
        tagCloud.innerHTML = '<div class="empty">No se pudieron cargar las etiquetas.</div>';
      }
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function slugify(str) {
      return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    loadPosts();
  </script>`;

  if (scriptRegex.test(html)) {
    html = html.replace(scriptRegex, script);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
}



function write404Page(tagMap) {
  const knownTags = Object.values(tagMap).map(tag => tag.slug).sort();
  const knownTagVariants = {};
  for (const tag of Object.values(tagMap)) {
    const variants = new Set([tag.slug, tag.name, normalizeTag(tag.name)]);
    for (const variant of variants) {
      const key = slugify(variant);
      if (key) knownTagVariants[key] = tag.slug;
    }
  }

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Página no encontrada | buenosdia.com</title>
  <meta name="robots" content="noindex,follow">
  <style>${sharedTagPageCss()}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">buenosdia.com</a>
      <nav>
        <a href="/">Inicio</a>
        <a href="/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">404</p>
        <h1>Esta página no existe</h1>
        <p id="message">Estamos revisando si el enlace corresponde a una etiqueta con un slug mal formado.</p>
      </section>
      <section class="card">
        <p><a class="read-link" href="/">Volver al inicio</a></p>
      </section>
    </main>
  </div>
  <script>
    const knownTagVariants = ${JSON.stringify(knownTagVariants)};
    const message = document.getElementById('message');

    function slugify(str) {
      return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const path = window.location.pathname || '/';
    const tagMatch = path.match(/^\/tags\/(.+?)(?:\.html)?$/i);
    if (tagMatch) {
      const decoded = decodeURIComponent(tagMatch[1]);
      const candidate = slugify(decoded);
      const canonical = knownTagVariants[candidate];
      if (canonical) {
        message.textContent = 'Redirigiendo a la etiqueta correcta…';
        window.location.replace('/tags/' + canonical + '.html');
      }
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(ROOT, '404.html'), html, 'utf8');
}

function writeSitemap(posts, tagMap) {
  const tagUrls = Object.values(tagMap).map(tag => `  <url>\n    <loc>${SITE_URL}/tags/${tag.slug}.html</loc>\n    <lastmod>${today()}</lastmod>\n  </url>`);
  const postUrls = posts.map(post => `  <url>\n    <loc>${SITE_URL}${post.url}</loc>\n    <lastmod>${post.date}</lastmod>\n  </url>`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today()}</lastmod>\n  </url>\n  <url>\n    <loc>${SITE_URL}/tags/</loc>\n    <lastmod>${today()}</lastmod>\n  </url>\n${postUrls.join('\n')}\n${tagUrls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
}

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

function sharedTagPageCss() {
  return `:root{--bg:#f6f3ee;--card:#fffdfa;--text:#171717;--muted:#667085;--line:#e7e1d8;--pill:#f5f5f4;--shadow:0 10px 25px rgba(0,0,0,.05);--radius:22px;--max:1100px}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--text)}.wrap{max-width:var(--max);margin:0 auto;padding:28px 20px 70px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:22px}.brand{text-decoration:none;color:#111827;font-weight:700;font-size:1.2rem}nav a{text-decoration:none;color:var(--muted);margin-left:20px;font-size:1rem}.hero,.card,.post-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.hero{padding:34px;margin-bottom:22px}.hero h1{margin:0 0 12px;font-size:clamp(2rem,5vw,3.5rem);line-height:1.02;letter-spacing:-.05em}.hero p{margin:0;color:#475467;line-height:1.65;font-size:1.08rem}.eyebrow{color:var(--muted);font-size:1rem;margin-bottom:14px}.card{padding:24px}.tag-cloud{display:flex;flex-wrap:wrap;gap:12px}.tag{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--pill);color:#475467;border-radius:999px;padding:10px 14px;font-size:.98rem;text-decoration:none}.tag span{display:inline-block;background:#fff;border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:.86rem}.tag.active{background:#111827;color:#fff}.tag.active span{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);color:#fff}.posts-grid{display:grid;gap:18px;margin-top:22px}.post-card{padding:26px}.post-card h2{margin:0 0 10px;font-size:1.45rem;line-height:1.2;letter-spacing:-.03em}.post-card p{margin:0 0 18px;color:#475467;font-size:1.02rem;line-height:1.65}.read-link{text-decoration:none;color:#111827;font-weight:700}.read-link:hover{text-decoration:underline}@media (max-width:800px){header{flex-direction:column}nav a{margin:0 18px 0 0}}`;
}

function tokenize(str = '') {
  const stopwords = new Set(['de','la','el','los','las','y','en','a','un','una','unos','unas','con','sin','por','para','que','del','al','se','me','mi','tu','te','lo','le','les','su','sus','como','pero','porque','ya','muy','mas','hay','es','son','fue','ser','si','no','yo','vos','este','esta','estos','estas','eso','esa','esos','esas','cada','entre','sobre','cuando','donde','todo','toda','todos','todas','solo','sola','aunque','tambien','hasta','desde','otra','otro','otras','otros','dia','dias','manana','mañana','buenos','buena','buen','hoy','ayer','igual','tener','tenes','tenés','queda','quedar','cosas','vida','real','reales']);
  return new Set(normalizeText(str).split(/\s+/).filter(word => word.length > 2 && !stopwords.has(word)));
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

function slugify(str = '') {
  return normalizeText(str).replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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
  const result = str.match(regex);
  return result?.[1]?.trim() || '';
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
  return str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

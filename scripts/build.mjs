import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.buenosdia.com';
const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DATA_DIR = path.join(ROOT, 'data');
const TAGS_DIR = path.join(ROOT, 'tags');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const POSTS_JSON = path.join(DATA_DIR, 'posts.json');
const CONTACT_URL = 'https://instagram.com/https_404_3rr0r';
const CONTACT_HANDLE = '@https_404_3rr0r';
const ADSENSE_SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267" crossorigin="anonymous"></script>`;
const STATCOUNTER_SNIPPET = `<!-- Default Statcounter code for Buenos Dia https://www.buenosdia.com/ -->
<script type="text/javascript">
var sc_project=13215021; 
var sc_invisible=1; 
var sc_security="4ef10514"; 
</script>
<script type="text/javascript"
src="https://www.statcounter.com/counter/counter.js" async></script>
<noscript><div class="statcounter"><a title="Web Analytics Made Easy -
Statcounter" href="https://statcounter.com/" target="_blank"><img
class="statcounter" src="https://c.statcounter.com/13215021/0/4ef10514/1/"
alt="Web Analytics Made Easy - Statcounter"
referrerPolicy="no-referrer-when-downgrade"></a></div></noscript>
<!-- End of Statcounter Code -->`;

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
const featuredPosts = computeFeaturedPosts(posts, 8);

for (const post of posts) {
  let updatedHtml = cleanupLegacyAutoSections(post.html);
  updatedHtml = patchPostHtml(updatedHtml, post, posts, featuredPosts);
  updatedHtml = injectAdsense(updatedHtml);
  updatedHtml = injectStatcounter(updatedHtml);
  fs.writeFileSync(post.fullPath, updatedHtml, 'utf8');
}

const exportedPosts = posts.map(post => ({
  title: post.title,
  description: post.description,
  tags: post.tags,
  tagSlugs: Object.fromEntries((post.tags || []).map(tag => [tag, (tagMap[slugify(tag)] && tagMap[slugify(tag)].slug) || slugify(tag)])),
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

patchIndexHtml(tagMap);
renderTagPages(tagMap);
write404Page(tagMap);
writeSitemap(posts, tagMap);

console.log(`Generados ${posts.length} posts, ${Object.keys(tagMap).length} páginas de etiquetas, data/posts.json y sitemap.xml.`);

function patchPostHtml(html, currentPost, allPosts, featuredPosts) {
  let out = html;
  out = cleanupLegacyAutoSections(out);
  out = out.replace(/href="\/#etiquetas"/g, 'href="/tags/"');

  out = out.replace(/(<section[^>]*aria-labelledby="tags-post"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));
  out = out.replace(/(<section[^>]*class="[^"]*tags-box[^"]*"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));
  out = out.replace(/(<section[^>]*class="tags"[^>]*aria-label="Etiquetas"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));

  out = out.replace(/<nav([^>]*)>[\s\S]*?<\/nav>/i, `<nav$1>
        <a href="/">Inicio</a>
        <a href="https://www.buenosdia.com/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
        <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contacto</a>
      </nav>`);

  out = out.replace(/<div class="footer-links">[\s\S]*?<\/div>/i, `<div class="footer-links">
        <a href="https://www.buenosdia.com/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
        <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a>
      </div>`);

  out = out.replace(/<div class="contact-strip">[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<footer([^>]*)>([\s\S]*?)<\/footer>/i, (full, attrs, inner) => `<footer${attrs}>${inner}</footer>
  <div class="contact-strip">Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a></div>`);

  if (!/\.contact-strip\s*\{/i.test(out) || !/\.auto-posts-grid\s*\{/i.test(out)) {
    out = out.replace(/<\/style>/i, `
    .contact-strip{margin:18px auto 0;max-width:var(--max,860px);padding:16px 18px;border:1px solid var(--line,#e9e9e9);border-radius:16px;background:var(--soft,#f7f7f7);color:var(--muted,#666)}
    .contact-strip a{color:var(--text,#111);font-weight:700;text-decoration:none}
    .contact-strip a:hover{text-decoration:underline}
    .auto-discovery{margin:24px 0}
    .auto-block-title{margin:0 0 8px;font-size:1.18rem;line-height:1.2}
    .auto-block-sub{margin:0 0 14px;color:var(--muted,#666);font-size:14px;line-height:1.6}
    .auto-posts-grid{display:grid;gap:12px}
    .auto-post-card{display:block;padding:14px 16px;border:1px solid var(--line,#e9e9e9);border-radius:14px;background:#fff;text-decoration:none;color:inherit}
    .auto-post-card strong{display:block;font-size:15px;line-height:1.35;margin-bottom:6px}
    .auto-post-card span{display:block;color:var(--muted,#666);font-size:14px;line-height:1.55}
    .auto-post-card em{display:block;color:var(--muted,#666);font-size:12px;font-style:normal;letter-spacing:.02em;text-transform:uppercase;margin-bottom:6px}
    .auto-post-card:hover{border-color:#d8d8d8;transform:translateY(-1px);transition:all .18s ease}
    @media (min-width:760px){.auto-posts-grid{grid-template-columns:1fr 1fr}}
  </style>`);
  }

  const latestHtml = renderAutoSection('ultimas-publicaciones-auto', 'Últimas 5 publicaciones', 'Los textos más nuevos del sitio, en orden.', getLatestPosts(currentPost, allPosts, 5));
  const featuredHtml = renderAutoSection('destacadas-publicaciones-auto', 'Más destacadas', 'Una selección automática del sitio para seguir navegando.', getFeaturedPostsForPost(currentPost, featuredPosts, allPosts, 5));
  const autoBlocks = `\n\n    ${featuredHtml}\n\n    ${latestHtml}`;

  const faqRegex = /(<section[^>]*class="[^"]*\bfaq\b[^"]*"[^>]*>[\s\S]*?<\/section>)/i;
  if (faqRegex.test(out)) {
    out = out.replace(faqRegex, `$1${autoBlocks}`);
  } else if (/<\/main>/i.test(out)) {
    out = out.replace(/<\/main>/i, `${autoBlocks}\n  </main>`);
  }

  return out;
}

function cleanupLegacyAutoSections(html = '') {
  let out = html;
  const patterns = [
    /<section class="card"[^>]*aria-labelledby="interlinks-post"[^>]*>[\s\S]*?<\/section>\s*/gi,
    /<section[^>]*data-auto-block="[^"]+"[^>]*>[\s\S]*?<\/section>\s*/gi,
    /<section[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?(Seguí leyendo|Moverse por la red|Moverse por la web|Último y destacado, sin salirte del hilo|Encontrá rápido las publicaciones más recientes y una selección destacada para seguir leyendo\.|Explora|Para descubrir|Descubri más|Descubrí más)[\s\S]*?<\/section>\s*/gi
  ];
  for (const pattern of patterns) out = out.replace(pattern, '');
  return out;
}

function injectAdsense(html = '') {
  if (html.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) return html;
  return html.replace(/<\/head>/i, `\n  ${ADSENSE_SNIPPET}\n</head>`);
}

function injectStatcounter(html = '') {
  if (html.includes('statcounter.com/counter/counter.js')) return html;
  return html.replace(/<\/body>/i, `\n\n${STATCOUNTER_SNIPPET}\n</body>`);
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
  const results = [];
  const patterns = [
    /<section[^>]*aria-labelledby="tags-post"[^>]*>([\s\S]*?)<\/section>/gis,
    /<section[^>]*class="[^"]*tags-box[^"]*"[^>]*>([\s\S]*?)<\/section>/gis,
    /<section[^>]*class="tags"[^>]*aria-label="Etiquetas"[^>]*>([\s\S]*?)<\/section>/gis
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const chunk = match[1] || '';
      for (const a of chunk.matchAll(/<a[^>]*>(.*?)<\/a>/gis)) {
        const text = strip(a[1]);
        if (text) results.push(text);
      }
    }
  }

  return results;
}

function buildTagMap(posts) {
  const map = {};
  const forbidden = new Set(['inicio','publicaciones','etiquetas','contacto','buenosdia com','buenosdia.com']);
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const normalized = normalizeTag(tag);
      if (!normalized || forbidden.has(normalized)) continue;
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
  const scrollClass = tags.length > 20 ? ' tag-cloud-scroll' : '';

  let tagsIndexHtml = `<!doctype html>
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
        <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contacto</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Etiquetas</p>
        <h1>Todas las etiquetas</h1>
        <p>Entrá por tema y encontrá las publicaciones relacionadas. Cada etiqueta tiene su propia página.</p>
      </section>
      <section class="card">
        <div class="tag-cloud${scrollClass}">
          ${tags.map(tag => `<a class="tag" href="/tags/${tag.slug}.html">${escapeHtml(tag.name)} <span>${tag.count}</span></a>`).join('')}
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <p>Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a></p>
    </footer>
  </div>
</body>
</html>`;

  tagsIndexHtml = injectAdsense(tagsIndexHtml);
  tagsIndexHtml = injectStatcounter(tagsIndexHtml);
  fs.writeFileSync(path.join(TAGS_DIR, 'index.html'), tagsIndexHtml, 'utf8');

  for (const tag of tags) {
    const tagPostsJson = JSON.stringify(tag.posts);
    let pageHtml = `<!doctype html>
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
        <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contacto</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Etiqueta</p>
        <h1>${escapeHtml(tag.name)}</h1>
        <p>${tag.count} publicación${tag.count === 1 ? '' : 'es'} relacionadas con este tema.</p>
      </section>
      <section class="card">
        <div class="tag-cloud small${scrollClass}">
          ${tags.map(item => `<a class="tag${item.slug === tag.slug ? ' active' : ''}" href="/tags/${item.slug}.html">${escapeHtml(item.name)} <span>${item.count}</span></a>`).join('')}
        </div>
      </section>
      <section class="posts-grid" id="tagPostsList"></section>
      <div class="load-more-wrap">
        <button id="tagLoadMoreBtn" class="load-more" type="button" hidden>Ver más publicaciones</button>
      </div>
      <div id="tagPostsSentinel" aria-hidden="true"></div>
    </main>
    <footer class="site-footer">
      <p>Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a></p>
    </footer>
  </div>
  <script>
    const TAG_POSTS = ${tagPostsJson};
    const INITIAL_TAG_POSTS = 20;
    const TAG_POSTS_BATCH = 20;
    let visibleTagPosts = 0;
    let observerStarted = false;

    function renderTagPosts(reset = false) {
      const postsList = document.getElementById('tagPostsList');
      const loadMoreBtn = document.getElementById('tagLoadMoreBtn');
      if (!postsList) return;

      visibleTagPosts = reset ? Math.min(INITIAL_TAG_POSTS, TAG_POSTS.length) : Math.min(visibleTagPosts + TAG_POSTS_BATCH, TAG_POSTS.length);
      const slice = TAG_POSTS.slice(0, visibleTagPosts);

      postsList.innerHTML = slice.map(post =>
        '<article class="post-card">' +
          '<h2>' + escapeHtml(post.title || 'Sin título') + '</h2>' +
          '<p>' + escapeHtml(post.description || 'Sin descripción.') + '</p>' +
          '<a class="read-link" href="' + post.url + '">Leer publicación →</a>' +
        '</article>'
      ).join('');

      if (loadMoreBtn) loadMoreBtn.hidden = visibleTagPosts >= TAG_POSTS.length;
    }

    function setupInfiniteTagLoad() {
      if (observerStarted) return;
      const sentinel = document.getElementById('tagPostsSentinel');
      if (!sentinel || !('IntersectionObserver' in window)) return;
      observerStarted = true;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && visibleTagPosts < TAG_POSTS.length) renderTagPosts(false);
        });
      }, { rootMargin: '500px 0px 500px 0px' });
      observer.observe(sentinel);
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    renderTagPosts(true);
    const tagLoadMoreBtn = document.getElementById('tagLoadMoreBtn');
    if (tagLoadMoreBtn) tagLoadMoreBtn.addEventListener('click', () => renderTagPosts(false));
    setupInfiniteTagLoad();
  </script>
</body>
</html>`;

    pageHtml = injectAdsense(pageHtml);
    pageHtml = injectStatcounter(pageHtml);
    fs.writeFileSync(path.join(TAGS_DIR, `${tag.slug}.html`), pageHtml, 'utf8');
  }
}

function patchIndexHtml(tagMap) {
  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf8');

  const tagSlugMap = JSON.stringify(Object.fromEntries(Object.values(tagMap).map(tag => [normalizeTag(tag.name), tag.slug])));
  html = html.replace(/const TAG_SLUG_MAP = \{[\s\S]*?\};/i, `const TAG_SLUG_MAP = ${tagSlugMap};`);
  html = injectAdsense(html);
  html = injectStatcounter(html);
  fs.writeFileSync(indexPath, html, 'utf8');
}

function write404Page(tagMap) {
  const knownTagVariants = {};
  for (const tag of Object.values(tagMap)) {
    const variants = new Set([tag.slug, tag.name, normalizeTag(tag.name)]);
    for (const variant of variants) {
      const key = slugify(variant);
      if (key) knownTagVariants[key] = tag.slug;
    }
  }

  let html = `<!doctype html>
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
        <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contacto</a>
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
    <footer class="site-footer">
      <p>Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a></p>
    </footer>
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

  html = injectAdsense(html);
  html = injectStatcounter(html);
  fs.writeFileSync(path.join(ROOT, '404.html'), html, 'utf8');
}

function writeSitemap(posts, tagMap) {
  const tagUrls = Object.values(tagMap).map(tag => `  <url>\n    <loc>${SITE_URL}/tags/${tag.slug}.html</loc>\n    <lastmod>${today()}</lastmod>\n  </url>`);
  const postUrls = posts.map(post => `  <url>\n    <loc>${SITE_URL}${post.url}</loc>\n    <lastmod>${post.date}</lastmod>\n  </url>`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today()}</lastmod>\n  </url>\n  <url>\n    <loc>${SITE_URL}/tags/</loc>\n    <lastmod>${today()}</lastmod>\n  </url>\n${postUrls.join('\n')}\n${tagUrls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
}

function renderAutoSection(blockKey, title, subtitle, items) {
  if (!items.length) return '';
  return `    <section class="card auto-discovery" data-auto-block="${blockKey}">
      <h2 class="auto-block-title">${escapeHtml(title)}</h2>
      <p class="auto-block-sub">${escapeHtml(subtitle)}</p>
      <div class="auto-posts-grid">
${items.map(post => `        <a class="auto-post-card" href="${post.url}">
          <em>${escapeHtml(formatDisplayDate(post.date))}</em>
          <strong>${escapeHtml(post.title)}</strong>
          <span>${escapeHtml(shortDescription(post.description, 120))}</span>
        </a>`).join('\n')}
      </div>
    </section>`;
}

function getLatestPosts(currentPost, allPosts, limit = 5) {
  return allPosts.filter(post => post.slug !== currentPost.slug).slice(0, limit);
}

function computeFeaturedPosts(allPosts, limit = 8) {
  const counts = Object.fromEntries(allPosts.map(post => [post.slug, 0]));
  for (const post of allPosts) {
    for (const related of computeRelatedPosts(post, allPosts, 4)) {
      counts[related.slug] = (counts[related.slug] || 0) + 1;
    }
  }

  return allPosts
    .map(post => ({ ...post, _featuredCount: counts[post.slug] || 0 }))
    .sort((a, b) => b._featuredCount - a._featuredCount || b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'))
    .slice(0, limit);
}

function getFeaturedPostsForPost(currentPost, featuredPosts, allPosts, limit = 5) {
  const selected = featuredPosts.filter(post => post.slug !== currentPost.slug).slice(0, limit);
  if (selected.length >= limit) return selected;
  const fallback = allPosts.filter(post => post.slug !== currentPost.slug && !selected.some(item => item.slug === post.slug));
  return [...selected, ...fallback.slice(0, Math.max(0, limit - selected.length))];
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
  return `:root{--bg:#f6f3ee;--card:#fffdfa;--text:#171717;--muted:#667085;--line:#e7e1d8;--pill:#f5f5f4;--shadow:0 10px 25px rgba(0,0,0,.05);--radius:22px;--max:1100px}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--text)}.wrap{max-width:var(--max);margin:0 auto;padding:28px 20px 70px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:22px}.brand{text-decoration:none;color:#111827;font-weight:700;font-size:1.2rem}nav a{text-decoration:none;color:var(--muted);margin-left:20px;font-size:1rem}.hero,.card,.post-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.hero{padding:34px;margin-bottom:22px}.hero h1{margin:0 0 12px;font-size:clamp(2rem,5vw,3.5rem);line-height:1.02;letter-spacing:-.05em}.hero p{margin:0;color:#475467;line-height:1.65;font-size:1.08rem}.eyebrow{color:var(--muted);font-size:1rem;margin-bottom:14px}.card{padding:24px}.tag-cloud{display:flex;flex-wrap:wrap;gap:12px}.tag-cloud-scroll{max-height:460px;overflow:auto;padding-right:4px}.tag{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--pill);color:#475467;border-radius:999px;padding:10px 14px;font-size:.98rem;text-decoration:none}.tag span{display:inline-block;background:#fff;border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:.86rem}.tag.active{background:#111827;color:#fff}.tag.active span{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);color:#fff}.posts-grid{display:grid;gap:18px;margin-top:22px}.post-card{padding:26px}.post-card h2{margin:0 0 10px;font-size:1.45rem;line-height:1.2;letter-spacing:-.03em}.post-card p{margin:0 0 18px;color:#475467;font-size:1.02rem;line-height:1.65}.read-link{text-decoration:none;color:#111827;font-weight:700}.read-link:hover{text-decoration:underline}.load-more-wrap{display:flex;justify-content:center;margin-top:18px}.load-more{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:999px;padding:12px 18px;font-size:1rem;cursor:pointer;box-shadow:var(--shadow)}.load-more[hidden]{display:none}.site-footer{margin-top:22px;color:var(--muted);font-size:.95rem}.site-footer a{color:#111827;font-weight:700;text-decoration:none}.site-footer a:hover{text-decoration:underline}@media (max-width:800px){header{flex-direction:column}nav a{margin:0 18px 0 0}}`;
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

function formatDisplayDate(date = '') {
  if (!date) return 'Publicación';
  const [year, month, day] = String(date).split('-');
  if (!year || !month || !day) return 'Publicación';
  return `${day}/${month}/${year}`;
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


function removeArticleImages(html = '') {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) return html;

  let inner = articleMatch[1];

  // eliminar bloques automáticos viejos
  inner = inner.replace(/\s*<div class="bd-featured-image"[\s\S]*?<\/div>\s*/ig, '\n');
  inner = inner.replace(/\s*<div class="bd-content-image"[\s\S]*?<\/div>\s*/ig, '\n');

  // eliminar figures que contengan imágenes
  inner = inner.replace(/\s*<figure\b[^>]*>[\s\S]*?<img\b[\s\S]*?<\/figure>\s*/ig, '\n');

  // eliminar imágenes sueltas y párrafos que sólo contienen una imagen
  inner = inner.replace(/\s*<p>\s*<img\b[^>]*>\s*<\/p>\s*/ig, '\n');
  inner = inner.replace(/\s*<img\b[^>]*>\s*/ig, '\n');

  // limpiar metas visuales automáticas previas
  let out = html.replace(articleMatch[0], articleMatch[0].replace(articleMatch[1], inner));
  out = out.replace(/\s*<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>(\s*)/ig, '\n');
  return out;
}

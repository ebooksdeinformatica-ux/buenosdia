import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.buenosdia.com';
const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DATA_DIR = path.join(ROOT, 'data');
const TAGS_DIR = path.join(ROOT, 'tags');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const POSTS_JSON = path.join(DATA_DIR, 'posts.json');
const POPULAR_JSON = path.join(DATA_DIR, 'popular.json');
const CONTACT_URL = 'https://instagram.com/https_404_3rr0r';
const CONTACT_HANDLE = '@https_404_3rr0r';
const INITIAL_BATCH = 20;
const LOAD_BATCH = 20;
const STATCOUNTER_SNIPPET = `<!-- Default Statcounter code for Buenos Dia https://www.buenosdia.com/ -->
<script type="text/javascript">
var sc_project=13215021;
var sc_invisible=1;
var sc_security="4ef10514";
</script>
<script type="text/javascript" src="https://www.statcounter.com/counter/counter.js" async></script>
<noscript><div class="statcounter"><a title="Web Analytics Made Easy - Statcounter" href="https://statcounter.com/" target="_blank" rel="noopener noreferrer"><img class="statcounter" src="https://c.statcounter.com/13215021/0/4ef10514/1/" alt="Web Analytics Made Easy - Statcounter" referrerpolicy="no-referrer-when-downgrade"></a></div></noscript>
<!-- End of Statcounter Code -->`;

if (!fs.existsSync(POSTS_DIR)) {
  console.error('No existe la carpeta /posts');
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });
if (fs.existsSync(TAGS_DIR)) fs.rmSync(TAGS_DIR, { recursive: true, force: true });
fs.mkdirSync(TAGS_DIR, { recursive: true });

const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.html'));

let posts = files.map(file => {
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
}).sort((a, b) => compareByDateThenTitle(a, b));

const tagMap = buildTagMap(posts);
const relatedMap = Object.fromEntries(posts.map(post => [post.slug, computeRelatedPosts(post, posts, 4)]));
const popularOverrides = loadPopularOverrides();
const featuredScores = buildFeaturedScores(posts, tagMap, relatedMap, popularOverrides);

posts = posts.map(post => ({
  ...post,
  related: relatedMap[post.slug] || [],
  featuredScore: featuredScores[post.slug] || 0
}));

const siteSummary = buildSiteSummary(posts, tagMap);

for (const post of posts) {
  let updatedHtml = post.html;
  const relatedHtml = renderRelatedSection(post.related);
  const relatedSectionRegex = /<section[^>]*aria-labelledby="interlinks-post"[^>]*>[\s\S]*?<\/section>/i;
  const faqSectionRegex = /<section[^>]*class="[^"]*\bfaq\b[^"]*"[^>]*>/i;

  if (relatedSectionRegex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(relatedSectionRegex, relatedHtml);
  } else if (faqSectionRegex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(faqSectionRegex, `${relatedHtml}\n\n    $&`);
  }

  updatedHtml = patchPostHtml(updatedHtml, post, siteSummary, tagMap);
  updatedHtml = ensureStatcounter(updatedHtml);
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
  featuredScore: post.featuredScore,
  related: post.related.map(p => ({
    title: p.title,
    description: shortDescription(p.description, 140),
    url: p.url,
    slug: p.slug
  }))
}));
fs.writeFileSync(POSTS_JSON, JSON.stringify(exportedPosts, null, 2), 'utf8');

patchIndexHtml(siteSummary, tagMap);
renderTagPages(tagMap, siteSummary);
write404Page(tagMap);
writeSitemap(posts, tagMap);

console.log(`Generados ${posts.length} posts, ${Object.keys(tagMap).length} páginas de etiquetas, data/posts.json y sitemap.xml.`);

function patchPostHtml(html, currentPost, siteSummary, tagMap) {
  let out = html;
  out = out.replace(/href="\/#etiquetas"/g, 'href="/tags/"');
  out = out.replace(/(<section[^>]*aria-labelledby="tags-post"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));
  out = out.replace(/(<section[^>]*class="[^"]*tags-box[^"]*"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));
  out = out.replace(/(<section[^>]*class="[^"]*\btags\b[^"]*"[^>]*aria-label="Etiquetas"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));

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
  out = out.replace(/<footer([^>]*)>([\s\S]*?)<\/footer>/i, (full, attrs, inner) => `<footer${attrs}>${inner}</footer>\n  <div class="contact-strip">Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a></div>`);

  const spotlightHtml = renderPostSpotlight(currentPost, siteSummary);
  out = upsertSection(out, /<section[^>]*aria-labelledby="site-spotlight-post"[^>]*>[\s\S]*?<\/section>/i, spotlightHtml, /<article[^>]*class="[^"]*\barticle\b[^"]*"[^>]*>/i, 'before');

  if (!/\.contact-strip\s*\{/i.test(out) || !/\.spotlight-grid\s*\{/i.test(out)) {
    out = injectStyles(out, postEnhancementCss());
  }

  return out;
}

function patchIndexHtml(siteSummary, tagMap) {
  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf8');

  html = html.replace(/<nav>[\s\S]*?<\/nav>/i, `<nav>
        <a href="#inicio">Inicio</a>
        <a href="https://www.buenosdia.com/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
        <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contacto</a>
      </nav>`);

  html = html.replace(/<section[^>]*class="index-highlights"[^>]*>[\s\S]*?<\/section>/i, '');
  html = html.replace(/(<section class="hero"[^>]*id="inicio"[^>]*>[\s\S]*?<\/section>)/i, `$1\n\n        ${renderIndexHighlights(siteSummary)}`);

  html = html.replace(/<section id="publicaciones">[\s\S]*?<\/section>/i, `<section id="publicaciones">
          <div class="section-head">
            <div>
              <h2 class="section-title">Últimas publicaciones</h2>
              <p class="section-sub">Las publicaciones más nuevas aparecen primero y se cargan más al seguir bajando.</p>
            </div>
            <div class="section-counter">${siteSummary.totalPosts} publicaciones</div>
          </div>
          <div id="postsList">
            <div class="empty">Cargando publicaciones...</div>
          </div>
          <div class="load-more-wrap">
            <button id="loadMoreBtn" class="load-more" type="button" hidden>Ver más publicaciones</button>
          </div>
          <div id="postsSentinel" aria-hidden="true"></div>
        </section>`);

  html = html.replace(/<div class="contact-strip">[\s\S]*?<\/div>/gi, '');
  html = html.replace(/<footer>[\s\S]*?<\/footer>/i, `<div class="contact-strip">
      Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a>
    </div>

    <footer>
      © 2026 buenosdia.com — mañanas reales, palabras que acompañan. ·
      <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contacto</a>
    </footer>`);

  html = injectStyles(html, indexEnhancementCss());
  html = ensureStatcounter(html);

  const tagSlugMap = JSON.stringify(Object.fromEntries(Object.values(tagMap).map(tag => [normalizeTag(tag.name), tag.slug])));
  const script = renderIndexScript(tagSlugMap);
  html = html.replace(/<script>[\s\S]*?loadPosts\(\);\s*<\/script>/i, script);

  fs.writeFileSync(indexPath, html, 'utf8');
}

function renderTagPages(tagMap, siteSummary) {
  const tags = Object.values(tagMap).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
  const allTagsData = tags.map(tag => ({ slug: tag.slug, name: tag.name, count: tag.count }));
  const sharedHighlights = renderCompactHighlights(siteSummary);

  const tagsIndexHtml = ensureStatcounter(`<!doctype html>
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
        <p>Se cargan de 20 en 20 para que la navegación siga rápida, clara y liviana.</p>
      </section>
      ${sharedHighlights}
      <section class="card browse-card">
        <div class="section-head">
          <div>
            <h2 class="section-title">Navegá por tema</h2>
            <p class="section-sub">Cada etiqueta tiene su propia página y sus publicaciones relacionadas.</p>
          </div>
          <div class="section-counter">${tags.length} etiquetas</div>
        </div>
        <div class="tag-cloud" id="tagsIndexList">
          <div class="empty">Cargando etiquetas...</div>
        </div>
        <div class="load-more-wrap">
          <button id="loadMoreTagsBtn" class="load-more" type="button" hidden>Ver más etiquetas</button>
        </div>
        <div id="tagsIndexSentinel" aria-hidden="true"></div>
      </section>
    </main>
    <footer class="site-footer">
      <p>Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a></p>
    </footer>
  </div>
  <script>
    const ALL_TAGS = ${JSON.stringify(allTagsData)};
    const INITIAL_ITEMS = ${INITIAL_BATCH};
    const BATCH_SIZE = ${LOAD_BATCH};
    let visibleTags = 0;
    let tagsObserverStarted = false;

    function renderTags(reset = false) {
      const container = document.getElementById('tagsIndexList');
      const loadMoreBtn = document.getElementById('loadMoreTagsBtn');
      if (!container) return;
      visibleTags = reset ? Math.min(INITIAL_ITEMS, ALL_TAGS.length) : Math.min(visibleTags + BATCH_SIZE, ALL_TAGS.length);
      const slice = ALL_TAGS.slice(0, visibleTags);
      container.innerHTML = slice.map(tag => '<a class="tag" href="/tags/' + tag.slug + '.html">' + escapeHtml(tag.name) + ' <span>' + tag.count + '</span></a>').join('');
      if (loadMoreBtn) loadMoreBtn.hidden = visibleTags >= ALL_TAGS.length;
    }

    function setupInfiniteTags() {
      if (tagsObserverStarted) return;
      const sentinel = document.getElementById('tagsIndexSentinel');
      if (!sentinel || !('IntersectionObserver' in window)) return;
      tagsObserverStarted = true;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && visibleTags < ALL_TAGS.length) renderTags(false);
        });
      }, { rootMargin: '700px 0px 700px 0px' });
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

    renderTags(true);
    const loadMoreBtn = document.getElementById('loadMoreTagsBtn');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderTags(false));
    setupInfiniteTags();
  </script>
</body>
</html>`);

  fs.writeFileSync(path.join(TAGS_DIR, 'index.html'), tagsIndexHtml, 'utf8');

  for (const tag of tags) {
    const tagPosts = tag.posts
      .map(post => {
        const full = posts.find(item => item.slug === post.slug);
        return {
          ...post,
          tags: full?.tags || [],
          tagSlugs: Object.fromEntries((full?.tags || []).map(item => [item, (tagMap[slugify(item)] && tagMap[slugify(item)].slug) || slugify(item)]))
        };
      })
      .sort((a, b) => compareByDateThenTitle(a, b));

    const pageHtml = ensureStatcounter(`<!doctype html>
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
        <p>${tag.count} publicación${tag.count === 1 ? '' : 'es'} relacionadas con este tema. También acá la carga sigue de 20 en 20.</p>
      </section>
      ${sharedHighlights}
      <section class="card browse-card">
        <div class="section-head">
          <div>
            <h2 class="section-title">Publicaciones con esta etiqueta</h2>
            <p class="section-sub">Se muestran primero las más nuevas para que lo último subido siempre quede arriba.</p>
          </div>
          <div class="section-counter">${tag.count} textos</div>
        </div>
        <div id="tagPostsList" class="posts-grid">
          <div class="empty">Cargando publicaciones...</div>
        </div>
        <div class="load-more-wrap">
          <button id="loadMoreTagPostsBtn" class="load-more" type="button" hidden>Ver más publicaciones</button>
        </div>
        <div id="tagPostsSentinel" aria-hidden="true"></div>
      </section>
      <section class="card">
        <div class="tag-cloud small">
          ${tags.map(item => `<a class="tag${item.slug === tag.slug ? ' active' : ''}" href="/tags/${item.slug}.html">${escapeHtml(item.name)} <span>${item.count}</span></a>`).join('')}
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <p>Contacto: <a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_HANDLE}</a></p>
    </footer>
  </div>
  <script>
    const TAG_POSTS = ${JSON.stringify(tagPosts)};
    const INITIAL_ITEMS = ${INITIAL_BATCH};
    const BATCH_SIZE = ${LOAD_BATCH};
    let visiblePosts = 0;
    let postsObserverStarted = false;

    function renderTagPosts(reset = false) {
      const container = document.getElementById('tagPostsList');
      const loadMoreBtn = document.getElementById('loadMoreTagPostsBtn');
      if (!container) return;
      visiblePosts = reset ? Math.min(INITIAL_ITEMS, TAG_POSTS.length) : Math.min(visiblePosts + BATCH_SIZE, TAG_POSTS.length);
      const slice = TAG_POSTS.slice(0, visiblePosts);
      container.innerHTML = slice.map(post =>
        '<article class="post-card">' +
          '<div class="post-meta">' + escapeHtml(post.date || '') + '</div>' +
          '<h2>' + escapeHtml(post.title || 'Sin título') + '</h2>' +
          '<p>' + escapeHtml(post.description || 'Sin descripción.') + '</p>' +
          '<div class="mini-tags">' +
            ((post.tags || []).slice(0, 5).map(tag => '<a class="tag" href="' + tagHref(tag, post.tagSlugs) + '">' + escapeHtml(tag) + '</a>').join('')) +
          '</div>' +
          '<a class="read-link" href="' + post.url + '">Leer publicación →</a>' +
        '</article>'
      ).join('');
      if (loadMoreBtn) loadMoreBtn.hidden = visiblePosts >= TAG_POSTS.length;
    }

    function setupInfinitePosts() {
      if (postsObserverStarted) return;
      const sentinel = document.getElementById('tagPostsSentinel');
      if (!sentinel || !('IntersectionObserver' in window)) return;
      postsObserverStarted = true;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && visiblePosts < TAG_POSTS.length) renderTagPosts(false);
        });
      }, { rootMargin: '700px 0px 700px 0px' });
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

    function normalizeTag(str) {
      return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
    }

    function slugify(str) {
      return normalizeTag(str).replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    function tagHref(tag, perPostMap) {
      const raw = String(tag || '').trim();
      const fromPost = perPostMap && perPostMap[raw];
      const slug = fromPost || slugify(raw);
      return '/tags/' + slug + '.html';
    }

    renderTagPosts(true);
    const loadMoreBtn = document.getElementById('loadMoreTagPostsBtn');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderTagPosts(false));
    setupInfinitePosts();
  </script>
</body>
</html>`);

    fs.writeFileSync(path.join(TAGS_DIR, `${tag.slug}.html`), pageHtml, 'utf8');
  }
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

  const html = ensureStatcounter(`<!doctype html>
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
      <section class="card browse-card">
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
</html>`);

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

function renderPostSpotlight(currentPost, siteSummary) {
  const latest = siteSummary.latestPosts.filter(post => post.slug !== currentPost.slug).slice(0, 5);
  const featured = siteSummary.featuredPosts.filter(post => post.slug !== currentPost.slug).slice(0, 5);

  return `    <section class="card spotlight" aria-labelledby="site-spotlight-post">\n      <div class="spotlight-head">\n        <div>\n          <p class="pill-label">Moverse por la web</p>\n          <h2 id="site-spotlight-post" class="section-title">Último y destacado, sin salirte del hilo</h2>\n          <p class="section-sub">Encontrá rápido las publicaciones más recientes y una selección destacada para seguir leyendo.</p>\n        </div>\n        <div class="stats-strip">\n          <span class="stat-pill">${siteSummary.totalPosts} textos</span>\n          <span class="stat-pill">${siteSummary.totalTags} etiquetas</span>\n          <span class="stat-pill">Actualizado ${siteSummary.lastUpdate}</span>\n        </div>\n      </div>\n      <div class="spotlight-grid">\n        <div class="spotlight-col">\n          <h3>Últimos 5</h3>\n          <div class="mini-list">${renderMiniLinks(latest)}</div>\n        </div>\n        <div class="spotlight-col">\n          <h3>Destacadas</h3>\n          <div class="mini-list">${renderMiniLinks(featured)}</div>\n        </div>\n      </div>\n    </section>`;
}

function renderIndexHighlights(siteSummary) {
  return `<section class="index-highlights" aria-labelledby="explorar-sitio">
          <div class="discovery-card stats-card">
            <p class="pill-label">Explorá</p>
            <h2 id="explorar-sitio" class="section-title">Lo más nuevo y lo más leído del sitio</h2>
            <p class="section-sub">Encontrá rápido las publicaciones recientes y algunas destacadas para seguir leyendo.</p>
            <div class="stats-strip big">
              <span class="stat-pill">${siteSummary.totalPosts} publicaciones</span>
              <span class="stat-pill">${siteSummary.totalTags} etiquetas</span>
              <span class="stat-pill">Actualizado ${siteSummary.lastUpdate}</span>
            </div>
          </div>
          <div class="discovery-grid">
            <section class="discovery-card">
              <p class="pill-label">Lo nuevo</p>
              <h3>Últimos 5 publicados</h3>
              <div class="mini-list">${renderMiniLinks(siteSummary.latestPosts)}</div>
            </section>
            <section class="discovery-card">
              <p class="pill-label">Para descubrir</p>
              <h3>Destacadas del sitio</h3>
              <div class="mini-list">${renderMiniLinks(siteSummary.featuredPosts)}</div>
            </section>
          </div>
        </section>`;
}

function renderCompactHighlights(siteSummary) {
  return `<section class="index-highlights compact" aria-labelledby="explorar-compacto">\n        <div class="discovery-grid">\n          <section class="discovery-card">\n            <p class="pill-label">Lo nuevo</p>\n            <h2 id="explorar-compacto" class="section-title">Últimos 5</h2>\n            <div class="mini-list">${renderMiniLinks(siteSummary.latestPosts)}</div>\n          </section>\n          <section class="discovery-card">\n            <p class="pill-label">Destacadas</p>\n            <h2 class="section-title">Para seguir leyendo</h2>\n            <div class="mini-list">${renderMiniLinks(siteSummary.featuredPosts)}</div>\n          </section>\n        </div>\n      </section>`;
}

function renderMiniLinks(items = []) {
  if (!items.length) {
    return `<a class="mini-link" href="/"><strong>Volver al inicio</strong><span>Entrá a las publicaciones principales del sitio.</span></a>`;
  }
  return items.map(post => `<a class="mini-link" href="${post.url}"><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(shortDescription(post.description, 115))}</span></a>`).join('');
}

function buildSiteSummary(posts, tagMap) {
  const featuredPosts = posts.slice().sort((a, b) => (b.featuredScore || 0) - (a.featuredScore || 0) || compareByDateThenTitle(a, b)).slice(0, 5);
  return {
    totalPosts: posts.length,
    totalTags: Object.keys(tagMap).length,
    lastUpdate: posts[0]?.date || today(),
    latestPosts: posts.slice(0, 5),
    featuredPosts
  };
}

function buildFeaturedScores(posts, tagMap, relatedMap, manualScores = {}) {
  const latestDate = posts[0]?.date || today();
  const inbound = Object.fromEntries(posts.map(post => [post.slug, 0]));

  for (const relatedItems of Object.values(relatedMap)) {
    relatedItems.forEach((relatedPost, index) => {
      inbound[relatedPost.slug] = (inbound[relatedPost.slug] || 0) + Math.max(1, 5 - index);
    });
  }

  return Object.fromEntries(posts.map(post => {
    const tagScore = (post.tags || []).reduce((acc, tag) => acc + (tagMap[slugify(tag)]?.count || 1), 0);
    const daysOld = daysBetween(post.date, latestDate);
    const recencyScore = Math.max(0, 45 - daysOld);
    const manualScore = manualScores[post.slug] || 0;
    const score = (manualScore * 100) + ((inbound[post.slug] || 0) * 12) + (tagScore * 2) + recencyScore;
    return [post.slug, score];
  }));
}

function loadPopularOverrides() {
  if (!fs.existsSync(POPULAR_JSON)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(POPULAR_JSON, 'utf8'));
    const list = Array.isArray(raw) ? raw : raw.items || raw.posts || [];
    const map = {};
    for (const item of list) {
      const slug = item.slug || slugFromUrl(item.url || '');
      if (!slug) continue;
      map[slug] = Number(item.score || item.weight || item.value || 1);
    }
    return map;
  } catch {
    return {};
  }
}

function slugFromUrl(url = '') {
  const matchResult = String(url).match(/\/posts\/([^/.]+)(?:\.html)?/i);
  return matchResult?.[1] || '';
}

function buildTagMap(posts) {
  const map = {};
  const forbidden = new Set(['inicio', 'publicaciones', 'etiquetas', 'contacto', 'buenosdia com', 'buenosdia.com']);
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
    tag.posts.sort((a, b) => compareByDateThenTitle(a, b));
  }
  return map;
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
    /<section[^>]*class="[^"]*\btags\b[^"]*"[^>]*aria-label="Etiquetas"[^>]*>([\s\S]*?)<\/section>/gis
  ];

  for (const pattern of patterns) {
    for (const found of html.matchAll(pattern)) {
      const chunk = found[1] || '';
      for (const anchor of chunk.matchAll(/<a[^>]*>(.*?)<\/a>/gis)) {
        const text = strip(anchor[1]);
        if (text) results.push(text);
      }
    }
  }

  return results;
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
    .sort((a, b) => b._score - a._score || compareByDateThenTitle(a, b))
    .slice(0, limit);
}

function renderIndexScript(tagSlugMap) {
  return `<script>
    const TAG_SLUG_MAP = ${tagSlugMap};
    const INITIAL_POSTS = ${INITIAL_BATCH};
    const POSTS_BATCH = ${LOAD_BATCH};
    let allPosts = [];
    let visibleCount = 0;
    let observerStarted = false;

    async function loadPosts() {
      const postsList = document.getElementById('postsList');
      const tagCloud = document.getElementById('tagCloud');
      const loadMoreBtn = document.getElementById('loadMoreBtn');

      try {
        const res = await fetch('/data/posts.json?v=' + Date.now());
        const posts = await res.json();

        if (!Array.isArray(posts) || posts.length === 0) {
          postsList.innerHTML = '<div class="empty">Todavía no hay publicaciones visibles.</div>';
          if (tagCloud) tagCloud.innerHTML = '<div class="empty">Todavía no hay etiquetas.</div>';
          if (loadMoreBtn) loadMoreBtn.hidden = true;
          return;
        }

        allPosts = posts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(a.title || '').localeCompare(String(b.title || ''), 'es'));
        renderPosts(true);
        if (tagCloud) renderTagCloud(allPosts, tagCloud);

        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderPosts(false));
        setupInfiniteLoad();
      } catch (err) {
        postsList.innerHTML = '<div class="empty">No se pudieron cargar las publicaciones.</div>';
        if (tagCloud) tagCloud.innerHTML = '<div class="empty">No se pudieron cargar las etiquetas.</div>';
        if (loadMoreBtn) loadMoreBtn.hidden = true;
      }
    }

    function renderPosts(reset = false) {
      const postsList = document.getElementById('postsList');
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      if (!postsList) return;

      visibleCount = reset ? Math.min(INITIAL_POSTS, allPosts.length) : Math.min(visibleCount + POSTS_BATCH, allPosts.length);
      const slice = allPosts.slice(0, visibleCount);
      postsList.innerHTML = slice.map(post =>
        '<article class="post-card">' +
          '<div class="post-meta">' + escapeHtml(post.date || '') + '</div>' +
          '<h3>' + escapeHtml(post.title || 'Sin título') + '</h3>' +
          '<p>' + escapeHtml(post.description || 'Sin descripción.') + '</p>' +
          '<div class="tags">' +
            ((post.tags || []).slice(0, 6).map(tag => '<a class="tag" href="' + tagHref(tag, post.tagSlugs) + '">' + escapeHtml(tag) + '</a>').join('')) +
          '</div>' +
          '<a class="read-link" href="' + post.url + '">Leer publicación →</a>' +
        '</article>'
      ).join('');

      if (loadMoreBtn) loadMoreBtn.hidden = visibleCount >= allPosts.length;
    }

    function setupInfiniteLoad() {
      if (observerStarted) return;
      const sentinel = document.getElementById('postsSentinel');
      if (!sentinel || !('IntersectionObserver' in window)) return;
      observerStarted = true;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && visibleCount < allPosts.length) renderPosts(false);
        });
      }, { rootMargin: '900px 0px 900px 0px' });
      observer.observe(sentinel);
    }

    function renderTagCloud(posts, tagCloud) {
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
        ? sortedTags.map(([tag, count]) => '<a class="tag" href="' + tagHref(tag) + '" title="Ver publicaciones con la etiqueta ' + escapeHtml(tag) + '">' + escapeHtml(tag) + ' (' + count + ')</a>').join('')
        : '<div class="empty">Todavía no hay etiquetas.</div>';
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function normalizeTag(str) {
      return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
    }

    function slugify(str) {
      return normalizeTag(str).replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    function tagHref(tag, perPostMap) {
      const raw = String(tag || '').trim();
      const fromPost = perPostMap && perPostMap[raw];
      const normalized = normalizeTag(raw);
      const mapped = TAG_SLUG_MAP[normalized];
      const slug = fromPost || mapped || slugify(raw);
      return '/tags/' + slug + '.html';
    }

    loadPosts();
  </script>`;
}

function ensureStatcounter(html) {
  const clean = html.replace(/<!-- Default Statcounter code[\s\S]*?<!-- End of Statcounter Code -->/i, '').trim();
  if (/<\/body>/i.test(clean)) return clean.replace(/<\/body>/i, `${STATCOUNTER_SNIPPET}\n</body>`);
  return `${clean}\n${STATCOUNTER_SNIPPET}`;
}

function injectStyles(html, css) {
  if (html.includes(css.trim())) return html;
  if (/<\/style>/i.test(html)) return html.replace(/<\/style>/i, `\n${css}\n  </style>`);
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `<style>${css}</style>\n</head>`);
  return html;
}

function upsertSection(html, sectionRegex, newSection, anchorRegex, mode = 'before') {
  if (sectionRegex.test(html)) return html.replace(sectionRegex, newSection);
  if (!anchorRegex.test(html)) return html;
  return html.replace(anchorRegex, mode === 'before' ? `${newSection}\n\n    $&` : `$&\n\n    ${newSection}`);
}

function postEnhancementCss() {
  return `.spotlight{background:var(--soft,#f7f7f7)}
    .spotlight-head{display:grid;gap:14px;margin-bottom:16px}
    .spotlight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .spotlight-col{background:#fff;border:1px solid var(--line,#e9e9e9);border-radius:16px;padding:14px}
    .spotlight-col h3{margin:0 0 12px;font-size:1rem;letter-spacing:-.02em}
    .mini-list{display:grid;gap:10px}
    .mini-link{display:block;text-decoration:none;background:#fff;border:1px solid var(--line,#e9e9e9);border-radius:14px;padding:12px 14px}
    .mini-link strong{display:block;line-height:1.3}
    .mini-link span{display:block;margin-top:6px;color:var(--muted,#666);font-size:.95rem;line-height:1.45}
    .mini-link:hover{transform:translateY(-1px)}
    .pill-label{display:inline-flex;align-items:center;gap:8px;margin:0 0 8px;font-size:.82rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#666)}
    .stats-strip{display:flex;flex-wrap:wrap;gap:8px}
    .stat-pill{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line,#e9e9e9);background:#fff;border-radius:999px;padding:8px 12px;font-size:.9rem;color:var(--muted,#666)}
    @media (max-width:760px){.spotlight-grid{grid-template-columns:1fr}}`;
}

function indexEnhancementCss() {
  return `.index-highlights{display:grid;gap:18px;margin:0 0 26px}
    .index-highlights.compact{margin:0 0 22px}
    .discovery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .discovery-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:24px}
    .stats-card{padding:26px}
    .mini-list{display:grid;gap:10px}
    .mini-link{display:block;text-decoration:none;border:1px solid var(--line);background:#fff;border-radius:16px;padding:12px 14px}
    .mini-link strong{display:block;color:var(--text);line-height:1.3}
    .mini-link span{display:block;margin-top:6px;color:var(--muted);font-size:.95rem;line-height:1.45}
    .mini-link:hover{transform:translateY(-1px)}
    .pill-label{display:inline-flex;align-items:center;margin:0 0 8px;font-size:.82rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
    .stats-strip{display:flex;flex-wrap:wrap;gap:10px}
    .stats-strip.big{margin-top:12px}
    .stat-pill{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 12px;font-size:.92rem;color:var(--muted)}
    .section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:18px}
    .section-counter{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 12px;font-size:.92rem;color:var(--muted);white-space:nowrap}
    .post-meta{margin:0 0 10px;color:var(--muted);font-size:.92rem}
    @media (max-width:980px){.discovery-grid{grid-template-columns:1fr}.section-head{flex-direction:column;align-items:flex-start}}`;
}

function sharedTagPageCss() {
  return `:root{--bg:#f6f3ee;--card:#fffdfa;--text:#171717;--muted:#667085;--line:#e7e1d8;--pill:#f5f5f4;--shadow:0 10px 25px rgba(0,0,0,.05);--radius:22px;--max:1100px}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--text)}.wrap{max-width:var(--max);margin:0 auto;padding:28px 20px 70px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:22px}.brand{text-decoration:none;color:#111827;font-weight:700;font-size:1.2rem}nav a{text-decoration:none;color:var(--muted);margin-left:20px;font-size:1rem}.hero,.card,.post-card,.discovery-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.hero{padding:34px;margin-bottom:22px}.hero h1{margin:0 0 12px;font-size:clamp(2rem,5vw,3.5rem);line-height:1.02;letter-spacing:-.05em}.hero p{margin:0;color:#475467;line-height:1.65;font-size:1.08rem}.eyebrow{color:var(--muted);font-size:1rem;margin-bottom:14px}.card,.discovery-card{padding:24px}.tag-cloud{display:flex;flex-wrap:wrap;gap:12px}.tag{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--pill);color:#475467;border-radius:999px;padding:10px 14px;font-size:.98rem;text-decoration:none}.tag span{display:inline-block;background:#fff;border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:.86rem}.tag.active{background:#111827;color:#fff}.tag.active span{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);color:#fff}.posts-grid{display:grid;gap:18px}.post-card{padding:26px}.post-card h2{margin:0 0 10px;font-size:1.45rem;line-height:1.2;letter-spacing:-.03em}.post-card p{margin:0 0 18px;color:#475467;font-size:1.02rem;line-height:1.65}.post-meta{margin:0 0 10px;color:var(--muted);font-size:.92rem}.mini-tags{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 14px}.read-link{text-decoration:none;color:#111827;font-weight:700}.read-link:hover{text-decoration:underline}.site-footer{margin-top:22px;color:var(--muted);font-size:.95rem}.site-footer a{color:#111827;font-weight:700;text-decoration:none}.site-footer a:hover{text-decoration:underline}.index-highlights{display:grid;gap:18px;margin:0 0 22px}.discovery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.mini-list{display:grid;gap:10px}.mini-link{display:block;text-decoration:none;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 14px}.mini-link strong{display:block;line-height:1.3;color:#111827}.mini-link span{display:block;margin-top:6px;color:#475467;font-size:.95rem;line-height:1.45}.section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:18px}.section-title{margin:0 0 8px;font-size:1.2rem;letter-spacing:-.02em}.section-sub{margin:0;color:var(--muted);font-size:1rem}.section-counter,.stat-pill{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 12px;font-size:.92rem;color:var(--muted);white-space:nowrap}.stats-strip{display:flex;flex-wrap:wrap;gap:10px}.pill-label{display:inline-flex;align-items:center;margin:0 0 8px;font-size:.82rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}.load-more-wrap{display:flex;justify-content:center;margin-top:18px}.load-more{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:999px;padding:12px 18px;font-size:1rem;cursor:pointer;box-shadow:var(--shadow)}.load-more[hidden]{display:none}.empty{padding:18px;border:1px dashed var(--line);border-radius:16px;color:var(--muted);background:#fff}.browse-card{margin-bottom:22px}@media (max-width:860px){header{flex-direction:column}nav a{margin:0 18px 0 0}.discovery-grid{grid-template-columns:1fr}.section-head{flex-direction:column;align-items:flex-start}}`;
}

function tokenize(str = '') {
  const stopwords = new Set(['de', 'la', 'el', 'los', 'las', 'y', 'en', 'a', 'un', 'una', 'unos', 'unas', 'con', 'sin', 'por', 'para', 'que', 'del', 'al', 'se', 'me', 'mi', 'tu', 'te', 'lo', 'le', 'les', 'su', 'sus', 'como', 'pero', 'porque', 'ya', 'muy', 'mas', 'hay', 'es', 'son', 'fue', 'ser', 'si', 'no', 'yo', 'vos', 'este', 'esta', 'estos', 'estas', 'eso', 'esa', 'esos', 'esas', 'cada', 'entre', 'sobre', 'cuando', 'donde', 'todo', 'toda', 'todos', 'todas', 'solo', 'sola', 'aunque', 'tambien', 'hasta', 'desde', 'otra', 'otro', 'otras', 'otros', 'dia', 'dias', 'manana', 'mañana', 'buenos', 'buena', 'buen', 'hoy', 'ayer', 'igual', 'tener', 'tenes', 'tenés', 'queda', 'quedar', 'cosas', 'vida', 'real', 'reales']);
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

function daysBetween(older, newer) {
  const a = new Date(`${older}T00:00:00Z`);
  const b = new Date(`${newer}T00:00:00Z`);
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function compareByDateThenTitle(a, b) {
  return String(b.date || '').localeCompare(String(a.date || '')) || String(a.title || '').localeCompare(String(b.title || ''), 'es');
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
  const result = String(str || '').match(regex);
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

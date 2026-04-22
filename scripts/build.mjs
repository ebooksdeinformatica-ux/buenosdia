import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.buenosdia.com';
const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DATA_DIR = path.join(ROOT, 'data');
const TAGS_DIR = path.join(ROOT, 'tags');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const POSTS_JSON = path.join(DATA_DIR, 'posts.json');
const CONTACT_PAGE_PATH = '/contacto.html';
const CONTACT_URL = CONTACT_PAGE_PATH;
const CONTACT_EMAIL = 'ebooksdeinformatica@gmail.com';
const CONTACT_EMAIL_MAILTO = `mailto:${CONTACT_EMAIL}`;
const CONTACT_INSTAGRAM_URL = 'https://instagram.com/https_404_3rr0r';
const CONTACT_INSTAGRAM_HANDLE = '@https_404_3rr0r';
const AUTHOR_NAME = 'ASPF';
const AUTHOR_ROLE = 'Editor y creador de buenosdia.com';
const AUTHOR_PAGE_PATH = '/autor/aspf.html';
const AUTHOR_SHORT_BIO = 'Escribe textos humanos, reflexivos y originales sobre mañanas reales, reconstrucción, cansancio, claridad, sentido y vida cotidiana.';
const PUBLISHER_NAME = 'Buenos Días';
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

const BD_FEATURE_EDITORIAL_BLOCKS = process.env.BD_EDITORIAL_BLOCKS === 'true';
const BD_PREVIOUS_POSTS_BY_SLUG = loadPreviousPostsBySlug();
const TAG_ALIASES = {
  // Alias seguro: corregir variantes ortográficas futuras sin romper el pipeline.
};

const IMAGE_DIR = path.join(ROOT, 'assets', 'imagenes-tematicas');
const INSTITUTIONAL_LINKS = `
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>`;
const INSTITUTIONAL_FOOTER_LINKS = `
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>`;

const TAG_MIN_PAGE_COUNT = 3;
const TAG_STRONG_HIGHLIGHT_COUNT = 3;
const TAG_PAGE_INITIAL_VISIBLE = 24;
const TAG_KEEP_WHITELIST = new Set([
  'cansancio',
  'identidad',
  'motivacion',
  'motivacion real',
  'reflexion',
  'claridad',
  'esperanza',
  'seguir adelante',
  'vida real',
  'reconstruccion personal',
  'frecuencia personal',
  'energia propia'
]);
let ACTIVE_TAG_SLUGS = new Set();


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
  const slug = file.replace('.html', '');
  const previousPost = BD_PREVIOUS_POSTS_BY_SLUG[slug] || null;

  const title =
    match(html, /<title>(.*?)<\/title>/is) ||
    match(html, /<h1[^>]*>(.*?)<\/h1>/is) ||
    cleanSlug(slug);

  const description =
    match(html, /<meta\s+name="description"\s+content="(.*?)"\s*\/?>/is) ||
    match(html, /<p[^>]*class="lead"[^>]*>(.*?)<\/p>/is) ||
    'Reflexión en buenosdia.com';

  const keywords = match(html, /<meta\s+name="keywords"\s+content="(.*?)"\s*\/?>/is) || '';
  const articleDate = extractArticleDate(html, previousPost?.date);
  const lead = match(html, /<p[^>]*class="lead"[^>]*>(.*?)<\/p>/is) || '';
  const articleHtml = match(html, /<article[^>]*>([\s\S]*?)<\/article>/is) || '';
  const metaTags = keywords.split(',').map(normalizeTag).filter(Boolean);
  const visibleTags = getVisibleTags(html).map(normalizeTag).filter(Boolean);
  const tags = [...new Set([...metaTags, ...visibleTags])];
  const lineOverride = extractEditorialLineOverride(html);

  return {
    title: strip(title.replace(/\|\s*buenosdia\.com/i, '').trim()),
    description: strip(description),
    lead: strip(lead),
    body: strip(articleHtml),
    tags,
    date: articleDate,
    slug,
    url: `/posts/${file}`,
    fullPath,
    html,
    lineOverride
  };
}).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'));

for (const post of posts) {
  post.line = detectEditorialLine(post);
}

const tagMap = buildTagMap(posts);
ACTIVE_TAG_SLUGS = new Set(Object.keys(tagMap));
const featuredPosts = computeFeaturedPosts(posts, 8);
const lineMap = buildLineMap(posts);

for (const post of posts) {
  let updatedHtml = cleanupLegacyAutoSections(post.html);
  updatedHtml = patchPostHtml(updatedHtml, post, posts, featuredPosts, lineMap, tagMap);
  updatedHtml = injectAdsense(updatedHtml);
  updatedHtml = injectStatcounter(updatedHtml);
  fs.writeFileSync(post.fullPath, updatedHtml, 'utf8');
}

const exportedPosts = posts.map(post => {
  const strongTags = (post.tags || []).filter(tag => tagMap[slugify(tag)]);
  return {
    title: post.title,
    description: post.description,
    tags: strongTags,
    tagSlugs: Object.fromEntries(strongTags.map(tag => [tag, tagMap[slugify(tag)].slug])),
    date: post.date,
    slug: post.slug,
    url: post.url,
    line: post.line,
    related: computeRelatedPosts(post, posts, 4).map(p => ({
      title: p.title,
      description: shortDescription(p.description, 140),
      url: p.url,
      slug: p.slug
    }))
  };
});
fs.writeFileSync(POSTS_JSON, JSON.stringify(exportedPosts, null, 2), 'utf8');

patchIndexHtml(tagMap);
writeInstitutionalPages();
renderTagPages(tagMap);
write404Page(tagMap);
writeSitemap(posts, tagMap);

console.log(`Generados ${posts.length} posts, ${Object.keys(tagMap).length} páginas de etiquetas, data/posts.json y sitemap.xml.`);

function patchPostHtml(html, currentPost, allPosts, featuredPosts, lineMap, tagMap) {
  let out = html;
  out = cleanupLegacyAutoSections(out);
  out = cleanupLegacyAutoFeaturedImages(out);
  out = removeEmptyFeaturedFigure(out);
  out = dedupeInlineCss(out);
  out = cleanDuplicateStructuredData(out);
  out = ensureAuthorMeta(out);
  out = ensureBrandLabel(out);
  out = out.replace(/href="\/#etiquetas"/g, 'href="/tags/"');

  out = out.replace(/(<section[^>]*aria-labelledby="tags-post"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));
  out = out.replace(/(<section[^>]*class="[^"]*tags-box[^"]*"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));
  out = out.replace(/(<section[^>]*class="tags"[^>]*aria-label="Etiquetas"[^>]*>[\s\S]*?<\/section>)/gis, section => rewriteTagLinks(section));

  out = out.replace(/<nav([^>]*)>[\s\S]*?<\/nav>/i, `<nav$1>
        <a href="/">Inicio</a>
        <a href="https://www.buenosdia.com/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>${INSTITUTIONAL_LINKS}
        <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
      </nav>`);

  out = out.replace(/<div class="footer-links">[\s\S]*?<\/div>/i, `<div class="footer-links">
        <a href="https://www.buenosdia.com/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>${INSTITUTIONAL_FOOTER_LINKS}
        <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
      </div>`);

  out = out.replace(/<div class="contact-strip">[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<footer([^>]*)>([\s\S]*?)<\/footer>/i, (full, attrs, inner) => `<footer${attrs}>${inner}</footer>
  <div class="contact-strip">Contacto editorial: <a href="${CONTACT_PAGE_PATH}">abrir página de contacto</a> · <a href="${AUTHOR_PAGE_PATH}">quién escribe</a></div>`);

  if (!/\.contact-strip\s*\{/i.test(out) || !/\.auto-posts-grid\s*\{/i.test(out) || !/\.bd-author-box\s*\{/i.test(out)) {
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
    .tag-cloud-strong{display:flex;flex-wrap:wrap;gap:12px}
    .bd-post-hero,.bd-content-image{margin:18px auto 26px;max-width:min(100%,860px);width:100%;overflow:hidden}
    .bd-post-hero a,.bd-content-image a{display:block;text-decoration:none}
    .bd-post-hero img,.bd-content-image img,.article img,.article figure img,article img,article figure img{display:block;width:100%;max-width:100%;height:auto;border-radius:18px;border:1px solid var(--line,#e9e9e9);box-shadow:var(--shadow,0 10px 25px rgba(0,0,0,.05))}
    .article figure,article figure{margin:18px 0 26px}
    .bd-author-box{margin:26px auto 24px;max-width:min(100%,860px)}
    .bd-author-box .author-kicker{margin:0 0 8px;color:var(--muted,#666);font-size:.95rem;letter-spacing:.02em;text-transform:uppercase}
    .bd-author-box h2{margin:0 0 10px;font-size:1.28rem;line-height:1.2}
    .bd-author-box p{margin:0;color:#475467;line-height:1.7}
    .bd-author-box .author-links{margin-top:12px;display:flex;flex-wrap:wrap;gap:14px}
    .bd-author-box .author-links a{color:var(--text,#111);font-weight:700;text-decoration:none}
    .bd-author-box .author-links a:hover{text-decoration:underline}
    .bd-inline-link{margin:1rem 0 1.2rem;padding:14px 16px;border-left:3px solid var(--line,#e9e9e9);background:var(--soft,#f7f7f7);border-radius:12px;color:#3f4754}
    .bd-inline-link a{font-weight:700;text-decoration:underline;text-underline-offset:3px}
    @media (min-width:760px){.auto-posts-grid{grid-template-columns:1fr 1fr}}
  </style>`);
  }

  out = ensureHumanByline(out, currentPost);
  out = ensureAuthorBox(out, currentPost);
  out = ensureFeaturedQuote(out, currentPost);
  out = ensureContextualInterlinks(out, currentPost, allPosts);
  out = enhancePostDiscover(out, currentPost);
  const strongTagsHtml = renderStrongTagsForPost(currentPost, tagMap, 6);
  const latestHtml = renderAutoSection('ultimas-publicaciones-auto', 'Últimas 3 publicaciones', 'Los textos más nuevos del sitio, en orden.', getLatestPosts(currentPost, allPosts, 3));
  const featuredHtml = renderAutoSection('destacadas-publicaciones-auto', 'Más destacadas', 'Una selección automática del sitio para seguir navegando.', getFeaturedPostsForPost(currentPost, featuredPosts, allPosts, 3));
  const lineHtml = renderLineSection(currentPost, lineMap, 3);
  const autoBlocks = `

    ${strongTagsHtml ? `${strongTagsHtml}

    ` : ''}${featuredHtml}

    ${latestHtml}${lineHtml ? `

    ${lineHtml}` : ''}`;

  const faqRegex = /(<section[^>]*class="[^"]*\bfaq\b[^"]*"[^>]*>[\s\S]*?<\/section>)/i;
  if (faqRegex.test(out)) {
    out = out.replace(faqRegex, `$1${autoBlocks}`);
  } else if (/<\/main>/i.test(out)) {
    out = out.replace(/<\/main>/i, `${autoBlocks}
  </main>`);
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
    if (!ACTIVE_TAG_SLUGS.has(slug)) return `<span class="tag">${inner}</span>`;
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
        map[slug] = { slug, name: normalized, count: 0, posts: [] };
      }
      map[slug].count += 1;
      map[slug].posts.push({
        title: post.title,
        description: post.description,
        lead: post.lead,
        body: post.body,
        date: post.date,
        url: post.url,
        slug: post.slug,
        line: post.line,
        tags: post.tags || []
      });
    }
  }
  const filtered = {};
  for (const [slug, tag] of Object.entries(map)) {
    tag.posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'));
    const keep = tag.count >= TAG_MIN_PAGE_COUNT || TAG_KEEP_WHITELIST.has(tag.name) || TAG_KEEP_WHITELIST.has(slug);
    if (keep) filtered[slug] = tag;
  }
  return filtered;
}



function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = ((hash << 5) - hash) + str.charCodeAt(i);
  return hash | 0;
}

function capitalizePhrase(text = '') {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function inferTagMode(tagName = '') {
  const tag = normalizeTag(tagName);
  if (/(cansancio|agotamiento|fatiga|ansiedad|tristeza|soledad|decepcion|dolor|insomnio|desmotivacion|incertidumbre)/.test(tag)) return 'estado';
  if (/(motivacion|claridad|esperanza|energia|frecuencia|identidad|paz|calma|presencia|equilibrio|intuicion|naturalidad|firmeza)/.test(tag)) return 'eje';
  if (/(volver|seguir|empezar|cambiar|retomar|reconstruccion|reconstruir|reprogramarse|superar|levantar|transformar|entrenar|caminar|sobrevivir)/.test(tag)) return 'proceso';
  if (/(amigos|amistad|vinculos|social|gente|mujer|pareja|mirada ajena|abandono|decepcion|universidad)/.test(tag)) return 'vinculo';
  if (/(dias|dia|mañanas|mananas|noche|noches|lunes|lluvia|madrugada|feriados|rutina|trabajo|tarde)/.test(tag)) return 'situacion';
  return 'general';
}

function getTagContextTerms(tag) {
  const combined = (tag.posts || []).map(post => `${post.title || ''} ${post.description || ''} ${post.lead || ''} ${post.body || ''}`).join(' ');
  const tagTokens = new Set(tokenize(tag.name || ''));
  const weights = {};
  for (const token of tokenize(combined)) {
    if (tagTokens.has(token)) continue;
    weights[token] = (weights[token] || 0) + 1;
  }
  return Object.entries(weights)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, 4)
    .map(([token]) => token);
}

function getTagExampleTitles(tag, limit = 2) {
  return (tag.posts || []).slice(0, limit).map(post => post.title).filter(Boolean);
}

function buildTagDefinition(tag) {
  const name = tag.name || 'este tema';
  const mode = inferTagMode(name);
  const terms = getTagContextTerms(tag);
  const term1 = terms[0] || '';
  const term2 = terms[1] || '';
  const cap = capitalizePhrase(name);

  const byMode = {
    estado: [
      `${cap} no es solo una sensación suelta: muchas veces nombra un desgaste real que se acumula en el cuerpo, en la cabeza o en la forma de atravesar el día.`,
      `${cap} suele aparecer cuando el cuerpo y la mente empiezan a pasar factura, no siempre con ruido, pero sí con señales concretas que se sienten en la vida diaria.`,
      `${cap} habla de un límite. De ese punto en el que algo pide pausa, aire o una forma distinta de sostenerse.`
    ],
    eje: [
      `${cap} tiene que ver con una dirección interna: con la forma en que una persona vuelve a ordenar lo que siente, lo que piensa y lo que decide hacer.`,
      `${cap} no apunta a una idea vacía o decorativa: apunta a un eje real desde donde mirar mejor lo que pasa y moverse con más sentido.`,
      `${cap} toca una parte clave de la vida cotidiana: la que define con qué energía, con qué claridad y desde qué lugar interno se enfrenta cada día.`
    ],
    proceso: [
      `${cap} no es una frase linda: es un proceso. Habla de moverse otra vez, de reconstruir algo o de empezar a salir de un punto que estaba trabado.`,
      `${cap} nombra un recorrido. No algo instantáneo, sino una serie de decisiones, intentos y pequeños movimientos que vuelven a poner a alguien en marcha.`,
      `${cap} aparece cuando ya no alcanza con aguantar. Es la parte de la vida en la que toca rehacer, corregir o animarse a dar un paso distinto.`
    ],
    vinculo: [
      `${cap} pone el foco en lo que pasa entre personas: en la forma en que alguien acompaña, decepciona, sostiene o deja marcas en la vida real.`,
      `${cap} habla de vínculos concretos. De lo que se siente cuando el otro suma, falta, pesa o modifica el clima emocional de una etapa.`,
      `${cap} toca una zona sensible de la experiencia: la que mezcla presencia, expectativas y la verdad que aparece cuando los vínculos se ponen a prueba.`
    ],
    situacion: [
      `${cap} nombra escenas concretas de la vida diaria. No una idea abstracta, sino momentos reales que cambian el humor, el ritmo o la forma de mirar lo que viene.`,
      `${cap} aparece en esos tramos del día donde el cuerpo, la mente y el contexto se cruzan, y dejan una sensación más difícil de explicar que de sentir.`,
      `${cap} funciona como una manera de ponerle nombre a ciertos momentos que se repiten y que, aunque parezcan simples, tienen bastante carga emocional.`
    ],
    general: [
      `${cap} reúne una idea que vuelve seguido en la vida real y que toma forma distinta según el momento, el ánimo y lo que cada persona viene atravesando.`,
      `${cap} sirve para nombrar un eje humano que aparece en varias situaciones del día a día, siempre ligado a algo concreto y reconocible.`,
      `${cap} no queda en lo teórico: baja a experiencias, decisiones y estados que cualquiera puede reconocer cuando mira su propia vida con un poco más de atención.`
    ]
  };

  const variants = byMode[mode] || byMode.general;
  const idx = Math.abs(hashString(tag.slug || name)) % variants.length;
  let sentence = variants[idx];

  if (term1 || term2) {
    const extras = [term1, term2].filter(Boolean).join(' y ');
    sentence += ` En estos textos suele cruzarse con ${extras}, por eso no queda aislado ni abstracto.`;
  }

  return sentence;
}

function buildTagIntro(tag) {
  const name = tag.name || 'este tema';
  const count = tag.count || (tag.posts || []).length || 0;
  const definition = buildTagDefinition(tag);
  const exampleTitles = getTagExampleTitles(tag, 2);
  const examplesText = exampleTitles.length
    ? ` Acá aparece, por ejemplo, en publicaciones como ${exampleTitles.map(title => `“${title}”`).join(' y ')}.`
    : '';
  const closing = ` En esta etiqueta vas a encontrar ${count} publicación${count === 1 ? '' : 'es'} relacionadas con ${name}, pensadas para entrar mejor al tema sin perderte entre resultados vacíos.`;
  return `${definition}${examplesText}${closing}`.trim();
}

function getStrongRelatedTags(currentTag, tagMap, limit = 30) {
  return Object.values(tagMap)
    .filter(tag => tag.slug !== currentTag.slug)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))
    .slice(0, limit);
}

function renderStrongTagsForPost(currentPost, tagMap, limit = 8) {
  const items = (currentPost.tags || [])
    .map(tag => tagMap[slugify(tag)])
    .filter(Boolean)
    .filter((tag, index, arr) => arr.findIndex(item => item.slug === tag.slug) === index)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))
    .slice(0, limit);

  if (!items.length) return '';

  return `    <section class="card auto-discovery" data-auto-block="strong-tags-post">
      <h2 class="auto-block-title">Etiquetas fuertes relacionadas</h2>
      <p class="auto-block-sub">Temas más sólidos para seguir leyendo sin salirte del mismo hilo.</p>
      <div class="tag-cloud tag-cloud-strong">
        ${items.map(tag => `<a class="tag" href="/tags/${tag.slug}.html">${escapeHtml(tag.name)} <span>${tag.count}</span></a>`).join('')}
      </div>
    </section>`;
}

function cleanupLegacyAutoFeaturedImages(html = '') {
  let out = html;
  out = out.replace(/\s*<div class="bd-post-hero"[\s\S]*?<\/div>\s*/ig, '\n');
  out = out.replace(/\s*<div class="bd-featured-image"[\s\S]*?<\/div>\s*/ig, '\n');
  out = out.replace(/\s*<div class="bd-content-image"[\s\S]*?<\/div>\s*/ig, '\n');
  return out;
}

function sanitizeImageTag(imgHtml = '') {
  return String(imgHtml || '')
    .replace(/\swidth="[^"]*"/gi, '')
    .replace(/\sheight="[^"]*"/gi, '')
    .replace(/\sstyle="([^"]*)"/gi, (m, styleValue) => {
      let clean = String(styleValue || '')
        .replace(/\bwidth\s*:\s*[^;"]+;?/gi, '')
        .replace(/\bheight\s*:\s*[^;"]+;?/gi, '')
        .replace(/\bmax-width\s*:\s*[^;"]+;?/gi, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s*;\s*$/g, '')
        .trim();
      return clean ? ` style="${clean}"` : '';
    });
}

function ensureContentImagesResponsive(html = '') {
  let out = html;
  const heroPattern = /(<main[^>]*>[\s\S]*?)(<img\b[^>]*src="([^"]+)"[^>]*>)(\s*)(?=<div[^>]*class="[^"]*meta[^"]*"|<article\b|<p\b|<h2\b|<h3\b)/i;
  const heroMatch = out.match(heroPattern);
  if (heroMatch && !/class="bd-post-hero"/i.test(out)) {
    const srcValue = heroMatch[3] || '';
    const cleaned = sanitizeImageTag(heroMatch[2]);
    const wrapped = `<div class="bd-post-hero"><a href="${srcValue}" target="_blank" rel="noopener noreferrer">${cleaned}</a></div>`;
    out = out.replace(heroPattern, `$1${wrapped}$4`);
  }

  const articleMatch = out.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    let inner = articleMatch[1];
    inner = inner.replace(/<img\b[^>]*src="([^"]+)"[^>]*>/gi, (full, srcValue) => {
      const cleaned = sanitizeImageTag(full);
      return `<a href="${srcValue}" target="_blank" rel="noopener noreferrer">${cleaned}</a>`;
    });
    out = out.replace(articleMatch[0], articleMatch[0].replace(articleMatch[1], inner));
  }
  return out;
}

function removeEmptyFeaturedFigure(html = '') {
  return html.replace(/\s*<figure[^>]*class="[^"]*bd-featured-image[^"]*"[^>]*>\s*<\/figure>\s*/gi, '\n');
}

function dedupeInlineCss(html = '') {
  let out = html;
  const pattern = String.raw`
\s*\.bd-post-hero,\.bd-content-media\{[\s\S]*?article figure,.article figure\{max-width:min\(100%,860px\);margin:18px auto 26px\}
`;
  const regex = new RegExp(pattern, 'g');
  const matches = out.match(regex);
  if (matches && matches.length > 1) {
    let seen = false;
    out = out.replace(regex, () => {
      if (!seen) {
        seen = true;
        return matches[0];
      }
      return '';
    });
  }
  return out;
}

function cleanDuplicateStructuredData(html = '') {
  return html.replace(/\s*<script type="application\/ld\+json">\s*\{[\s\S]*?"@type"\s*:\s*"Article"[\s\S]*?<\/script>/i, '');
}

function ensureAuthorMeta(html = '') {
  if (/<meta\s+name="author"/i.test(html)) {
    return html.replace(/<meta\s+name="author"\s+content="[^"]*"\s*\/?>/i, `<meta name="author" content="${AUTHOR_NAME}">`);
  }
  return html.replace(/<meta\s+name="keywords"[^>]*>/i, match => `${match}
  <meta name="author" content="${AUTHOR_NAME}">`);
}

function ensureBrandLabel(html = '') {
  let out = html;
  out = out.replace(/>BuenosDia</g, '>Buenos Días<');
  out = out.replace(/>buenosdia\.com<\/a>/g, '>Buenos Días</a>');
  return out;
}

function ensureHumanByline(html = '', post = {}) {
  let out = html;
  out = out.replace(/Publicado por\s*buenosdia\.com/gi, `Por ${AUTHOR_NAME}`);
  if (/<div[^>]*class="meta"[^>]*>.*?<\/div>/i.test(out)) {
    out = out.replace(/<div([^>]*)class="([^"]*\bmeta\b[^"]*)"([^>]*)>[\s\S]*?<\/div>/i, `<div$1class="$2"$3>Por ${AUTHOR_NAME} · <a href="${AUTHOR_PAGE_PATH}">ver perfil</a></div>`);
  }
  return out;
}

function ensureAuthorBox(html = '', post = {}) {
  if (/data-bd-author-box="true"/i.test(html)) return html;
  const authorBox = `
    <section class="card bd-author-box" data-bd-author-box="true">
      <p class="author-kicker">Quién escribe</p>
      <h2>${AUTHOR_NAME}</h2>
      <p>${AUTHOR_ROLE}. ${AUTHOR_SHORT_BIO}</p>
      <div class="author-links">
        <a href="${AUTHOR_PAGE_PATH}">Ver perfil</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
        <a href="/politica-editorial.html">Política editorial</a>
      </div>
    </section>`;

  if (/<section[^>]*class="tags"[^>]*aria-label="Etiquetas"[^>]*>/i.test(html)) {
    return html.replace(/(<section[^>]*class="tags"[^>]*aria-label="Etiquetas"[^>]*>)/i, `${authorBox}

    $1`);
  }
  if (/<\/article>/i.test(html)) {
    return html.replace(/<\/article>/i, `</article>${authorBox}`);
  }
  return html;
}


function ensureContextualInterlinks(html = '', currentPost = {}, allPosts = []) {
  let out = removeLegacyContextualInterlinks(html);
  const articleMatch = out.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) return out;

  const articleInner = articleMatch[1] || '';
  const paragraphMatches = [...articleInner.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)];
  if (paragraphMatches.length < 3) return out;

  const candidates = getInlineInterlinkCandidates(currentPost, allPosts, articleInner, 3);
  if (!candidates.length) return out;

  const insertionIndexes = pickInlineInsertionIndexes(paragraphMatches.length, candidates.length);
  if (!insertionIndexes.length) return out;

  const insertions = new Map();
  candidates.slice(0, insertionIndexes.length).forEach((candidate, idx) => {
    insertions.set(insertionIndexes[idx], buildInlineInterlinkParagraph(candidate, idx));
  });

  let paragraphIndex = -1;
  const patchedInner = articleInner.replace(/(<p\b[^>]*>[\s\S]*?<\/p>)/gi, (full) => {
    paragraphIndex += 1;
    const addition = insertions.get(paragraphIndex);
    return addition ? `${full}
      ${addition}` : full;
  });

  return out.replace(articleMatch[0], articleMatch[0].replace(articleInner, patchedInner));
}

function removeLegacyContextualInterlinks(html = '') {
  return html.replace(/\s*<p[^>]*class="[^"]*bd-inline-link[^"]*"[^>]*data-bd-inline-link="true"[^>]*>[\s\S]*?<\/p>\s*/gi, '\n');
}

function getInlineInterlinkCandidates(currentPost = {}, allPosts = [], articleInner = '', limit = 3) {
  const articleText = strip(articleInner);
  const alreadyLinkedUrls = new Set([...articleInner.matchAll(/href="([^"]+)"/gi)].map(match => match[1]));
  const currentTags = new Set((currentPost.tags || []).map(normalizeTag));
  const currentTokens = tokenize(`${currentPost.title || ''} ${currentPost.description || ''} ${currentPost.lead || ''} ${currentPost.body || ''}`);

  return allPosts
    .filter(post => post.slug !== currentPost.slug)
    .filter(post => !alreadyLinkedUrls.has(post.url))
    .map(post => {
      const postTags = new Set((post.tags || []).map(normalizeTag));
      const sharedTags = [...postTags].filter(tag => currentTags.has(tag));
      const postTokens = tokenize(`${post.title || ''} ${post.description || ''} ${post.lead || ''} ${post.body || ''}`);
      const sharedTokens = intersectionSize(currentTokens, postTokens);
      const sameLineBonus = post.line && currentPost.line && post.line === currentPost.line ? 6 : 0;
      const freshnessBonus = post.date && currentPost.date && post.date >= currentPost.date ? 1 : 0;
      const titlePenalty = articleText.toLowerCase().includes(String(post.title || '').toLowerCase()) ? -2 : 0;
      const score = (sharedTags.length * 10) + (sharedTokens * 2) + sameLineBonus + freshnessBonus + titlePenalty;
      return { ...post, _score: score, _sharedTags: sharedTags };
    })
    .filter(post => post._score >= 6)
    .sort((a, b) => b._score - a._score || b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'))
    .slice(0, limit);
}

function pickInlineInsertionIndexes(paragraphCount = 0, candidateCount = 0) {
  if (paragraphCount < 3 || candidateCount <= 0) return [];
  const base = [1, Math.max(2, Math.floor(paragraphCount / 2)), Math.max(3, paragraphCount - 2)]
    .filter(index => index < paragraphCount);
  const unique = [];
  for (const index of base) {
    if (!unique.includes(index)) unique.push(index);
  }
  return unique.slice(0, candidateCount);
}

function buildInlineInterlinkParagraph(candidate = {}, idx = 0) {
  const context = candidate._sharedTags && candidate._sharedTags.length
    ? `, sobre todo por ${candidate._sharedTags.slice(0, 2).join(' y ')}`
    : '';

  const templates = [
    `Si esta idea te resuena, también puede servirte <a href="${candidate.url}">${escapeHtml(candidate.title)}</a>${escapeHtml(context)}, donde la misma línea aparece desde otro ángulo.`,
    `Hay otra punta de este mismo hilo en <a href="${candidate.url}">${escapeHtml(candidate.title)}</a>${escapeHtml(context)}, y suma bastante para empujar la lectura un poco más.`,
    `Para abrir todavía más esta búsqueda, también entra bien <a href="${candidate.url}">${escapeHtml(candidate.title)}</a>${escapeHtml(context)}, porque toca una parte cercana sin repetir lo mismo.`
  ];

  return `<p class="bd-inline-link" data-bd-inline-link="true">${templates[idx % templates.length]}</p>`;
}

function writeInstitutionalPages() {
  const authorDir = path.join(ROOT, 'autor');
  fs.mkdirSync(authorDir, { recursive: true });

  const contactHtml = injectStatcounter(injectAdsense(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contacto | buenosdia.com</title>
  <meta name="description" content="Página de contacto editorial de buenosdia.com, con email, Instagram y páginas institucionales visibles para lectores y buscadores.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${SITE_URL}${CONTACT_PAGE_PATH}">
  <style>${sharedTagPageCss()}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">Buenos Días</a>
      <nav>
        <a href="/">Inicio</a>
        <a href="/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>
        <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a>
        <a href="${CONTACT_PAGE_PATH}" aria-current="page">Contacto</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Contacto editorial</p>
        <h1>Cómo contactar buenosdia.com</h1>
        <p>Esta página reúne los datos visibles del proyecto para que lectores, buscadores y revisiones editoriales encuentren una referencia clara, humana y directa.</p>
      </section>
      <section class="card">
        <h2 class="block-title">Canales de contacto</h2>
        <div class="tag-cloud">
          <a class="tag" href="${CONTACT_EMAIL_MAILTO}">${CONTACT_EMAIL}</a>
          <a class="tag" href="${CONTACT_INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">Instagram ${CONTACT_INSTAGRAM_HANDLE}</a>
          <a class="tag" href="${AUTHOR_PAGE_PATH}">Quién escribe</a>
        </div>
      </section>
      <section class="card">
        <h2 class="block-title">Para qué existe esta página</h2>
        <p class="block-sub">Buenosdia.com publica textos originales y humanos. Esta página ayuda a que el proyecto tenga una identidad editorial visible, con vías reales de contacto y contexto claro sobre quién está detrás.</p>
      </section>
    </main>
    <footer class="site-footer">
      <p><a href="${CONTACT_EMAIL_MAILTO}">${CONTACT_EMAIL}</a> · <a href="${CONTACT_INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">${CONTACT_INSTAGRAM_HANDLE}</a></p>
    </footer>
  </div>
</body>
</html>`));
  fs.writeFileSync(path.join(ROOT, 'contacto.html'), contactHtml, 'utf8');

  const authorHtml = injectStatcounter(injectAdsense(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${AUTHOR_NAME} | Quién escribe | buenosdia.com</title>
  <meta name="description" content="Perfil editorial de ${AUTHOR_NAME}, responsable de la línea de textos y publicaciones de buenosdia.com.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${SITE_URL}${AUTHOR_PAGE_PATH}">
  <style>${sharedTagPageCss()}</style>
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Person','name':AUTHOR_NAME,'jobTitle':AUTHOR_ROLE,'description':AUTHOR_SHORT_BIO,'url':`${SITE_URL}${AUTHOR_PAGE_PATH}`})}</script>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">Buenos Días</a>
      <nav>
        <a href="/">Inicio</a>
        <a href="/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>
        <a href="${AUTHOR_PAGE_PATH}" aria-current="page">Quién escribe</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Autor</p>
        <h1>${AUTHOR_NAME}</h1>
        <p>${AUTHOR_ROLE}. ${AUTHOR_SHORT_BIO}</p>
      </section>
      <section class="card">
        <h2 class="block-title">Perfil editorial</h2>
        <p class="block-sub">Detrás de Buenos Días hay una búsqueda de textos cercanos, legibles y originales, pensados para acompañar mañanas reales sin sonar mecánicos ni vacíos.</p>
      </section>
      <section class="card">
        <h2 class="block-title">Enlaces útiles</h2>
        <div class="tag-cloud">
          <a class="tag" href="/quienes-somos.html">Quiénes somos</a>
          <a class="tag" href="/politica-editorial.html">Política editorial</a>
          <a class="tag" href="${CONTACT_PAGE_PATH}">Contacto</a>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <p><a href="${CONTACT_PAGE_PATH}">Contacto</a> · <a href="/politica-editorial.html">Política editorial</a></p>
    </footer>
  </div>
</body>
</html>`));
  fs.writeFileSync(path.join(authorDir, 'aspf.html'), authorHtml, 'utf8');

  ensureInstitutionalFile('quienes-somos.html', 'Quiénes somos | buenosdia.com', 'Página institucional de Buenos Días con una presentación breve del proyecto editorial.', `
      <section class="hero">
        <p class="eyebrow">Quiénes somos</p>
        <h1>Un proyecto editorial simple y humano</h1>
        <p>Buenos Días reúne publicaciones originales sobre mañanas reales, claridad, cansancio, esperanza, sentido y reconstrucción. Busca una lectura directa, honesta y útil para personas reales.</p>
      </section>
      <section class="card">
        <h2 class="block-title">Qué hace este sitio</h2>
        <p class="block-sub">Publica textos propios, organiza etiquetas temáticas y prioriza una navegación simple. No intenta inflar páginas vacías ni hacerse pasar por lo que no es.</p>
      </section>`);

  ensureInstitutionalFile('politica-editorial.html', 'Política editorial | buenosdia.com', 'Criterios editoriales básicos de Buenos Días: originalidad, claridad, mantenimiento y señales visibles de autoría.', `
      <section class="hero">
        <p class="eyebrow">Política editorial</p>
        <h1>Cómo se publica en Buenos Días</h1>
        <p>El sitio prioriza textos originales, claridad de lectura, etiquetas coherentes e identidad visible del proyecto. Se evita publicar páginas débiles, contenido engañoso o piezas hechas solo para inflar tráfico.</p>
      </section>
      <section class="card">
        <h2 class="block-title">Criterios básicos</h2>
        <p class="block-sub">Cada publicación debe aportar una idea, una mirada o una compañía real al lector. Cuando una página queda floja, se revisa, se amplía, se fusiona o se retira.</p>
      </section>`);
}

function ensureInstitutionalFile(filename, title, description, mainContent) {
  const filePath = path.join(ROOT, filename);
  if (fs.existsSync(filePath)) return;
  const html = injectStatcounter(injectAdsense(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${SITE_URL}/${filename}">
  <style>${sharedTagPageCss()}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">Buenos Días</a>
      <nav>
        <a href="/">Inicio</a>
        <a href="/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>
        <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
      </nav>
    </header>
    <main>${mainContent}
    </main>
    <footer class="site-footer">
      <p><a href="${AUTHOR_PAGE_PATH}">Quién escribe</a> · <a href="${CONTACT_PAGE_PATH}">Contacto</a></p>
    </footer>
  </div>
</body>
</html>`));
  fs.writeFileSync(filePath, html, 'utf8');
}

function renderTagPages(tagMap) {
  const tags = Object.values(tagMap).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
  const strongTags = tags.filter(tag => tag.count >= TAG_STRONG_HIGHLIGHT_COUNT);
  const initialVisible = tags.slice(0, TAG_PAGE_INITIAL_VISIBLE);
  const remainingTags = tags.slice(TAG_PAGE_INITIAL_VISIBLE);

  let tagsIndexHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Etiquetas | buenosdia.com</title>
  <meta name="description" content="Explorá las etiquetas principales de buenosdia.com y entrá a las publicaciones relacionadas con cada tema.">
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
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Etiquetas</p>
        <h1>Todas las etiquetas</h1>
        <p>Las etiquetas más fuertes aparecen primero para que entrar por tema sea más claro y útil.</p>
      </section>

      <section class="card">
        <h2 class="block-title">Etiquetas más fuertes</h2>
        <div class="tag-cloud">
          ${strongTags.map(tag => `<a class="tag" href="/tags/${tag.slug}.html">${escapeHtml(tag.name)} <span>${tag.count}</span></a>`).join('')}
        </div>
      </section>

      <section class="card">
        <div class="tags-toolbar">
          <div>
            <h2 class="block-title">Buscar por etiqueta</h2>
            <p class="block-sub">Encontrá rápido el tema que querés leer.</p>
          </div>
          <input id="tagSearchInput" class="tag-search" type="search" placeholder="Buscar etiqueta...">
        </div>
        <div class="tag-cloud" id="allTagsCloud">
          ${initialVisible.map(tag => `<a class="tag" href="/tags/${tag.slug}.html" data-tag-name="${escapeHtml(tag.name)}">${escapeHtml(tag.name)} <span>${tag.count}</span></a>`).join('')}
        </div>
        ${remainingTags.length ? `<div class="load-more-wrap"><button id="showMoreTagsBtn" class="load-more" type="button">Ver más etiquetas</button></div>
        <div class="tag-cloud extra-tags" id="extraTagsCloud" hidden>
          ${remainingTags.map(tag => `<a class="tag" href="/tags/${tag.slug}.html" data-tag-name="${escapeHtml(tag.name)}">${escapeHtml(tag.name)} <span>${tag.count}</span></a>`).join('')}
        </div>` : ''}
      </section>
    </main>
    <footer class="site-footer">
      <p><a href="${CONTACT_PAGE_PATH}">Contacto</a> · <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a></p>
    </footer>
  </div>
  <script>
    const tagSearchInput = document.getElementById('tagSearchInput');
    const extraTagsCloud = document.getElementById('extraTagsCloud');
    const showMoreTagsBtn = document.getElementById('showMoreTagsBtn');

    if (showMoreTagsBtn && extraTagsCloud) {
      showMoreTagsBtn.addEventListener('click', () => {
        extraTagsCloud.hidden = !extraTagsCloud.hidden;
        showMoreTagsBtn.textContent = extraTagsCloud.hidden ? 'Ver más etiquetas' : 'Ver menos etiquetas';
      });
    }

    if (tagSearchInput) {
      tagSearchInput.addEventListener('input', () => {
        const value = tagSearchInput.value.toLowerCase().trim();
        const tags = document.querySelectorAll('[data-tag-name]');
        tags.forEach(tag => {
          const name = (tag.getAttribute('data-tag-name') || '').toLowerCase();
          tag.style.display = !value || name.includes(value) ? '' : 'none';
        });
      });
    }
  </script>
</body>
</html>`;

  tagsIndexHtml = injectAdsense(tagsIndexHtml);
  tagsIndexHtml = injectStatcounter(tagsIndexHtml);
  fs.writeFileSync(path.join(TAGS_DIR, 'index.html'), tagsIndexHtml, 'utf8');

  for (const tag of tags) {
    const tagPostsJson = JSON.stringify(tag.posts);
    const relatedTags = getStrongRelatedTags(tag, tagMap, 30);
    const introText = buildTagIntro(tag);

    let pageHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(tag.name)} | Etiquetas | buenosdia.com</title>
  <meta name="description" content="${escapeHtml(shortDescription(introText, 155))}">
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
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">Etiqueta</p>
        <h1>${escapeHtml(tag.name)}</h1>
        <p>${tag.count} publicación${tag.count === 1 ? '' : 'es'} relacionadas con este tema.</p>
        <div class="tag-intro">${escapeHtml(introText)}</div>
      </section>

      ${relatedTags.length ? `<section class="card">
        <div class="topics-head">
          <h2 class="block-title">Más temas para seguir navegando</h2>
          ${relatedTags.length > 15 ? '<button id="toggleRelatedTags" class="load-more" type="button">Ver más etiquetas</button>' : ''}
        </div>
        <div class="tag-cloud" id="relatedTagsCloud">
          ${relatedTags.slice(0, 15).map(item => `<a class="tag" href="/tags/${item.slug}.html">${escapeHtml(item.name)} <span>${item.count}</span></a>`).join('')}
        </div>
        ${relatedTags.length > 15 ? `<div class="tag-cloud extra-tags" id="moreRelatedTags" hidden>${relatedTags.slice(15).map(item => `<a class="tag" href="/tags/${item.slug}.html">${escapeHtml(item.name)} <span>${item.count}</span></a>`).join('')}</div>` : ''}
      </section>` : ''}

      <section class="posts-grid" id="tagPostsList"></section>
      <div class="load-more-wrap">
        <button id="tagLoadMoreBtn" class="load-more" type="button" hidden>Ver más publicaciones</button>
      </div>
      <div id="tagPostsSentinel" aria-hidden="true"></div>
    </main>
    <footer class="site-footer">
      <p><a href="${CONTACT_PAGE_PATH}">Contacto</a> · <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a></p>
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

    const toggleRelatedTags = document.getElementById('toggleRelatedTags');
    const moreRelatedTags = document.getElementById('moreRelatedTags');
    if (toggleRelatedTags && moreRelatedTags) {
      toggleRelatedTags.addEventListener('click', () => {
        moreRelatedTags.hidden = !moreRelatedTags.hidden;
        toggleRelatedTags.textContent = moreRelatedTags.hidden ? 'Ver más etiquetas' : 'Ver menos etiquetas';
      });
    }
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
  html = html.replace(/<nav>[\s\S]*?<\/nav>/i, `<nav>
        <a href="#inicio">Inicio</a>
        <a href="https://www.buenosdia.com/#publicaciones">Publicaciones</a>
        <a href="/tags/">Etiquetas</a>
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>
        <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
      </nav>`);
  html = html.replace(/<div class="contact-strip">[\s\S]*?<\/div>/i, `<div class="contact-strip">Contacto editorial: <a href="${CONTACT_PAGE_PATH}">abrir página de contacto</a> · <a href="${AUTHOR_PAGE_PATH}">quién escribe</a></div>`);
  html = html.replace(/<footer>[\s\S]*?<\/footer>/i, `<footer>
      © 2026 buenosdia.com — mañanas reales, palabras que acompañan. ·
      <a href="/quienes-somos.html">Quiénes somos</a> ·
      <a href="/politica-editorial.html">Política editorial</a> ·
      <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a> ·
      <a href="${CONTACT_PAGE_PATH}">Contacto</a>
    </footer>`);
  html = html.replace(/<h3>Sobre este espacio<\/h3>[\s\S]*?<\/section>/i, `<h3>Sobre este espacio</h3>
          <p style="margin:0;color:#667085;line-height:1.7;">
            Buenos Días reúne textos más humanos, originales y trabajados para acompañar mañanas reales. No busca llenar por llenar: busca dejar una idea, ordenar una emoción o abrir una salida concreta en medio del día.
          </p>
        </section>`);
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
        <a href="/quienes-somos.html">Quiénes somos</a>
        <a href="/politica-editorial.html">Política editorial</a>
        <a href="${CONTACT_PAGE_PATH}">Contacto</a>
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
      <p><a href="${CONTACT_PAGE_PATH}">Contacto</a> · <a href="${AUTHOR_PAGE_PATH}">Quién escribe</a></p>
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
  const tagUrls = Object.values(tagMap).map(tag => `  <url>
    <loc>${SITE_URL}/tags/${tag.slug}.html</loc>
    <lastmod>${today()}</lastmod>
  </url>`);
  const postUrls = posts.map(post => `  <url>
    <loc>${SITE_URL}${post.url}</loc>
    <lastmod>${post.date}</lastmod>
  </url>`);
  const institutionalUrls = [
    `${SITE_URL}${CONTACT_PAGE_PATH}`,
    `${SITE_URL}${AUTHOR_PAGE_PATH}`,
    `${SITE_URL}/quienes-somos.html`,
    `${SITE_URL}/politica-editorial.html`
  ].map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${today()}</lastmod>
  </url>`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today()}</lastmod>
  </url>
  <url>
    <loc>${SITE_URL}/tags/</loc>
    <lastmod>${today()}</lastmod>
  </url>
${institutionalUrls.join('\n')}
${postUrls.join('\n')}
${tagUrls.join('\n')}
</urlset>
`;
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
      const sameLineBonus = post.line && currentPost.line && post.line === currentPost.line ? 8 : 0;
      const score = (sharedTags * 12) + (sharedTokens * 2) + sameLineBonus + (post.date === currentPost.date ? 1 : 0);
      return { ...post, _score: score };
    })
    .filter(post => post._score > 0)
    .sort((a, b) => b._score - a._score || b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'))
    .slice(0, limit);
}


function buildLineMap(posts) {
  const map = {};
  for (const post of posts) {
    if (!post.line) continue;
    if (!map[post.line]) map[post.line] = [];
    map[post.line].push(post);
  }
  for (const line of Object.keys(map)) {
    map[line].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'));
  }
  return map;
}

function renderLineSection(currentPost, lineMap, limit = 4) {
  if (!BD_FEATURE_EDITORIAL_BLOCKS || !currentPost.line || !lineMap[currentPost.line]) return '';
  const items = lineMap[currentPost.line].filter(post => post.slug !== currentPost.slug).slice(0, limit);
  if (!items.length) return '';
  const lineTitle = {
    base: 'Más de esta línea base',
    visual: 'Más de esta línea visual',
    viva: 'Más de esta línea viva',
    alma: 'Más de esta línea alma'
  }[currentPost.line] || 'Más de esta línea';

  const lineSubtitle = {
    base: 'Textos buscables, claros y útiles para sostener el sitio.',
    visual: 'Piezas guardables, simples y recortables para circular mejor.',
    viva: 'Textos más humanos y de pulso actual, con más sensación de presente.',
    alma: 'Textos con más eje, más centro y más identidad de fondo.'
  }[currentPost.line] || 'Seguí navegando por publicaciones emparentadas con este tono.';

  return renderAutoSection(`linea-editorial-${currentPost.line}`, lineTitle, lineSubtitle, items);
}

function ensureFeaturedQuote(html = '', currentPost = {}) {
  if (/class="[^"]*featured-quote[^"]*"/i.test(html) || /class="[^"]*frase-destacada[^"]*"/i.test(html)) {
    return html;
  }

  const quote = escapeHtml(buildFallbackQuote(currentPost));
  if (!quote) return html;

  const block = `\n      <blockquote class="featured-quote">${quote}</blockquote>`;

  if (/<\/article>/i.test(html)) {
    return html.replace(/<\/article>/i, `${block}\n    </article>`);
  }

  return html;
}

function buildFallbackQuote(post = {}) {
  const candidates = [
    firstSentence(post.description),
    firstSentence(post.lead),
    firstSentence(post.body)
  ].filter(Boolean);

  for (const candidate of candidates) {
    const clean = candidate.replace(/^['"“”‘’]+|['"“”‘’]+$/g, '').trim();
    if (clean.length >= 40 && clean.length <= 180) return clean;
  }

  if (post.title) return strip(post.title);
  return 'Hay días en los que seguir ya es una forma silenciosa de reconstrucción.';
}

function firstSentence(text = '') {
  const clean = strip(text);
  if (!clean) return '';
  const matchSentence = clean.match(/^[^.?!]+[.?!]?/);
  return (matchSentence ? matchSentence[0] : clean).trim();
}

function extractArticleDate(html = '', previousDate = '') {
  const jsonLdDate =
    match(html, /"datePublished"\s*:\s*"(.*?)"/is) ||
    match(html, /<meta\s+property="article:published_time"\s+content="(.*?)"\s*\/?>/is) ||
    match(html, /<meta\s+name="article:published_time"\s+content="(.*?)"\s*\/?>/is);

  const visibleDate =
    match(html, /Buenos\s*d[ií]as\s*de\s*verdad\s*[·•\-]\s*(\d{4}-\d{2}-\d{2})/is) ||
    match(html, /<div[^>]*class="eyebrow"[^>]*>[\s\S]*?(\d{4}-\d{2}-\d{2})[\s\S]*?<\/div>/is);

  return normalizeDateString(jsonLdDate) || normalizeDateString(visibleDate) || normalizeDateString(previousDate) || today();
}

function normalizeDateString(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function extractEditorialLineOverride(html = '') {
  const direct =
    match(html, /<meta\s+name="bd:line"\s+content="(.*?)"\s*\/?>/is) ||
    match(html, /<meta\s+property="bd:line"\s+content="(.*?)"\s*\/?>/is);

  const normalized = normalizeText(direct);
  return ['base', 'visual', 'viva', 'alma'].includes(normalized) ? normalized : '';
}

function detectEditorialLine(post = {}) {
  const override = normalizeText(post.lineOverride || '');
  if (['base', 'visual', 'viva', 'alma'].includes(override)) return override;

  const title = normalizeText(post.title || '');
  const tagText = normalizeText((post.tags || []).join(' '));
  const body = normalizeText(`${post.description || ''} ${post.lead || ''} ${post.body || ''}`);
  const text = `${title} ${tagText} ${body}`.trim();

  const score = { base: 0, visual: 0, viva: 0, alma: 0 };

  const baseTerms = ['como ', 'como-', 'por que', 'que hacer', 'momento', 'elegir', 'recomponerse', 'sobrevivir', 'influir', 'afecta', 'desactivar'];
  const visualTerms = ['frases', 'mensajes', 'ideas', 'palabras', 'textos para compartir', 'imagenes', 'imagen', 'postal', 'estado', 'estados', 'indirectas'];
  const vivaTerms = ['hoy', 'lunes', 'lluvia', 'tarde', 'noche', 'amigos', 'fiesta', 'laburar', 'rutina', 'despertas', 'despertas', 'durante el dia', 'al otro dia'];
  const almaTerms = ['matrix', 'frecuencia', 'sintonia', 'centro', 'alma', 'ruido', 'conciencia', 'verdad', 'eje interno', 'energia ajena', 'interferencia'];

  if (title.startsWith('como ') || title.startsWith('cómo ')) score.base += 6;
  if (title.includes('frases') || title.includes('mensajes')) score.visual += 8;
  if (title.startsWith('cuando ')) score.viva += 3;

  for (const term of baseTerms) if (text.includes(term)) score.base += 2;
  for (const term of visualTerms) if (text.includes(term)) score.visual += 2;
  for (const term of vivaTerms) if (text.includes(term)) score.viva += 2;
  for (const term of almaTerms) if (text.includes(term)) score.alma += 3;

  const entries = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [winner, topScore] = entries[0];

  if (topScore <= 0) return 'viva';
  if (winner === 'visual' && score.visual < 4) return 'viva';
  return winner;
}

function loadPreviousPostsBySlug() {
  try {
    if (!fs.existsSync(POSTS_JSON)) return {};
    const raw = fs.readFileSync(POSTS_JSON, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return {};
    return Object.fromEntries(parsed.filter(Boolean).map(post => [post.slug, post]));
  } catch {
    return {};
  }
}


function enhancePostDiscover(html = '', currentPost = {}) {
  let out = html;
  const featuredImageUrl = getFeaturedImageUrl(currentPost);
  out = cleanupLegacyAutoFeaturedImages(out);
  out = ensureDiscoverRobots(out);
  if (featuredImageUrl) out = ensureOgImage(out, featuredImageUrl);
  out = ensureArticleStructuredData(out, currentPost, featuredImageUrl);
  out = ensureFeaturedImageBlock(out, currentPost, featuredImageUrl);
  return out;
}



function getFeaturedImageUrl(post = {}) {
  try {
    if (!fs.existsSync(IMAGE_DIR)) return '';
    const candidates = [];
    for (const tag of post.tags || []) {
      const slug = slugify(tag);
      if (slug) candidates.push(slug);
    }
    if (post.line) candidates.push(post.line);
    const seen = new Set();
    for (const candidate of [...candidates, 'base', 'visual', 'viva', 'alma']) {
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      const filePath = path.join(IMAGE_DIR, `${candidate}.webp`);
      if (fs.existsSync(filePath)) return `/assets/imagenes-tematicas/${candidate}.webp`;
    }
    return '';
  } catch {
    return '';
  }
}



function ensureDiscoverRobots(html = '') {
  if (/max-image-preview:large/i.test(html)) return html;
  if (/<meta\s+name="robots"/i.test(html)) {
    return html.replace(/<meta\s+name="robots"\s+content="([^"]*)"\s*\/?>/i, (full, content) => {
      const current = String(content || '').trim();
      if (/max-image-preview:large/i.test(current)) return full;
      const next = current ? `${current},max-image-preview:large` : 'index,follow,max-image-preview:large';
      return `<meta name="robots" content="${next}">`;
    });
  }
  return html.replace(/<link rel="canonical"[^>]*>/i, match => `${match}
  <meta name="robots" content="index,follow,max-image-preview:large">`);
}

function ensureOgImage(html = '', imageUrl = '') {
  if (!imageUrl) return html;
  const fullUrl = `${SITE_URL}${imageUrl}`;
  if (/<meta\s+property="og:image"/i.test(html)) {
    return html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${fullUrl}">`);
  }
  return html.replace(/<link rel="canonical"[^>]*>/i, match => `${match}\n  <meta property="og:image" content="${fullUrl}">`);
}



function hasManualArticleImage(html = '') {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) return false;
  return /<img\b/i.test(articleMatch[1]);
}



function ensureFeaturedImageBlock(html = '', post = {}, imageUrl = '') {
  let out = cleanupLegacyAutoFeaturedImages(html);
  if (!imageUrl) return ensureContentImagesResponsive(out);

  if (/<main[^>]*>[\s\S]*?<img\b/i.test(out)) {
    return ensureContentImagesResponsive(out);
  }

  const imageBlock = `\n      <div class="bd-post-hero"><a href="${imageUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="${escapeHtml(post.title || 'buenosdia.com')}" loading="eager" decoding="async"></a></div>`;
  if (/<div[^>]*class="[^"]*meta[^"]*"[^>]*>/i.test(out)) {
    out = out.replace(/(<div[^>]*class="[^"]*meta[^"]*"[^>]*>)/i, `${imageBlock}\n$1`);
  } else if (/<article\b/i.test(out)) {
    out = out.replace(/(<article\b[^>]*>)/i, `${imageBlock}\n$1`);
  } else if (/<main\b[^>]*>/i.test(out)) {
    out = out.replace(/(<main\b[^>]*>)/i, `$1${imageBlock}`);
  }
  return ensureContentImagesResponsive(out);
}



function ensureArticleStructuredData(html = '', post = {}, imageUrl = '') {
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title || 'buenosdia.com',
    description: shortDescription(post.description || post.lead || post.body || '', 180),
    datePublished: post.date || today(),
    dateModified: post.date || today(),
    mainEntityOfPage: `${SITE_URL}${post.url || ''}`,
    author: { '@type': 'Person', name: AUTHOR_NAME, url: `${SITE_URL}${AUTHOR_PAGE_PATH}` },
    publisher: { '@type': 'Organization', name: PUBLISHER_NAME, url: SITE_URL },
    image: imageUrl ? [`${SITE_URL}${imageUrl}`] : undefined
  }, null, 2);

  const script = `
  <script type="application/ld+json" data-bd-schema="article">
${structuredData}
  </script>`;
  if (/data-bd-schema="article"/i.test(html)) {
    return html.replace(/\s*<script type="application\/ld\+json" data-bd-schema="article">[\s\S]*?<\/script>/i, script);
  }
  return html.replace(/<\/head>/i, `${script}
</head>`);
}

function removeContentImages(html = '') {
  return html;
}



function sharedTagPageCss() {
  return `:root{--bg:#f6f3ee;--card:#fffdfa;--text:#171717;--muted:#667085;--line:#e7e1d8;--pill:#f5f5f4;--shadow:0 10px 25px rgba(0,0,0,.05);--radius:22px;--max:1100px}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--text)}.wrap{max-width:var(--max);margin:0 auto;padding:28px 20px 70px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:22px}.brand{text-decoration:none;color:#111827;font-weight:700;font-size:1.2rem}nav a{text-decoration:none;color:var(--muted);margin-left:20px;font-size:1rem}.hero,.card,.post-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.hero{padding:34px;margin-bottom:22px}.hero h1{margin:0 0 12px;font-size:clamp(2rem,5vw,3.5rem);line-height:1.02;letter-spacing:-.05em}.hero p{margin:0;color:#475467;line-height:1.65;font-size:1.08rem}.hero .tag-intro{margin-top:18px;color:#475467;line-height:1.75;font-size:1.03rem}.eyebrow{color:var(--muted);font-size:1rem;margin-bottom:14px}.card{padding:24px}.block-title{margin:0 0 8px;font-size:1.2rem;line-height:1.2}.block-sub{margin:0 0 16px;color:#667085;line-height:1.6}.topics-head,.tags-toolbar{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:14px}.tag-search{border:1px solid var(--line);background:#fff;border-radius:999px;padding:12px 16px;font-size:1rem;min-width:260px;max-width:100%}.tag-cloud{display:flex;flex-wrap:wrap;gap:12px}.extra-tags{margin-top:14px}.tag-cloud-scroll{max-height:460px;overflow:auto;padding-right:4px}.tag{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--pill);color:#475467;border-radius:999px;padding:10px 14px;font-size:.98rem;text-decoration:none}.tag span{display:inline-block;background:#fff;border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:.86rem}.tag.active{background:#111827;color:#fff}.tag.active span{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);color:#fff}.posts-grid{display:grid;gap:18px;margin-top:22px}.post-card{padding:26px}.post-card h2{margin:0 0 10px;font-size:1.45rem;line-height:1.2;letter-spacing:-.03em}.post-card p{margin:0 0 18px;color:#475467;font-size:1.02rem;line-height:1.65}.read-link{text-decoration:none;color:#111827;font-weight:700}.read-link:hover{text-decoration:underline}.load-more-wrap{display:flex;justify-content:center;margin-top:18px}.load-more{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:999px;padding:12px 18px;font-size:1rem;cursor:pointer;box-shadow:var(--shadow)}.load-more[hidden]{display:none}.site-footer{margin-top:22px;color:var(--muted);font-size:.95rem}.site-footer a{color:#111827;font-weight:700;text-decoration:none}.site-footer a:hover{text-decoration:underline}@media (max-width:800px){header{flex-direction:column}nav a{margin:0 18px 0 0}.tag-search{min-width:100%}}`;
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
  const normalized = normalizeText(tag).replace(/\s+/g, ' ').trim();
  return TAG_ALIASES[normalized] || normalized;
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

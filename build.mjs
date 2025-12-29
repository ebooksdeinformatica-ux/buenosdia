// build.mjs (ESM)
// Genera dist/ completo desde templates + estructura posts/
// - Home: /index.html
// - Categorías: /posts/<categoria>/index.html
// - Tags: /tags/<tag>/index.html (si hay tags)
// - Contacto: /contacto/index.html
// - Copia assets: /css /js /img /posts /ads.txt
// - SEO: canonical + OG/Twitter auto + sitemap premium + robots.txt
// - AdSense: inyecta snippet en head

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TEMPLATES = path.join(ROOT, "templates");

const SITE = {
  url: "https://buenosdia.com",
  brandMini: "BUENOSDIAS.COM",
  title: "Buenos días de verdad",
  tagline: "Hecho para abrir rápido, leer fácil y sentir que te hablan a vos. Sin humo.",
  year: new Date().getFullYear(),
  // AdSense: lo pediste tal cual
  adsenseHead: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267" crossorigin="anonymous"></script>`,
  // Imagen OG default (la generamos después, dejá este path)
  ogImage: "/img/og-default.webp",
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const cleanDist = () => {
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);
};

const readText = (p) => fs.readFileSync(p, "utf8");
const writeText = (p, s) => {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
};

const exists = (p) => fs.existsSync(p);

const copyDir = (src, dest) => {
  if (!exists(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
};

const escapeHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const slugToTitle = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqBy = (arr, keyFn) => {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
};

function buildSocialMeta({ pageUrl, title, description, imageUrl }) {
  const canonical = pageUrl;
  const ogImg = imageUrl || `${SITE.url}${SITE.ogImage}`;
  const t = escapeHtml(title);
  const d = escapeHtml(description);

  return [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.title)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${ogImg}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${ogImg}" />`,
  ].join("\n  ");
}

function render(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v ?? "");
  }
  return out;
}

// Detecta categorías por carpetas en /posts/<categoria>/
function scanCategories() {
  const postsRoot = path.join(ROOT, "posts");
  if (!exists(postsRoot)) return [];

  const cats = fs
    .readdirSync(postsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    // IMPORTANTÍSIMO: dedupe por slug normalizado (evita duplicados raros)
    .map((slug) => ({
      slug: normalize(slug).replaceAll(" ", "-"),
      realFolder: slug,
    }));

  // si tenías carpetas con acentos/espacios, esto evita que aparezcan dobles:
  const uniq = uniqBy(cats, (c) => c.slug);
  return uniq.sort((a, b) => a.slug.localeCompare(b.slug));
}

// Escanea posts reales dentro de /posts/<cat>/<post>/index.html
function scanPosts(categories) {
  const all = [];
  for (const c of categories) {
    const catPath = path.join(ROOT, "posts", c.realFolder);
    if (!exists(catPath)) continue;

    const children = fs.readdirSync(catPath, { withFileTypes: true });
    for (const ch of children) {
      if (!ch.isDirectory()) continue;
      const postFolder = path.join(catPath, ch.name);
      const indexHtml = path.join(postFolder, "index.html");
      if (!exists(indexHtml)) continue;

      // mini metadata desde <title> y meta description si existe
      const html = readText(indexHtml);
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);

      const title = (titleMatch?.[1] || slugToTitle(ch.name)).trim();
      const description = (descMatch?.[1] || "").trim();

      const urlPath = `/posts/${c.slug}/${ch.name}/`;
      all.push({
        categorySlug: c.slug,
        categoryName: slugToTitle(c.slug),
        postSlug: ch.name,
        title,
        description,
        urlPath,
        // lastmod: mtime del archivo
        lastmod: fs.statSync(indexHtml).mtime,
      });
    }
  }

  // últimos primero
  all.sort((a, b) => b.lastmod - a.lastmod);
  return all;
}

// Tags: si más adelante agregás tags en data-tags="a,b,c" dentro del HTML del post
function scanTags(posts) {
  const tagMap = new Map();
  for (const p of posts) {
    const postIndex = path.join(ROOT, "posts", p.categorySlug, p.postSlug, "index.html");
    // OJO: si el folder real difiere, no usamos esto; por eso tags se mantiene simple por ahora
  }
  // sin tags por defecto
  return { tags: [], tagToPosts: new Map() };
}

function buildCategoryDescription(catSlug, catPosts) {
  // “SEO premium” sin IA externa: arma una descripción humana a partir de títulos/temas
  if (!catPosts.length) return "";

  const bag = [];
  for (const p of catPosts.slice(0, 10)) {
    bag.push(...normalize(p.title).split(" "));
  }

  const stop = new Set([
    "de","la","el","y","a","en","un","una","para","por","con","sin","que","como","del","los","las","al",
    "hoy","manana","mañana","real","reales","verdad","buenos","dias","día",
  ]);

  const freq = new Map();
  for (const w of bag) {
    if (!w || w.length < 4) continue;
    if (stop.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  const top = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 6).map(([w])=>w);

  const human = [
    `Esta categoría es para cuando ${catSlug.replaceAll("-", " ")} te toca de cerca.`,
    `Textos cortos, directos, sin careta: para arrancar el día con algo real.`,
    top.length ? `Si venís buscando temas como ${top.join(", ")}, acá vas a encontrar de lo tuyo.` : `Acá juntamos lo que importa, sin humo.`,
  ].join(" ");

  return human;
}

function buildCategoryKeywords(catSlug, catPosts) {
  const base = ["buenosdia.com", "mañanas reales", "texto humano", "sin humo", catSlug.replaceAll("-", " ")];
  const extra = [];
  for (const p of catPosts.slice(0, 8)) extra.push(...normalize(p.title).split(" "));
  const freq = new Map();
  for (const w of extra) {
    if (!w || w.length < 4) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const top = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 10).map(([w])=>w);
  return [...new Set([...base, ...top])].join(", ");
}

function formatDateISO(d) {
  const x = new Date(d);
  return x.toISOString();
}

function buildSitemap(urlEntries) {
  const urls = urlEntries
    .map((u) => {
      return `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`.trim();
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;
}

function pillLink(href, label) {
  return `<a class="pill" href="${href}">${escapeHtml(label)}</a>`;
}

function postCard(p) {
  const desc = p.description ? `<p class="muted">${escapeHtml(p.description)}</p>` : `<p class="muted">Entrar →</p>`;
  return `
  <article class="card">
    <a class="cardlink" href="${p.urlPath}">
      <div class="cardtitle">${escapeHtml(p.title)}</div>
      ${desc}
      <div class="cardmeta">Categoría: ${escapeHtml(p.categoryName)}</div>
    </a>
  </article>`.trim();
}

function buildHome({ categories, posts }) {
  const tpl = readText(path.join(TEMPLATES, "index.template.html"));

  const catsHtml = categories.map((c) => pillLink(`/posts/${c.slug}/`, slugToTitle(c.slug))).join("\n      ");

  const latest = posts.slice(0, 12);
  const postsGrid = latest.length
    ? latest.map(postCard).join("\n")
    : `<div class="empty">Todavía no hay publicaciones. Subí tu primer post en <code>/posts/&lt;categoria&gt;/&lt;post&gt;/index.html</code>.</div>`;

  const pageTitle = `${SITE.title} · ${SITE.brandMini}`;
  const pageDesc = SITE.tagline;

  const socialMeta = buildSocialMeta({
    pageUrl: `${SITE.url}/`,
    title: pageTitle,
    description: pageDesc,
    imageUrl: `${SITE.url}${SITE.ogImage}`,
  });

  const html = render(tpl, {
    PAGE_TITLE: escapeHtml(pageTitle),
    PAGE_DESCRIPTION: escapeHtml(pageDesc),
    SOCIAL_META: socialMeta,
    ADSENSE_HEAD: SITE.adsenseHead,
    SITE_BRAND: escapeHtml(SITE.brandMini),
    SITE_TITLE: escapeHtml(SITE.title),
    SITE_TAGLINE: escapeHtml(SITE.tagline),
    CATEGORIES_PILLS: catsHtml,
    POSTS_COUNT: String(posts.length),
    POSTS_GRID: postsGrid,
    TAGS_LIST: `<div class="empty">Todavía no hay etiquetas.</div>`,
    YEAR: String(SITE.year),
  });

  writeText(path.join(DIST, "index.html"), html);
}

function buildCategoryPages({ categories, posts }) {
  const tpl = readText(path.join(TEMPLATES, "category.template.html"));

  for (const c of categories) {
    const catPosts = posts.filter((p) => p.categorySlug === c.slug);

    const catTitle = slugToTitle(c.slug);
    const descVisible = buildCategoryDescription(c.slug, catPosts);
    const keywords = buildCategoryKeywords(c.slug, catPosts);

    const listHtml = catPosts.length
      ? catPosts.map(postCard).join("\n")
      : `<div class="empty">Todavía no hay posts en <b>${escapeHtml(catTitle)}</b>.</div>`;

    const catsHtml = categories.map((x) => pillLink(`/posts/${x.slug}/`, slugToTitle(x.slug))).join("\n      ");

    const pageTitle = `${catTitle} · ${SITE.title}`;
    const metaDesc = descVisible || `Posts de ${catTitle} en buenosdia.com. Textos reales, humanos, sin humo.`;
    const socialMeta = buildSocialMeta({
      pageUrl: `${SITE.url}/posts/${c.slug}/`,
      title: pageTitle,
      description: metaDesc,
      imageUrl: `${SITE.url}${SITE.ogImage}`,
    });

    const out = render(tpl, {
      PAGE_TITLE: escapeHtml(pageTitle),
      PAGE_DESCRIPTION: escapeHtml(metaDesc),
      PAGE_KEYWORDS: escapeHtml(keywords),
      SOCIAL_META: socialMeta,
      ADSENSE_HEAD: SITE.adsenseHead,
      SITE_BRAND: escapeHtml(SITE.brandMini),
      SITE_TITLE: escapeHtml(SITE.title),
      SITE_TAGLINE: escapeHtml(SITE.tagline),
      CATEGORIES_PILLS: catsHtml,
      CATEGORY_TITLE: escapeHtml(catTitle),
      CATEGORY_DESC: escapeHtml(descVisible),
      POSTS_COUNT: String(catPosts.length),
      POSTS_GRID: listHtml,
      YEAR: String(SITE.year),
    });

    writeText(path.join(DIST, "posts", c.slug, "index.html"), out);
  }
}

function buildContact() {
  const tpl = readText(path.join(TEMPLATES, "contact.template.html"));

  const pageTitle = `Contacto · ${SITE.title}`;
  const pageDesc = `Contacto de ${SITE.title}.`;

  const socialMeta = buildSocialMeta({
    pageUrl: `${SITE.url}/contacto/`,
    title: pageTitle,
    description: pageDesc,
    imageUrl: `${SITE.url}${SITE.ogImage}`,
  });

  const html = render(tpl, {
    PAGE_TITLE: escapeHtml(pageTitle),
    PAGE_DESCRIPTION: escapeHtml(pageDesc),
    SOCIAL_META: socialMeta,
    ADSENSE_HEAD: SITE.adsenseHead,
    SITE_BRAND: escapeHtml(SITE.brandMini),
    SITE_TITLE: escapeHtml(SITE.title),
    YEAR: String(SITE.year),
  });

  writeText(path.join(DIST, "contacto", "index.html"), html);
}

function buildSitemapAndRobots({ categories, posts }) {
  const entries = [];

  const now = new Date();

  // Home
  entries.push({
    loc: `${SITE.url}/`,
    lastmod: formatDateISO(now),
    changefreq: "daily",
    priority: "1.0",
  });

  // Contact
  entries.push({
    loc: `${SITE.url}/contacto/`,
    lastmod: formatDateISO(now),
    changefreq: "monthly",
    priority: "0.4",
  });

  // Categories
  for (const c of categories) {
    entries.push({
      loc: `${SITE.url}/posts/${c.slug}/`,
      lastmod: formatDateISO(now),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // Posts
  for (const p of posts) {
    entries.push({
      loc: `${SITE.url}${p.urlPath}`,
      lastmod: formatDateISO(p.lastmod),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  writeText(path.join(DIST, "sitemap.xml"), buildSitemap(entries));
  writeText(path.join(DIST, "robots.txt"), buildRobots());
}

function main() {
  cleanDist();

  // 1) Copiar assets al dist
  copyDir(path.join(ROOT, "css"), path.join(DIST, "css"));
  copyDir(path.join(ROOT, "js"), path.join(DIST, "js"));
  copyDir(path.join(ROOT, "img"), path.join(DIST, "img"));
  copyDir(path.join(ROOT, "posts"), path.join(DIST, "posts"));
  if (exists(path.join(ROOT, "ads.txt"))) fs.copyFileSync(path.join(ROOT, "ads.txt"), path.join(DIST, "ads.txt"));

  // 2) Escanear contenido
  const categories = scanCategories();
  const posts = scanPosts(categories);

  // 3) Páginas
  buildHome({ categories, posts });
  buildCategoryPages({ categories, posts });
  buildContact();

  // 4) SEO infra
  buildSitemapAndRobots({ categories, posts });

  console.log(`OK: dist generado. Categorías=${categories.length} Posts=${posts.length}`);
}

main();

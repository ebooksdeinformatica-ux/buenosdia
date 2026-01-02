#!/usr/bin/env node
/**
 * BUENOSDIAS2560 — SSG Build (determinístico, sin servicios externos)
 * - Genera /dist/index.html, /dist/categories/<cat>/index.html, /dist/tags/<tag>/index.html
 * - Genera /dist/sitemap.xml (con <lastmod>) y /dist/robots.txt
 * - Auto-actualiza cada build la descripción SEO de cada categoría según su contenido
 *   (si disparás un build mensual en Netlify, se refresca sola)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const SRC_POSTS = path.join(ROOT, "posts");
const SRC_TEMPLATES = path.join(ROOT, "templates");
const DIST = path.join(ROOT, "dist");

const SITE = {
  name: "BUENOSDIA.COM",
  url: (process.env.SITE_URL || "https://buenosdia.com").replace(/\/+$/,""),
  lang: "es-AR",
  author: "buenosdia.com",
};

const NOW = new Date();
const YEAR = String(NOW.getFullYear());

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readText(p) { return fs.readFileSync(p, "utf-8"); }
function writeText(p, s) { ensureDir(path.dirname(p)); fs.writeFileSync(p, s, "utf-8"); }
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

function cleanHtmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']\\s*\\/?>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? cleanHtmlToText(m[1]).trim() : "";
}

function extractFirstParagraphText(html) {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return m ? cleanHtmlToText(m[1]).trim() : "";
}

function extractTags(html) {
  // Soporta:
  // - meta name="keywords"
  // - data-tags="a,b,c" en algún elemento
  // - <!-- tags: a, b, c -->
  let tags = [];
  const kw = extractMeta(html, "keywords");
  if (kw) tags.push(...kw.split(",").map(s => s.trim()).filter(Boolean));

  const dt = html.match(/data-tags=["']([^"']+)["']/i);
  if (dt) tags.push(...dt[1].split(",").map(s=>s.trim()).filter(Boolean));

  const cm = html.match(/<!--\s*tags:\s*([\s\S]*?)-->/i);
  if (cm) tags.push(...cm[1].split(",").map(s=>s.trim()).filter(Boolean));

  // Normaliza
  tags = tags
    .map(t => t.toLowerCase())
    .map(t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) // sin acentos
    .map(t => t.replace(/[^a-z0-9\s-]/g, "").trim())
    .filter(Boolean);

  // Uniq
  return [...new Set(tags)];
}

// Palabras vacías ES (corta y segura)
const STOP = new Set([
  "a","al","algo","algunos","ante","antes","asi","aun","aunque","bajo","bien","cada","casi","como","con","contra","cual","cuando",
  "de","del","desde","donde","dos","el","ella","ellas","ellos","en","entre","era","eres","es","esa","ese","eso","esta","estaba",
  "estamos","estan","estar","este","esto","estos","fue","ha","hace","hacia","han","hasta","hay","la","las","le","les","lo","los",
  "mas","me","mi","mis","mismo","mucho","muy","no","nos","nuestra","nuestro","o","otra","para","pero","poco","por","porque","que",
  "quien","se","sea","ser","si","sin","sobre","solo","son","su","sus","tambien","te","tener","tiene","tu","tus","un","una","uno",
  "y","ya","vos","tuya","tuyo","porque","hoy","manana","ayer"
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOP.has(w));
}

function topKeywords(docs, limit = 10) {
  // TF-IDF lite (sin depender de libs)
  const N = docs.length || 1;
  const df = new Map();
  const tfs = [];

  for (const doc of docs) {
    const tokens = tokenize(doc);
    const tf = new Map();
    const seen = new Set();
    for (const w of tokens) {
      tf.set(w, (tf.get(w) || 0) + 1);
      if (!seen.has(w)) {
        df.set(w, (df.get(w) || 0) + 1);
        seen.add(w);
      }
    }
    tfs.push(tf);
  }

  const score = new Map();
  for (const tf of tfs) {
    for (const [w, c] of tf.entries()) {
      const d = df.get(w) || 1;
      const idf = Math.log((N + 1) / (d + 0.5));
      const s = c * idf;
      score.set(w, (score.get(w) || 0) + s);
    }
  }

  return [...score.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0, limit)
    .map(([w])=>w);
}

function sentenceSummaries(text, maxLen = 160) {
  // Agarra 1-2 frases cortas del inicio
  const t = text.replace(/\s+/g," ").trim();
  if (!t) return "";
  const parts = t.split(/(?<=[\.\!\?])\s+/).filter(Boolean);
  let out = "";
  for (const p of parts) {
    if ((out + " " + p).trim().length <= maxLen) out = (out + " " + p).trim();
    if (out.length >= Math.min(90, maxLen)) break;
  }
  if (!out) out = t.slice(0, maxLen);
  return out.replace(/\s+/g," ").trim();
}

function buildCategorySeoDescription(categoryName, posts) {
  // 1) Junta textos base
  const docs = posts.map(p => [p.title, p.excerpt, p.description].filter(Boolean).join(" "));
  const kw = topKeywords(docs, 10);

  // 2) Construye descripción con voz "el molde" (humana, breve, sin humo)
  const toneA = [
    `Acá no venís a “leer frases”. Venís a encontrarte.`,
    `Textos cortos, reales, para abrir el día sin maquillaje.`,
    `Si estás en una mañana rota, esto te habla como a vos.`,
  ];

  const toneB = [
    `En esta categoría: ${categoryName}.`,
    posts.length ? `Ahora mismo hay ${posts.length} publicaciones.` : `Todavía está naciendo.`,
  ];

  const toneC = kw.length
    ? `Se toca mucho: ${kw.slice(0, 6).join(", ")}.`
    : `De a poco se va armando con lo que vas viviendo.`;

  const raw = [...toneB, ...toneA, toneC].join(" ");
  return sentenceSummaries(raw, 170);
}

function slugify(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ensureTemplates() {
  ensureDir(SRC_TEMPLATES);
  const defaults = {
    "index.template.html": `<!doctype html>
<html lang="{{LANG}}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESCRIPTION}}">
<meta name="keywords" content="{{KEYWORDS}}">
<link rel="canonical" href="{{CANONICAL}}">
<meta property="og:title" content="{{TITLE}}">
<meta property="og:description" content="{{DESCRIPTION}}">
<meta property="og:type" content="website">
<meta property="og:url" content="{{CANONICAL}}">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
<header class="top">
  <a class="brand" href="/"><span class="logo">BD</span> <strong>BUENOSDIA.COM</strong></a>
  <nav class="nav">
    <a href="/">Inicio</a>
    <a href="/contacto/">Contacto</a>
  </nav>
  <div class="social">
    <a href="#" rel="nofollow">Instagram</a>
    <a href="#" rel="nofollow">Facebook</a>
    <a href="#" rel="nofollow">TikTok</a>
    <a href="#" rel="nofollow">Pinterest</a>
  </div>
</header>

<main class="wrap">
  <div class="pillbar">{{CATEGORIES_PILLS}}</div>

  <h1>TEXTOS PARA MAÑANAS REALES</h1>
  <h2>Este no es el típico blog de frases.</h2>
  <p>Hecho para abrir rápido, leer fácil y sentir que te hablan a vos. Sin humo.</p>

  <section class="block">
    <h3>Últimas publicaciones</h3>
    {{LATEST_POSTS}}
  </section>

  <section class="block">
    <h3>Etiquetas (top)</h3>
    {{TOP_TAGS}}
  </section>

  <footer class="foot">
    <p>Blanco. Minimal. Rápido. Humano. Sin humo.</p>
    <p>Hecho con <strong>VOZ</strong>, para <strong>VOS</strong>.</p>
    <p>Diseñado en {{YEAR}} — buenosdia.com</p>
  </footer>
</main>
<script src="/js/site.js" defer></script>
</body>
</html>`,

    "category.template.html": `<!doctype html>
<html lang="{{LANG}}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESCRIPTION}}">
<meta name="keywords" content="{{KEYWORDS}}">
<link rel="canonical" href="{{CANONICAL}}">
<meta property="og:title" content="{{TITLE}}">
<meta property="og:description" content="{{DESCRIPTION}}">
<meta property="og:type" content="website">
<meta property="og:url" content="{{CANONICAL}}">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
<header class="top">
  <a class="brand" href="/"><span class="logo">BD</span> <strong>BUENOSDIA.COM</strong></a>
  <nav class="nav">
    <a href="/">Inicio</a>
    <a href="/contacto/">Contacto</a>
  </nav>
</header>

<main class="wrap">
  <div class="pillbar">{{CATEGORIES_PILLS}}</div>
  <h1>{{H1}}</h1>
  <p class="desc">{{CATEGORY_SEO_DESCRIPTION}}</p>

  <section class="block">
    <h3>Publicaciones</h3>
    {{POST_LIST}}
  </section>

  <footer class="foot">
    <p>Diseñado en {{YEAR}} — buenosdia.com</p>
  </footer>
</main>
<script src="/js/site.js" defer></script>
</body>
</html>`,

    "tag.template.html": `<!doctype html>
<html lang="{{LANG}}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESCRIPTION}}">
<link rel="canonical" href="{{CANONICAL}}">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
<header class="top">
  <a class="brand" href="/"><span class="logo">BD</span> <strong>BUENOSDIA.COM</strong></a>
  <nav class="nav">
    <a href="/">Inicio</a>
    <a href="/contacto/">Contacto</a>
  </nav>
</header>

<main class="wrap">
  <h1>{{H1}}</h1>
  <section class="block">
    {{POST_LIST}}
  </section>
  <footer class="foot">
    <p>Diseñado en {{YEAR}} — buenosdia.com</p>
  </footer>
</main>
</body>
</html>`,

    "contact.template.html": `<!doctype html>
<html lang="{{LANG}}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESCRIPTION}}">
<link rel="canonical" href="{{CANONICAL}}">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
<header class="top">
  <a class="brand" href="/"><span class="logo">BD</span> <strong>BUENOSDIA.COM</strong></a>
  <nav class="nav">
    <a href="/">Inicio</a>
  </nav>
</header>
<main class="wrap">
  <h1>Contacto</h1>
  <p>Si querés decir algo (en serio), escribime.</p>
  <p><a href="mailto:hola@buenosdia.com">hola@buenosdia.com</a></p>
  <footer class="foot">
    <p>Diseñado en {{YEAR}} — buenosdia.com</p>
  </footer>
</main>
</body>
</html>`
  };

  for (const [file, content] of Object.entries(defaults)) {
    const p = path.join(SRC_TEMPLATES, file);
    if (!exists(p)) writeText(p, content);
  }
}

function loadTemplates() {
  ensureTemplates();
  return {
    index: readText(path.join(SRC_TEMPLATES, "index.template.html")),
    category: readText(path.join(SRC_TEMPLATES, "category.template.html")),
    tag: readText(path.join(SRC_TEMPLATES, "tag.template.html")),
    contact: readText(path.join(SRC_TEMPLATES, "contact.template.html")),
  };
}

function replaceAll(template, map) {
  let out = template;

  // Compat: si el template tiene {{CATEGORIES_BAR}} lo llenamos también
  const compatMap = { ...map };
  if (map.CATEGORIES_PILLS && !map.CATEGORIES_BAR) compatMap.CATEGORIES_BAR = map.CATEGORIES_PILLS;

  for (const [k, v] of Object.entries(compatMap)) {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, "g");
    out = out.replace(re, String(v ?? ""));
  }

  // Limpieza final: no dejar placeholders colgando
  out = out.replace(/\{\{[A-Z0-9_]+\}\}/g, "");
  return out;
}

function scanPosts() {
  const posts = [];
  if (!exists(SRC_POSTS)) return posts;

  const categories = fs.readdirSync(SRC_POSTS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const cat of categories) {
    const catDir = path.join(SRC_POSTS, cat);
    const slugs = fs.readdirSync(catDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const slug of slugs) {
      const p = path.join(catDir, slug, "index.html");
      if (!exists(p)) continue;
      const html = readText(p);
      const title = extractTitle(html) || slug.replace(/-/g, " ");
      const description = extractMeta(html, "description") || "";
      const excerpt = extractFirstParagraphText(html) || "";
      const tags = extractTags(html);

      // lastmod: usa mtime del archivo
      const stat = fs.statSync(p);
      const lastmod = new Date(stat.mtimeMs);

      const url = `${SITE.url}/posts/${encodeURIComponent(cat)}/${encodeURIComponent(slug)}/`;
      posts.push({
        category: cat,
        slug,
        title,
        description,
        excerpt,
        tags,
        url,
        lastmod,
      });
    }
  }

  // Orden: más nuevo primero
  posts.sort((a,b)=>b.lastmod - a.lastmod);
  return posts;
}

function buildPills(categories) {
  const items = categories.map(cat => {
    const href = `/categories/${encodeURIComponent(cat)}/`;
    return `<a class="pill" href="${href}">${cat.replace(/-/g," ")}</a>`;
  }).join("");
  return items || "";
}

function renderPostList(posts) {
  if (!posts.length) {
    return `<p><strong>0 publicaciones</strong><br> Todavía no hay publicaciones. Subí tu primer post en <code>/posts/&lt;categoria&gt;/&lt;post&gt;/index.html</code>.</p>`;
  }
  return `<ul class="postlist">` + posts.map(p => {
    const d = (p.excerpt || p.description || "").trim();
    const dd = d ? `<div class="muted">${d.slice(0, 140)}${d.length>140?"…":""}</div>` : "";
    const tags = p.tags?.length ? `<div class="tags">${p.tags.slice(0,6).map(t=>`<a class="tag" href="/tags/${encodeURIComponent(slugify(t))}/">${t}</a>`).join(" ")}</div>` : "";
    return `<li class="postitem"><a href="${p.url}">${p.title}</a>${dd}${tags}</li>`;
  }).join("") + `</ul>`;
}

function renderTopTags(posts, limit=20) {
  const counts = new Map();
  for (const p of posts) for (const t of (p.tags||[])) counts.set(t, (counts.get(t)||0)+1);
  const top = [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit);
  if (!top.length) return `<p>Todavía no hay etiquetas.</p>`;
  return `<div class="tagcloud">` + top.map(([t,c]) => {
    const href = `/tags/${encodeURIComponent(slugify(t))}/`;
    return `<a class="tag" href="${href}">${t} <span class="muted">(${c})</span></a>`;
  }).join(" ") + `</div>`;
}

function buildSitemap(urls) {
  const lines = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);
  for (const u of urls) {
    const lastmod = u.lastmod ? u.lastmod.toISOString().slice(0,10) : NOW.toISOString().slice(0,10);
    lines.push(`<url><loc>${u.loc}</loc><lastmod>${lastmod}</lastmod></url>`);
  }
  lines.push(`</urlset>`);
  return lines.join("\n");
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`;
}

function main() {
  ensureDir(DIST);
  ensureTemplates();
  const tpl = loadTemplates();

  // Copia assets
  for (const dir of ["css", "js", "img"]) {
    const src = path.join(ROOT, dir);
    const dst = path.join(DIST, dir);
    if (exists(src)) {
      ensureDir(dst);
      copyDir(src, dst);
    }
  }

  const posts = scanPosts();
  const categories = [...new Set(posts.map(p => p.category))].sort();
  const pills = buildPills(categories);

  // HOME
  const latest = posts.slice(0, 15);
  const homeTitle = "Buenos días de verdad — buenosdia.com";
  const homeDesc = "Textos cortos, reales y humanos para abrir el día. Hecho para leer rápido y sentir que te hablan a vos. Sin humo.";
  const homeHtml = replaceAll(tpl.index, {
    LANG: SITE.lang,
    TITLE: homeTitle,
    DESCRIPTION: homeDesc,
    KEYWORDS: "buenos días, textos, mañana, motivación real, ansiedad, ánimo, esperanza",
    CANONICAL: `${SITE.url}/`,
    CATEGORIES_PILLS: pills,
    LATEST_POSTS: renderPostList(latest),
    TOP_TAGS: renderTopTags(posts),
    YEAR,
  });
  writeText(path.join(DIST, "index.html"), homeHtml);

  // CONTACTO
  const contactHtml = replaceAll(tpl.contact, {
    LANG: SITE.lang,
    TITLE: "Contacto — buenosdia.com",
    DESCRIPTION: "Contacto directo con buenosdia.com",
    CANONICAL: `${SITE.url}/contacto/`,
    YEAR,
  });
  writeText(path.join(DIST, "contacto", "index.html"), contactHtml);

  // CATEGORIES
  const sitemapUrls = [];
  sitemapUrls.push({ loc: `${SITE.url}/`, lastmod: NOW });
  sitemapUrls.push({ loc: `${SITE.url}/contacto/`, lastmod: NOW });

  const categoryMeta = {};
  for (const cat of categories) {
    const catPosts = posts.filter(p => p.category === cat);
    const seoDesc = buildCategorySeoDescription(cat.replace(/-/g," "), catPosts);
    const catTitle = `${cat.replace(/-/g," ")} — buenosdia.com`;
    const canonical = `${SITE.url}/categories/${encodeURIComponent(cat)}/`;

    categoryMeta[cat] = {
      name: cat,
      display: cat.replace(/-/g," "),
      description: seoDesc,
      count: catPosts.length,
      updatedAt: NOW.toISOString(),
    };

    const html = replaceAll(tpl.category, {
      LANG: SITE.lang,
      TITLE: catTitle,
      DESCRIPTION: seoDesc,
      KEYWORDS: [cat.replace(/-/g," "), ...topKeywords(catPosts.map(p => `${p.title} ${p.excerpt} ${p.description}`), 8)].join(", "),
      CANONICAL: canonical,
      CATEGORIES_PILLS: pills,
      H1: cat.replace(/-/g," ").toUpperCase(),
      CATEGORY_SEO_DESCRIPTION: seoDesc,
      POST_LIST: renderPostList(catPosts),
      YEAR,
    });

    writeText(path.join(DIST, "categories", cat, "index.html"), html);
    sitemapUrls.push({ loc: canonical, lastmod: NOW });
  }

  // TAG PAGES
  const tagMap = new Map();
  for (const p of posts) {
    for (const t of (p.tags||[])) {
      const k = slugify(t);
      if (!tagMap.has(k)) tagMap.set(k, { tag: t, posts: [] });
      tagMap.get(k).posts.push(p);
    }
  }
  for (const [k, obj] of tagMap.entries()) {
    const canonical = `${SITE.url}/tags/${encodeURIComponent(k)}/`;
    const title = `${obj.tag} — etiquetas — buenosdia.com`;
    const desc = `Lecturas que tocan: ${obj.tag}. ${obj.posts.length} publicaciones, sin humo.`;
    const html = replaceAll(tpl.tag, {
      LANG: SITE.lang,
      TITLE: title,
      DESCRIPTION: desc,
      CANONICAL: canonical,
      H1: `Etiqueta: ${obj.tag}`,
      POST_LIST: renderPostList(obj.posts),
      YEAR,
    });
    writeText(path.join(DIST, "tags", k, "index.html"), html);
    sitemapUrls.push({ loc: canonical, lastmod: NOW });
  }

  // Copy posts as-is into dist (para servirlos)
  if (exists(SRC_POSTS)) copyDir(SRC_POSTS, path.join(DIST, "posts"));

  // sitemap
  for (const p of posts) sitemapUrls.push({ loc: p.url, lastmod: p.lastmod });
  writeText(path.join(DIST, "sitemap.xml"), buildSitemap(sitemapUrls));

  // robots
  writeText(path.join(DIST, "robots.txt"), buildRobots());

  // category meta JSON (para index principal futuro)
  writeText(path.join(DIST, "categories.json"), JSON.stringify(categoryMeta, null, 2));

  console.log(`✅ Build OK: ${posts.length} posts | ${categories.length} categories | ${tagMap.size} tags`);
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, ent.name);
    const b = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

main();

#!/usr/bin/env node
/**
 * BUENOSDIAS2560 — SSG Build (v4) ✅ “todo automático al subir posts”
 *
 * - Home: pills + últimas + tags top + bloques por categoría (5 posts por categoría)
 * - Categorías: descripción SEO auto (se recalcula en cada build / mensual)
 * - Tags: páginas por etiqueta
 * - SEO avanzado: sitemap.xml (lastmod) + robots.txt + canonical + OG/Twitter
 * - POSTS (auto):
 *    - Si faltan meta tags => los genera (description / keywords / canonical / OG / Twitter)
 *    - Interlink dentro del texto: inserta 1 párrafo con 2 links internos (inline)
 *    - “Te interesa”: lista recomendada (relacionados) si el post tiene {{TE_INTERESA}} o si no, lo agrega al final
 *
 * Es determinístico (no depende de APIs externas).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_POSTS = path.join(ROOT, "posts");
const SRC_TEMPLATES = path.join(ROOT, "templates");
const SRC_DATA = path.join(ROOT, "data");
const DIST = path.join(ROOT, "dist");

const SITE = {
  name: "BUENOSDIA.COM",
  url: (process.env.SITE_URL || "https://buenosdia.com").replace(/\/+$/,""),
  lang: "es-AR",
  author: "buenosdia.com",
};

const NOW = new Date();
const YEAR = String(NOW.getFullYear());
const MONTH_KEY = `${NOW.getFullYear()}-${String(NOW.getMonth()+1).padStart(2,"0")}`;

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
  const re = new RegExp(`<meta\\s+name=[\"']${name}[\"']\\s+content=[\"']([^\"']+)[\"']\\s*\\/?>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}
function hasMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=[\"']${name}[\"']\\s+content=`, "i");
  return re.test(html);
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
  let tags = [];
  const kw = extractMeta(html, "keywords");
  if (kw) tags.push(...kw.split(",").map(s => s.trim()).filter(Boolean));

  const dt = html.match(/data-tags=[\"']([^\"']+)[\"']/i);
  if (dt) tags.push(...dt[1].split(",").map(s=>s.trim()).filter(Boolean));

  const cm = html.match(/<!--\\s*tags:\\s*([\\s\\S]*?)-->/i);
  if (cm) tags.push(...cm[1].split(",").map(s=>s.trim()).filter(Boolean));

  tags = tags
    .map(t => t.toLowerCase())
    .map(t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    .map(t => t.replace(/[^a-z0-9\s-]/g, "").trim())
    .filter(Boolean);

  return [...new Set(tags)];
}

const STOP = new Set([
  "a","al","algo","algunos","ante","antes","asi","aun","aunque","bajo","bien","cada","casi","como","con","contra","cual","cuando",
  "de","del","desde","donde","dos","el","ella","ellas","ellos","en","entre","era","eres","es","esa","ese","eso","esta","estaba",
  "estamos","estan","estar","este","esto","estos","fue","ha","hace","hacia","han","hasta","hay","la","las","le","les","lo","los",
  "mas","me","mi","mis","mismo","mucho","muy","no","nos","nuestra","nuestro","o","otra","para","pero","poco","por","porque","que",
  "quien","se","sea","ser","si","sin","sobre","solo","son","su","sus","tambien","te","tener","tiene","tu","tus","un","una","uno",
  "y","ya","vos","hoy","manana","ayer"
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
      score.set(w, (score.get(w) || 0) + c * idf);
    }
  }
  return [...score.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([w])=>w);
}

function sentenceSummaries(text, maxLen = 170) {
  const t = text.replace(/\s+/g," ").trim();
  if (!t) return "";
  const parts = t.split(/(?<=[\.\!\?])\s+/).filter(Boolean);
  let out = "";
  for (const p of parts) {
    if ((out + " " + p).trim().length <= maxLen) out = (out + " " + p).trim();
    if (out.length >= Math.min(95, maxLen)) break;
  }
  if (!out) out = t.slice(0, maxLen);
  return out.replace(/\s+/g," ").trim();
}

function buildCategorySeoDescription(categoryName, posts) {
  const docs = posts.map(p => [p.title, p.excerpt, p.description].filter(Boolean).join(" "));
  const kw = topKeywords(docs, 10);
  const tone = [
    `En esta categoría: ${categoryName}.`,
    posts.length ? `Ahora mismo hay ${posts.length} publicaciones.` : `Todavía está naciendo.`,
    `Acá no venís a “leer frases”. Venís a encontrarte.`,
    `Textos cortos, reales, para abrir el día sin maquillaje.`,
    kw.length ? `Se toca mucho: ${kw.slice(0,6).join(", ")}.` : `De a poco se arma con lo que vas viviendo.`
  ].join(" ");
  return sentenceSummaries(tone, 170);
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

  <div class="hero">
    <div class="kicker">TEXTOS PARA MAÑANAS REALES</div>
    <h1>Este no es el típico blog de frases.</h1>
    <p>Hecho para abrir rápido, leer fácil y sentir que te hablan a vos. Sin humo.</p>
  </div>

  <section class="grid">
    <div class="card">
      <h3>Últimas publicaciones</h3>
      {{LATEST_POSTS}}
    </div>
    <div class="card">
      <h3>Etiquetas (top)</h3>
      {{TOP_TAGS}}
    </div>
  </section>

  <section class="card">
    <h3>Categorías</h3>
    {{CATEGORY_BLOCKS}}
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

  <section class="card">
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
  <section class="card">
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
  const compatMap = { ...map };
  if (map.CATEGORIES_PILLS && !map.CATEGORIES_BAR) compatMap.CATEGORIES_BAR = map.CATEGORIES_PILLS;
  for (const [k, v] of Object.entries(compatMap)) {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, "g");
    out = out.replace(re, String(v ?? ""));
  }
  out = out.replace(/\\{\\{[A-Z0-9_]+\\}\\}/g, "");
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

      const stat = fs.statSync(p);
      const lastmod = new Date(stat.mtimeMs);
      const url = `${SITE.url}/posts/${encodeURIComponent(cat)}/${encodeURIComponent(slug)}/`;

      posts.push({ category: cat, slug, title, description, excerpt, tags, url, lastmod, sourcePath: p });
    }
  }

  posts.sort((a,b)=>b.lastmod - a.lastmod);
  return posts;
}

function readCategoriesConfig() {
  const p = path.join(SRC_DATA, "categories.json");
  if (!exists(p)) return null;
  try {
    const obj = JSON.parse(readText(p));
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function buildCategoryList(posts, cfg) {
  const fromPosts = [...new Set(posts.map(p => p.category))];
  const fromCfg = cfg ? Object.keys(cfg) : [];
  return [...new Set([...fromPosts, ...fromCfg])].filter(Boolean).sort();
}

function displayCategory(cat, cfg) {
  if (cfg && cfg[cat] && cfg[cat].title) return cfg[cat].title;
  return cat.replace(/-/g, " ");
}

function buildPills(categories, cfg) {
  return categories.map(cat => {
    const href = `/categories/${encodeURIComponent(cat)}/`;
    return `<a class="pill" href="${href}">${escapeHtml(displayCategory(cat, cfg))}</a>`;
  }).join("");
}

function renderPostList(posts) {
  if (!posts.length) {
    return `<p><strong>0 publicaciones</strong><br> Subí tu primer post en <code>/posts/&lt;categoria&gt;/&lt;post&gt;/index.html</code>.</p>`;
  }
  return `<ul class="postlist">` + posts.map(p => {
    const d = (p.excerpt || p.description || "").trim();
    const dd = d ? `<div class="muted">${escapeHtml(d.slice(0, 140))}${d.length>140?"…":""}</div>` : "";
    const tags = p.tags?.length ? `<div class="tags">${p.tags.slice(0,6).map(t=>`<a class="tag" href="/tags/${encodeURIComponent(slugify(t))}/">${escapeHtml(t)}</a>`).join(" ")}</div>` : "";
    return `<li class="postitem"><a href="${p.url}">${escapeHtml(p.title)}</a>${dd}${tags}</li>`;
  }).join("") + `</ul>`;
}

function renderTopTags(posts, limit=20) {
  const counts = new Map();
  for (const p of posts) for (const t of (p.tags||[])) counts.set(t, (counts.get(t)||0)+1);
  const top = [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit);
  if (!top.length) return `<p>Todavía no hay etiquetas.</p>`;
  return `<div class="tagcloud">` + top.map(([t,c]) => {
    const href = `/tags/${encodeURIComponent(slugify(t))}/`;
    return `<a class="tag" href="${href}">${escapeHtml(t)} <span class="muted">(${c})</span></a>`;
  }).join(" ") + `</div>`;
}

function seededShuffle(arr, seedStr) {
  const seed = hashToInt(seedStr);
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = seedRand(seed + i) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashToInt(s) {
  let h = 2166136261;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seedRand(x) {
  let y = x >>> 0;
  y ^= y << 13; y >>>= 0;
  y ^= y >> 17; y >>>= 0;
  y ^= y << 5;  y >>>= 0;
  return y >>> 0;
}

function renderCategoryBlocks(categories, posts, cfg) {
  if (!categories.length) return `<p class="muted">Todavía no hay categorías.</p>`;

  const blocks = categories.map(cat => {
    const catPosts = posts.filter(p => p.category === cat);
    const chosen = seededShuffle(catPosts, `${MONTH_KEY}:${cat}`).slice(0, 5);
    const list = chosen.length
      ? `<ul class="mini">${chosen.map(p=>`<li><a href="${p.url}">${escapeHtml(p.title)}</a></li>`).join("")}</ul>`
      : `<p class="muted">Todavía no hay posts en esta categoría.</p>`;
    return `<div class="catblock">
      <div class="cathead"><a href="/categories/${encodeURIComponent(cat)}/">${escapeHtml(displayCategory(cat, cfg))}</a> <span class="muted">(${catPosts.length})</span></div>
      ${list}
      <div class="more"><a href="/categories/${encodeURIComponent(cat)}/">Ver más</a></div>
    </div>`;
  }).join("");

  return `<div class="catgrid">${blocks}</div>`;
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

function escapeHtml(s) {
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function relatedPostsFor(post, allPosts, limit=8) {
  const baseTags = new Set((post.tags||[]).map(t=>slugify(t)));
  const baseText = tokenize(`${post.title} ${post.excerpt} ${post.description}`).slice(0, 70);

  function score(p) {
    if (p.url === post.url) return -1;
    let s = 0;
    const tags = (p.tags||[]).map(t=>slugify(t));
    for (const t of tags) if (baseTags.has(t)) s += 5;
    if (p.category === post.category) s += 2;
    const toks = new Set(tokenize(`${p.title} ${p.excerpt} ${p.description}`));
    for (const w of baseText) if (toks.has(w)) s += 0.2;
    return s;
  }

  return allPosts
    .map(p => ({ p, s: score(p) }))
    .filter(x => x.s > 0.5)
    .sort((a,b)=>b.s-a.s)
    .slice(0, limit)
    .map(x => x.p);
}

function makeInlineInterlinkParagraph(relTwo) {
  if (relTwo.length < 2) return "";
  const a = relTwo[0], b = relTwo[1];
  return `<p class="intext-links">Si hoy venís con lo puesto, capaz te pega leer <a href="${a.url}">${escapeHtml(a.title)}</a> y después caer en <a href="${b.url}">${escapeHtml(b.title)}</a>. No es obligación. Es compañía.</p>`;
}

function makeTeInteresaBlock(relPosts) {
  if (!relPosts.length) return "";
  return `<div class="teinteresa">
    <h3>Te interesa</h3>
    <ul class="mini">
      ${relPosts.slice(0,6).map(p=>`<li><a href="${p.url}">${escapeHtml(p.title)}</a></li>`).join("")}
    </ul>
  </div>`;
}

function injectAutoSeoAndLinks(html, post, allPosts) {
  const canonical = post.url;
  const title = post.title || "buenosdia.com";
  const firstP = extractFirstParagraphText(html);
  const desc = extractMeta(html, "description") || sentenceSummaries(firstP || cleanHtmlToText(html), 160);
  const kw = extractMeta(html, "keywords") || topKeywords([`${title} ${firstP} ${desc}`], 10).join(", ");

  if (!/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, match => match + `\n<title>${escapeHtml(title)}</title>`);
  }
  if (!hasMeta(html, "description")) {
    html = html.replace(/<\/head>/i, `<meta name="description" content="${escapeHtml(desc)}">\n</head>`);
  }
  if (!hasMeta(html, "keywords")) {
    html = html.replace(/<\/head>/i, `<meta name="keywords" content="${escapeHtml(kw)}">\n</head>`);
  }
  if (!/<link\s+rel=[\"']canonical[\"']/i.test(html)) {
    html = html.replace(/<\/head>/i, `<link rel="canonical" href="${canonical}">\n</head>`);
  }
  if (!/<meta\s+property=[\"']og:title[\"']/i.test(html)) {
    html = html.replace(/<\/head>/i, `<meta property="og:title" content="${escapeHtml(title)}">\n</head>`);
  }
  if (!/<meta\s+property=[\"']og:description[\"']/i.test(html)) {
    html = html.replace(/<\/head>/i, `<meta property="og:description" content="${escapeHtml(desc)}">\n</head>`);
  }
  if (!/<meta\s+property=[\"']og:url[\"']/i.test(html)) {
    html = html.replace(/<\/head>/i, `<meta property="og:url" content="${canonical}">\n</head>`);
  }
  if (!/<meta\s+name=[\"']twitter:card[\"']/i.test(html)) {
    html = html.replace(/<\/head>/i, `<meta name="twitter:card" content="summary">\n</head>`);
  }

  const rel = relatedPostsFor(post, allPosts, 8);
  const paragraph = makeInlineInterlinkParagraph(rel);

  if (paragraph && !html.includes('class="intext-links"')) {
    if (/<p[^>]*>[\s\S]*?<\/p>/i.test(html)) {
      html = html.replace(/(<p[^>]*>[\s\S]*?<\/p>)/i, `$1\n${paragraph}`);
    } else if (/<body[^>]*>/i.test(html)) {
      html = html.replace(/<body[^>]*>/i, match => `${match}\n${paragraph}`);
    }
  }

  const teInteresa = makeTeInteresaBlock(rel);
  if (/\{\{TE_INTERESA\}\}|\{\{RELATED_POSTS\}\}|<!--\s*TE_INTERESA\s*-->/i.test(html)) {
    html = html
      .replace(/\{\{TE_INTERESA\}\}/gi, teInteresa)
      .replace(/\{\{RELATED_POSTS\}\}/gi, teInteresa)
      .replace(/<!--\s*TE_INTERESA\s*-->/gi, teInteresa);
  } else if (teInteresa) {
    if (/<\/main>/i.test(html)) html = html.replace(/<\/main>/i, `${teInteresa}\n</main>`);
    else html = html.replace(/<\/body>/i, `${teInteresa}\n</body>`);
  }

  html = html.replace(/\{\{[A-Z0-9_]+\}\}/g, "");
  return html;
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

function copyPostsAuto(posts) {
  if (!exists(SRC_POSTS)) return;
  const dstRoot = path.join(DIST, "posts");
  ensureDir(dstRoot);
  copyDir(SRC_POSTS, dstRoot);

  for (const post of posts) {
    const dstIndex = path.join(dstRoot, post.category, post.slug, "index.html");
    if (!exists(dstIndex)) continue;
    const html = readText(dstIndex);
    const changed = injectAutoSeoAndLinks(html, post, posts);
    writeText(dstIndex, changed);
  }
}

function main() {
  ensureDir(DIST);
  ensureTemplates();
  const tpl = loadTemplates();

  for (const dir of ["css", "js", "img"]) {
    const src = path.join(ROOT, dir);
    const dst = path.join(DIST, dir);
    if (exists(src)) { ensureDir(dst); copyDir(src, dst); }
  }

  const posts = scanPosts();
  const cfg = readCategoriesConfig();
  const categories = buildCategoryList(posts, cfg);
  const pills = buildPills(categories, cfg);

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
    CATEGORY_BLOCKS: renderCategoryBlocks(categories, posts, cfg),
    YEAR,
  });
  writeText(path.join(DIST, "index.html"), homeHtml);

  const contactHtml = replaceAll(tpl.contact, {
    LANG: SITE.lang,
    TITLE: "Contacto — buenosdia.com",
    DESCRIPTION: "Contacto directo con buenosdia.com",
    CANONICAL: `${SITE.url}/contacto/`,
    YEAR,
  });
  writeText(path.join(DIST, "contacto", "index.html"), contactHtml);

  const sitemapUrls = [];
  sitemapUrls.push({ loc: `${SITE.url}/`, lastmod: NOW });
  sitemapUrls.push({ loc: `${SITE.url}/contacto/`, lastmod: NOW });

  const categoryMeta = {};
  for (const cat of categories) {
    const catPosts = posts.filter(p => p.category === cat);
    const pretty = displayCategory(cat, cfg);
    const seoDesc = (cfg && cfg[cat] && cfg[cat].description) ? cfg[cat].description : buildCategorySeoDescription(pretty, catPosts);
    const catTitle = `${pretty} — buenosdia.com`;
    const canonical = `${SITE.url}/categories/${encodeURIComponent(cat)}/`;

    categoryMeta[cat] = { name: cat, display: pretty, description: seoDesc, count: catPosts.length, updatedAt: NOW.toISOString() };

    const html = replaceAll(tpl.category, {
      LANG: SITE.lang,
      TITLE: catTitle,
      DESCRIPTION: seoDesc,
      KEYWORDS: [pretty, ...topKeywords(catPosts.map(p => `${p.title} ${p.excerpt} ${p.description}`), 8)].join(", "),
      CANONICAL: canonical,
      CATEGORIES_PILLS: pills,
      H1: pretty.toUpperCase(),
      CATEGORY_SEO_DESCRIPTION: seoDesc,
      POST_LIST: renderPostList(catPosts),
      YEAR,
    });

    writeText(path.join(DIST, "categories", cat, "index.html"), html);
    sitemapUrls.push({ loc: canonical, lastmod: NOW });
  }

  const tagMap = new Map();
  for (const p of posts) for (const t of (p.tags||[])) {
    const k = slugify(t);
    if (!tagMap.has(k)) tagMap.set(k, { tag: t, posts: [] });
    tagMap.get(k).posts.push(p);
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

  copyPostsAuto(posts);

  for (const p of posts) sitemapUrls.push({ loc: p.url, lastmod: p.lastmod });
  writeText(path.join(DIST, "sitemap.xml"), buildSitemap(sitemapUrls));
  writeText(path.join(DIST, "robots.txt"), buildRobots());
  writeText(path.join(DIST, "categories.json"), JSON.stringify(categoryMeta, null, 2));

  console.log(`✅ Build OK: ${posts.length} posts | ${categories.length} categories | ${tagMap.size} tags`);
  console.log(`🔎 SEO: /sitemap.xml y /robots.txt regenerados`);
}

main();

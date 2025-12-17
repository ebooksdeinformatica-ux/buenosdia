import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const TPL_DIR = path.join(ROOT, "templates");
const DIST_DIR = path.join(ROOT, "dist");

// Cambiá esto si tu dominio final es otro
const SITE_URL = "https://buenosdia.com";

// === AdSense (lo pediste vos) ===
const ADSENSE_HEAD = `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267"
     crossorigin="anonymous"></script>
`.trim();

// ===== Helpers FS =====
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function rimraf(dir) { if (await exists(dir)) await fs.rm(dir, { recursive: true, force: true }); }
async function mkdirp(dir) { await fs.mkdir(dir, { recursive: true }); }
async function copyDir(src, dst) {
  if (!(await exists(src))) return;
  await mkdirp(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}
async function writeFile(outPath, content) {
  await mkdirp(path.dirname(outPath));
  await fs.writeFile(outPath, content, "utf8");
}
async function readTemplate(name) {
  return fs.readFile(path.join(TPL_DIR, name), "utf8");
}

// ===== Helpers HTML/META =====
function esc(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function slugToLabel(slug = "") {
  return slug
    .split("-")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
function slugifyTag(tag) {
  return tag
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
function pickMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}
function pickTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "";
}
function pickH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
}
function pickOGImage(html) {
  const m = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  return m ? m[1].trim() : "";
}
function excerpt(desc) {
  if (!desc) return "";
  return desc.length > 165 ? desc.slice(0, 162).trim() + "…" : desc;
}

// ===== CATEGORIES =====
async function getCategories() {
  if (!(await exists(POSTS_DIR))) return [];
  const dirs = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  // IMPORTANTE: No inventamos ni duplicamos; solo leemos carpetas reales
  const cats = dirs.filter(d => d.isDirectory()).map(d => d.name);
  cats.sort((a,b) => a.localeCompare(b));
  return cats;
}

function renderCategoriesBar(cats) {
  // UNA SOLA VEZ (acá está el fix de tu duplicado)
  return cats.map(c => {
    const label = slugToLabel(c);
    return `<a class="chip" href="/categorias/${esc(c)}/">${esc(label)}</a>`;
  }).join("\n");
}

// ===== POSTS INDEXING =====
async function collectPosts(categories) {
  const posts = [];

  for (const cat of categories) {
    const catPath = path.join(POSTS_DIR, cat);
    const items = await fs.readdir(catPath, { withFileTypes: true });

    for (const it of items) {
      if (!it.isFile()) continue;
      if (!it.name.toLowerCase().endsWith(".html")) continue;
      if (it.name.toLowerCase() === "index.html") continue; // placeholder

      const full = path.join(catPath, it.name);
      const html = await fs.readFile(full, "utf8");

      const title = pickTitle(html) || pickH1(html) || it.name.replace(/\.html$/i, "");
      const description = pickMeta(html, "description");
      const keywords = pickMeta(html, "keywords");
      const date = pickMeta(html, "date") || "";
      const ogImage = pickOGImage(html);

      const relUrl = `/posts/${cat}/${it.name}`;
      const url = `${SITE_URL}${relUrl}`;

      const tags = (keywords || "")
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      posts.push({
        cat,
        catLabel: slugToLabel(cat),
        file: it.name,
        relUrl,
        url,
        title,
        description,
        excerpt: excerpt(description),
        date,
        tags,
        ogImage
      });
    }
  }

  // Orden por fecha si hay, sino por título
  posts.sort((a,b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
  return posts;
}

function buildTagIndex(posts) {
  const map = new Map();
  for (const p of posts) {
    for (const t of p.tags) {
      const slug = slugifyTag(t);
      if (!slug) continue;
      if (!map.has(slug)) map.set(slug, { name: t, count: 0, posts: [] });
      const obj = map.get(slug);
      obj.count += 1;
      obj.posts.push(p);
    }
  }
  return [...map.entries()].sort((a,b) => b[1].count - a[1].count);
}

function renderTagsList(tagEntries, limit = 14) {
  if (!tagEntries.length) return `<div class="muted">Todavía no hay etiquetas.</div>`;
  return tagEntries.slice(0, limit).map(([slug, info]) => {
    return `<a class="tag" href="/tags/${esc(slug)}/">
      <span>${esc(info.name)}</span>
      <span class="count">${info.count}</span>
    </a>`;
  }).join("\n");
}

function renderPostsList(posts, limit = 24) {
  if (!posts.length) {
    return `<div class="empty">Todavía no hay publicaciones. Subí tu primer post a <code>/posts/&lt;categoria&gt;/</code> y aparece solo acá.</div>`;
  }

  return posts.slice(0, limit).map(p => {
    const img = p.ogImage
      ? `<img src="${esc(p.ogImage)}" alt="${esc(p.title)}" loading="lazy" decoding="async">`
      : "";
    return `
      <a class="post" href="${esc(p.relUrl)}">
        <div class="thumb">${img}</div>
        <div class="body">
          <div class="kicker">${esc(p.catLabel)}</div>
          <div class="title">${esc(p.title)}</div>
          <div class="desc">${esc(p.excerpt || "")}</div>
          <div class="meta">
            <span class="pill">${esc(p.catLabel)}</span>
            <span class="pill">${esc(p.date || "sin fecha")}</span>
          </div>
        </div>
      </a>
    `.trim();
  }).join("\n");
}

function renderSimpleLinks(posts) {
  if (!posts.length) return `<div class="empty">No hay publicaciones todavía.</div>`;
  return `<ul class="links">` + posts.map(p =>
    `<li><a href="${esc(p.relUrl)}">${esc(p.title)}</a></li>`
  ).join("\n") + `</ul>`;
}

// ===== SHARE inject en posts =====
function buildShareHtml() {
  return `
  <section class="share-wrap" data-share>
    <div class="h">Compartir</div>
    <div class="share">
      <button class="sbtn" data-share="copy" type="button">Copiar link</button>
      <a class="sbtn" data-share="wa" href="#" rel="noopener">WhatsApp</a>
      <a class="sbtn" data-share="fb" href="#" rel="noopener">Facebook</a>
      <a class="sbtn" data-share="pin" href="#" rel="noopener">Pinterest</a>
      <a class="sbtn" data-share="ig" href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a>
      <a class="sbtn" data-share="tt" href="https://www.tiktok.com/" target="_blank" rel="noopener">TikTok</a>
    </div>
    <div class="muted tiny">Instagram/TikTok no tienen “share URL” web confiable: usá “Copiar link” y pegalo en la app.</div>
  </section>

  <script defer src="/js/site.js"></script>
  `.trim();
}

function injectBeforeBodyClose(html, injection) {
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx === -1) return html + "\n" + injection;
  return html.slice(0, idx) + "\n" + injection + "\n" + html.slice(idx);
}

async function buildPostsToDist(categories) {
  for (const cat of categories) {
    const srcCat = path.join(POSTS_DIR, cat);
    const dstCat = path.join(DIST_DIR, "posts", cat);
    await mkdirp(dstCat);

    const items = await fs.readdir(srcCat, { withFileTypes: true });
    for (const it of items) {
      if (!it.isFile()) continue;
      if (!it.name.toLowerCase().endsWith(".html")) continue;

      const src = path.join(srcCat, it.name);
      const dst = path.join(dstCat, it.name);

      // placeholder index -> se copia tal cual
      if (it.name.toLowerCase() === "index.html") {
        const ph = await fs.readFile(src, "utf8");
        await writeFile(dst, ph);
        continue;
      }

      // post real -> inyecta share
      const html = await fs.readFile(src, "utf8");
      const injected = injectBeforeBodyClose(html, buildShareHtml());
      await writeFile(dst, injected);
    }
  }
}

// ===== MAIN =====
async function main() {
  await rimraf(DIST_DIR);
  await mkdirp(DIST_DIR);

  // assets
  await copyDir(path.join(ROOT, "img"), path.join(DIST_DIR, "img"));
  await copyDir(path.join(ROOT, "css"), path.join(DIST_DIR, "css"));
  await copyDir(path.join(ROOT, "js"), path.join(DIST_DIR, "js"));

  const [tplIndex, tplCat, tplTag] = await Promise.all([
    readTemplate("index.template.html"),
    readTemplate("category.template.html"),
    readTemplate("tag.template.html")
  ]);

  const categories = await getCategories();
  const posts = await collectPosts(categories);
  const tagsIndex = buildTagIndex(posts);

  // build posts
  await buildPostsToDist(categories);

  // index
  const indexHtml = tplIndex
    .replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD)
    .replaceAll("{{SITE_TITLE}}", "buenosdia.com – Hecho con VOz, para VOS")
    .replaceAll("{{SITE_DESCRIPTION}}", "Textos para mañanas reales. Blanco, rápido y humano.")
    .replaceAll("{{CATEGORIES}}", renderCategoriesBar(categories))
    .replaceAll("{{POSTS_LIST}}", renderPostsList(posts, 24))
    .replaceAll("{{TAGS_LIST}}", renderTagsList(tagsIndex, 14))
    .replaceAll("{{POSTS_COUNT}}", String(posts.length))
    .replaceAll("{{YEAR}}", String(new Date().getFullYear()));

  await writeFile(path.join(DIST_DIR, "index.html"), indexHtml);

  // categorías
  for (const cat of categories) {
    const label = slugToLabel(cat);
    const catPosts = posts.filter(p => p.cat === cat);

    const catHtml = tplCat
      .replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD)
      .replaceAll("{{CATEGORY_NAME}}", esc(label))
      .replaceAll("{{CATEGORY_SLUG}}", esc(cat))
      .replaceAll("{{POSTS_LIST}}", renderSimpleLinks(catPosts))
      .replaceAll("{{YEAR}}", String(new Date().getFullYear()));

    await writeFile(path.join(DIST_DIR, "categorias", cat, "index.html"), catHtml);
  }

  // tags
  for (const [slug, info] of tagsIndex) {
    const tagHtml = tplTag
      .replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD)
      .replaceAll("{{TAG_NAME}}", esc(info.name))
      .replaceAll("{{TAG_SLUG}}", esc(slug))
      .replaceAll("{{POSTS_LIST}}", renderSimpleLinks(info.posts))
      .replaceAll("{{YEAR}}", String(new Date().getFullYear()));

    await writeFile(path.join(DIST_DIR, "tags", slug, "index.html"), tagHtml);
  }

  // redirects /posts/<cat>/ -> /categorias/<cat>/
  for (const cat of categories) {
    const redirectHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=/categorias/${cat}/">
  <link rel="canonical" href="/categorias/${cat}/">
  <meta name="robots" content="noindex">
  <title>Redirigiendo…</title>
</head>
<body>
  <p>Redirigiendo a <a href="/categorias/${cat}/">/categorias/${cat}/</a>…</p>
</body>
</html>`;
    await writeFile(path.join(DIST_DIR, "posts", cat, "index.html"), redirectHtml);
  }

  // sitemap
  const urls = new Set();
  urls.add(`${SITE_URL}/`);
  for (const c of categories) urls.add(`${SITE_URL}/categorias/${c}/`);
  for (const [slug] of tagsIndex) urls.add(`${SITE_URL}/tags/${slug}/`);
  for (const p of posts) urls.add(p.url);

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...urls].sort().map(u => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`;

  await writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap);
  await writeFile(path.join(DIST_DIR, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log(`OK: Posts=${posts.length} Cats=${categories.length} Tags=${tagsIndex.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

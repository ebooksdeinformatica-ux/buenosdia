import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const TPL_DIR = path.join(ROOT, "templates");
const DIST_DIR = path.join(ROOT, "dist");

const SITE_URL = "https://buenosdia.com";
const SITE_TITLE = "Buenos días de verdad";
const SITE_BRAND = "BUENOSDIA.COM";
const SITE_TAGLINE = "Hecho para abrir rápido, leer fácil y sentir que te hablan a vos. Sin humo.";

const ADSENSE_HEAD = `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267"
     crossorigin="anonymous"></script>
`.trim();

async function mkdirp(p) { await fs.mkdir(p, { recursive: true }); }
async function readFile(p) { return fs.readFile(p, "utf8"); }
async function writeFile(p, s) { await mkdirp(path.dirname(p)); await fs.writeFile(p, s, "utf8"); }

function esc(s=""){return String(s)
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;");}

function normalize(s=""){
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function slugify(s=""){
  return normalize(s).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function humanizeSlug(slug=""){
  // "autoestima-y-autoestima-rota" -> "Autoestima y autoestima rota"
  const words = slug.replaceAll("-", " ").trim().split(/\s+/);
  if (!words.length) return slug;
  // primera en mayúscula, resto tal cual (queda bien “humano”)
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ");
}

function stripHtml(html=""){
  return html
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]*>/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function excerpt(text="", n=170){
  const t = String(text).replace(/\s+/g," ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n-1).trim() + "…";
}

function parseTitle(html){
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (m) return m[1].replace(/\s+/g," ").trim();
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripHtml(h1[1]);
  return "";
}

function parseMeta(html, name){
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']\\s*\\/?>`,"i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

async function copyDir(src, dst){
  await mkdirp(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries){
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    if (e.isFile()) await fs.copyFile(s, d);
  }
}

async function loadTemplate(name){
  return readFile(path.join(TPL_DIR, name));
}

async function getCategoriesFromFolders(){
  // SÓLO carpetas reales dentro de /posts (evita duplicados)
  let entries = [];
  try {
    entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const cats = entries
    .filter(e => e.isDirectory())
    .map(e => slugify(e.name)) // por las dudas
    .filter(Boolean);

  // unique + sort
  return [...new Set(cats)].sort((a,b)=>a.localeCompare(b));
}

async function collectPosts(categories){
  const posts = [];
  for (const cat of categories){
    const catDir = path.join(POSTS_DIR, cat);
    let files = [];
    try { files = await fs.readdir(catDir, { withFileTypes: true }); }
    catch { continue; }

    for (const f of files){
      if (!f.isFile()) continue;
      if (!f.name.toLowerCase().endsWith(".html")) continue;
      if (f.name.toLowerCase() === "index.html") continue;

      const abs = path.join(catDir, f.name);
      const raw = await readFile(abs);

      const title = parseTitle(raw) || f.name.replace(/\.html$/i,"");
      const description = parseMeta(raw, "description") || excerpt(stripHtml(raw), 170);
      const date = parseMeta(raw, "date") || "";
      const keywords = parseMeta(raw, "keywords") || "";
      const tags = keywords.split(",").map(x=>x.trim()).filter(Boolean);

      posts.push({
        cat,
        catName: humanizeSlug(cat),
        file: f.name,
        abs,
        url: `/posts/${cat}/${f.name}`,
        title,
        description,
        excerpt: excerpt(description, 170),
        date,
        tags
      });
    }
  }

  // orden: date desc si existe; si no, por title
  posts.sort((a,b)=>{
    const da = a.date || "";
    const db = b.date || "";
    if (da !== db) return db.localeCompare(da);
    return a.title.localeCompare(b.title);
  });

  return posts;
}

function buildTagCloud(posts){
  const m = new Map();
  for (const p of posts){
    for (const t of p.tags){
      const s = slugify(t);
      if (!s) continue;
      if (!m.has(s)) m.set(s, { name: t, count: 0 });
      m.get(s).count++;
    }
  }
  // sort by count desc
  return [...m.entries()].sort((a,b)=>b[1].count - a[1].count);
}

function renderCategoriesPills(categories){
  // categorías como “pills” limpias
  return categories.map(c=>`
    <a class="pill" href="/categorias/${esc(c)}/">${esc(humanizeSlug(c))}</a>
  `.trim()).join("\n");
}

function renderIndexCards(posts, limit=40){
  if (!posts.length){
    return `<div class="empty">Todavía no hay publicaciones. Subí tu primer post en <code>/posts/&lt;categoria&gt;/</code>.</div>`;
  }
  return posts.slice(0,limit).map(p=>`
<article class="card">
  <a class="card-link" href="${esc(p.url)}">
    <div class="meta">${esc(p.catName)}${p.date ? " · "+esc(p.date) : ""}</div>
    <div class="title">${esc(p.title)}</div>
    <div class="desc">${esc(p.excerpt)}</div>
  </a>
</article>
  `.trim()).join("\n");
}

function renderTopTags(tagCloud, limit=14){
  if (!tagCloud.length) return `<div class="empty">Todavía no hay etiquetas.</div>`;
  return tagCloud.slice(0,limit).map(([slug, obj])=>`
    <a class="tag" href="/tags/${esc(slug)}/">
      <span class="tagname">${esc(obj.name)}</span>
      <span class="tagcount">${obj.count}</span>
    </a>
  `.trim()).join("\n");
}

function renderList(posts){
  if (!posts.length) return `<div class="empty">Todavía no hay publicaciones.</div>`;
  return posts.map(p=>`
    <a class="list-item" href="${esc(p.url)}">${esc(p.title)}</a>
  `.trim()).join("\n");
}

function applyBaseReplacements(html, categories, categoriesPills){
  return html
    .replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD)
    .replaceAll("{{SITE_TITLE}}", esc(SITE_TITLE))
    .replaceAll("{{SITE_BRAND}}", esc(SITE_BRAND))
    .replaceAll("{{SITE_TAGLINE}}", esc(SITE_TAGLINE))
    .replaceAll("{{CATEGORIES_PILLS}}", categoriesPills)
    .replaceAll("{{YEAR}}", String(new Date().getFullYear()));
}

async function copyPostsToDist(categories){
  for (const cat of categories){
    const srcCat = path.join(POSTS_DIR, cat);
    const dstCat = path.join(DIST_DIR, "posts", cat);
    await mkdirp(dstCat);

    let files = [];
    try { files = await fs.readdir(srcCat, { withFileTypes: true }); }
    catch { continue; }

    for (const f of files){
      if (!f.isFile()) continue;
      if (!f.name.toLowerCase().endsWith(".html")) continue;

      const src = path.join(srcCat, f.name);
      const dst = path.join(dstCat, f.name);

      const raw = await readFile(src);
      const out = raw.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")
        ? raw
        : raw.replace(/<\/head>/i, ADSENSE_HEAD + "\n</head>");

      await writeFile(dst, out);
    }
  }
}

async function main(){
  // Limpia dist
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await mkdirp(DIST_DIR);

  // Copia assets si existen
  try { await copyDir(path.join(ROOT,"css"), path.join(DIST_DIR,"css")); } catch {}
  try { await copyDir(path.join(ROOT,"img"), path.join(DIST_DIR,"img")); } catch {}

  const tplIndex = await loadTemplate("index.template.html");
  const tplCategory = await loadTemplate("category.template.html");
  const tplTag = await loadTemplate("tag.template.html");
  const tplContact = await loadTemplate("contact.template.html");

  const categories = await getCategoriesFromFolders();
  const posts = await collectPosts(categories);
  const tagCloud = buildTagCloud(posts);

  const categoriesPills = renderCategoriesPills(categories);

  // Copia posts HTML a dist/posts
  await copyPostsToDist(categories);

  // INDEX
  let indexHtml = applyBaseReplacements(tplIndex, categories, categoriesPills);
  indexHtml = indexHtml
    .replaceAll("{{POSTS_COUNT}}", String(posts.length))
    .replaceAll("{{POSTS_GRID}}", renderIndexCards(posts, 40))
    .replaceAll("{{TAGS_LIST}}", renderTopTags(tagCloud, 14));
  await writeFile(path.join(DIST_DIR, "index.html"), indexHtml);

  // CONTACTO
  let contactHtml = applyBaseReplacements(tplContact, categories, categoriesPills);
  await writeFile(path.join(DIST_DIR, "contacto", "index.html"), contactHtml);

  // CATEGORÍAS
  for (const cat of categories){
    const inCat = posts.filter(p=>p.cat === cat);
    let catHtml = applyBaseReplacements(tplCategory, categories, categoriesPills);
    catHtml = catHtml
      .replaceAll("{{CATEGORY_SLUG}}", esc(cat))
      .replaceAll("{{CATEGORY_NAME}}", esc(humanizeSlug(cat)))
      .replaceAll("{{POSTS_LIST}}", renderList(inCat));
    await writeFile(path.join(DIST_DIR, "categorias", cat, "index.html"), catHtml);
  }

  // TAGS
  for (const [slug, obj] of tagCloud){
    const tagged = posts.filter(p => (p.tags||[]).some(t => slugify(t) === slug));
    let tagHtml = applyBaseReplacements(tplTag, categories, categoriesPills);
    tagHtml = tagHtml
      .replaceAll("{{TAG_SLUG}}", esc(slug))
      .replaceAll("{{TAG_NAME}}", esc(obj.name))
      .replaceAll("{{POSTS_LIST}}", renderList(tagged));
    await writeFile(path.join(DIST_DIR, "tags", slug, "index.html"), tagHtml);
  }

  // SITEMAP + ROBOTS
  const urls = new Set();
  urls.add(SITE_URL + "/");
  urls.add(SITE_URL + "/contacto/");
  for (const c of categories) urls.add(SITE_URL + `/categorias/${c}/`);
  for (const [t] of tagCloud) urls.add(SITE_URL + `/tags/${t}/`);
  for (const p of posts) urls.add(SITE_URL + p.url);

  const sitemap =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls].sort().map(u=>`  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`;
  await writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap);
  await writeFile(path.join(DIST_DIR, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log(`OK: cats=${categories.length} posts=${posts.length} tags=${tagCloud.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

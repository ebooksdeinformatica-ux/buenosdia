// build.mjs — Buenosdia.com generator (SEO premium + OG/Twitter + sitemap)
// Node 18+ (Netlify ok)

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const SITE = {
  url: "https://buenosdia.com",
  brand: "BUENOSDIA.COM",
  title: "Buenos días de verdad",
  author: "buenosdia.com",
  locale: "es_AR",
  themeColor: "#ffffff",
  twitterSite: "", // opcional: "@tuusuario"
  defaultOgImage: "/img/og-default.webp", // poné una en /img cuando la tengas
};

// Si tenés el script de AdSense (el tuyo), pegalo acá tal cual:
const ADSENSE_HEAD = `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267"
     crossorigin="anonymous"></script>
`.trim();

// === Helpers ===
const exists = async (p) => {
  try { await fsp.access(p); return true; } catch { return false; }
};

const ensureDir = async (p) => fsp.mkdir(p, { recursive: true });

const readText = async (p) => (await fsp.readFile(p, "utf-8")).toString();

const writeText = async (p, content) => {
  await ensureDir(path.dirname(p));
  await fsp.writeFile(p, content, "utf-8");
};

const copyDir = async (src, dest) => {
  if (!(await exists(src))) return;
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fsp.copyFile(s, d);
  }
};

// “slug seguro”: baja, saca acentos, saca símbolos raros, espacios → guiones
const slugify = (str) =>
  (str || "")
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const titleize = (slug) => {
  const s = (slug || "").replace(/-/g, " ").trim();
  if (!s) return "";
  // Capitaliza cada palabra pero mantiene “y” “de” etc en minúscula (simple)
  const small = new Set(["y","de","del","la","el","los","las","en","con","para","por","a","un","una"]);
  return s.split(/\s+/).map((w, i) => {
    const lw = w.toLowerCase();
    if (i !== 0 && small.has(lw)) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  }).join(" ");
};

const stripHtml = (html) =>
  (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getMeta = (html, name) => {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']\\s*\\/?>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
};

const getTitleTag = (html) => {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripHtml(m[1]).trim() : "";
};

const getH1 = (html) => {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripHtml(m[1]).trim() : "";
};

const shortDesc = (text, max = 155) => {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  // corte prolijo
  const cut = t.slice(0, max - 1);
  const last = cut.lastIndexOf(" ");
  return (last > 60 ? cut.slice(0, last) : cut).trim() + "…";
};

const hash = (s) => crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 8);

const nowISODate = () => new Date().toISOString().slice(0, 10);

// === OG/Twitter generator ===
const buildSocialMeta = ({ url, title, description, image }) => {
  const u = url;
  const t = (title || "").replace(/"/g, "&quot;");
  const d = (description || "").replace(/"/g, "&quot;");
  const img = image || SITE.defaultOgImage;

  const absImg = img.startsWith("http") ? img : `${SITE.url}${img}`;

  return `
<link rel="canonical" href="${u}" />
<meta name="description" content="${d}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="${SITE.title}" />
<meta property="og:locale" content="${SITE.locale}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${u}" />
<meta property="og:image" content="${absImg}" />

<meta name="twitter:card" content="summary_large_image" />
${SITE.twitterSite ? `<meta name="twitter:site" content="${SITE.twitterSite}" />` : ""}
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${absImg}" />
`.trim();
};

// === Category description (tu “molde” + SEO invisible) ===
// - 1) describe la categoría visible
// - 2) meta description corta
// - 3) keywords (top términos)
const buildCategorySEO = ({ catTitle, posts, monthSalt }) => {
  if (!posts.length) {
    return {
      visible: "",
      metaDescription: "",
      keywords: "",
    };
  }

  // Texto base de posts (títulos + descripciones + cuerpo)
  const blob = posts
    .map((p) => `${p.title} ${p.description} ${p.plain}`)
    .join(" ")
    .toLowerCase();

  // stopwords ES (minimal)
  const stop = new Set([
    "de","la","el","los","las","y","o","a","en","con","por","para","un","una","uno","que","se","es","no",
    "lo","al","del","mi","tu","su","sus","te","vos","yo","hoy","mañana","mas","más","pero","si","sí",
    "esto","esa","ese","eso","ahi","ahí","cuando","como","qué","que","porque","porqué","ya","todo","toda",
  ]);

  const words = blob
    .replace(/[^a-záéíóúñ0-9\s]/gi, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !stop.has(w));

  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([w]) => w);

  const keywords = top.slice(0, 10).join(", ");

  // Variación mensual suave (para que si querés “mensual”, cambie levemente el tono)
  const vibe = [
    "sin careta",
    "con los pies en la tierra",
    "para leer rápido y sentir algo",
    "para arrancar sin humo",
    "real, simple, humano",
  ];
  const pick = vibe[parseInt(hash(`${catTitle}-${monthSalt}`), 16) % vibe.length];

  // Visible (tu tono)
  const visible =
    `Acá caen textos de **${catTitle}** ${pick}. ` +
    `No prometemos magia: te acompaña la mañana, te deja una idea que te ordena un poco, ` +
    `y te suelta para seguir el día.`;

  // Meta (corta, Google-friendly)
  const metaDescription = shortDesc(
    `Textos de ${catTitle} en buenosdia.com: lectura rápida, humana y real. Ideas para atravesar el día sin humo, con un cierre que deja una lección.`,
    155
  );

  return { visible, metaDescription, keywords };
};

// === Read posts ===
// Soporta:
// - /posts/<cat>/<post>.html
// - /posts/<cat>/<post>/index.html
// Ignora /posts/<cat>/index.html “placeholder”
const scanPosts = async () => {
  const postsDir = path.join(ROOT, "posts");
  if (!(await exists(postsDir))) return [];

  const cats = await fsp.readdir(postsDir, { withFileTypes: true });
  const results = [];

  for (const c of cats) {
    if (!c.isDirectory()) continue;
    const catSlug = slugify(c.name);
    const catPath = path.join(postsDir, c.name);

    const entries = await fsp.readdir(catPath, { withFileTypes: true });

    for (const e of entries) {
      if (e.isFile() && e.name.toLowerCase().endsWith(".html")) {
        // /posts/<cat>/<file>.html
        if (e.name.toLowerCase() === "index.html") continue; // placeholder
        const full = path.join(catPath, e.name);
        const rel = `/posts/${catSlug}/${e.name}`;
        results.push(await loadPost(full, catSlug, rel));
      }

      if (e.isDirectory()) {
        // /posts/<cat>/<dir>/index.html
        const idx = path.join(catPath, e.name, "index.html");
        if (await exists(idx)) {
          const rel = `/posts/${catSlug}/${slugify(e.name)}/`;
          results.push(await loadPost(idx, catSlug, rel));
        }
      }
    }
  }

  // Orden por fecha (si hay), sino por mtime
  results.sort((a, b) => (b.dateValue - a.dateValue));
  return results;
};

const loadPost = async (filepath, catSlug, urlPath) => {
  const html = await readText(filepath);

  const title = getTitleTag(html) || getH1(html) || "Publicación";
  const description = getMeta(html, "description") || shortDesc(stripHtml(html), 155);
  const keywords = getMeta(html, "keywords");
  const date = getMeta(html, "date") || ""; // YYYY-MM-DD ideal
  const ogImage = getMeta(html, "og:image") || "";

  let dateValue = 0;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) dateValue = new Date(date).getTime();
  if (!dateValue) {
    const st = await fsp.stat(filepath);
    dateValue = st.mtimeMs;
  }

  // tags desde keywords
  const tags = (keywords || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ raw: t, slug: slugify(t) }))
    .filter((t) => t.slug.length >= 2);

  const plain = stripHtml(html);

  return {
    filepath,
    catSlug,
    urlPath, // path público
    title,
    description,
    keywords,
    tags,
    plain,
    ogImage,
    date,
    dateValue,
    lastmod: new Date(dateValue).toISOString().slice(0, 10),
  };
};

// === Templates rendering ===
const renderTemplate = (tpl, map) => {
  let out = tpl;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ""));
  }
  return out;
};

// UI lists
const renderCategoriesNav = (categories) => {
  return categories
    .map((c) => `<a class="pill" href="/posts/${c.slug}/">${c.title}</a>`)
    .join("\n");
};

const renderPostsList = (posts, max = 20) => {
  const list = posts.slice(0, max);
  if (!list.length) {
    return `<div class="muted">Todavía no hay publicaciones. Subí tu primer post en <code>/posts/&lt;categoria&gt;/</code>.</div>`;
  }

  return list
    .map((p) => {
      const dt = p.date ? `<span class="meta">${p.date}</span>` : `<span class="meta">${p.lastmod}</span>`;
      return `
<article class="postrow">
  <div class="postrow_top">
    <a class="postrow_title" href="${p.urlPath}">${p.title}</a>
    ${dt}
  </div>
  <div class="postrow_desc">${p.description}</div>
  <div class="postrow_meta">
    <a class="chip" href="/posts/${p.catSlug}/">${titleize(p.catSlug)}</a>
    ${p.tags.slice(0, 4).map(t => `<a class="chip" href="/tags/${t.slug}/">#${t.raw}</a>`).join("")}
  </div>
</article>`.trim();
    })
    .join("\n");
};

const renderTagsList = (tagCounts, max = 16) => {
  const tags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max);

  if (!tags.length) return `<div class="muted">Todavía no hay etiquetas.</div>`;

  return tags
    .map(([slug, data]) => {
      return `<a class="tagrow" href="/tags/${slug}/"><span>#${data.label}</span><span class="badge">${data.count}</span></a>`;
    })
    .join("\n");
};

// Sitemap
const buildSitemap = (urls) => {
  const body = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "";
      const cf = u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : "";
      const pr = typeof u.priority === "number" ? `<priority>${u.priority.toFixed(1)}</priority>` : "";
      return `<url><loc>${u.loc}</loc>${lastmod}${cf}${pr}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`.trim();
};

// === Main build ===
async function main() {
  console.log("[build] start");

  // clean dist
  if (await exists(DIST)) await fsp.rm(DIST, { recursive: true, force: true });
  await ensureDir(DIST);

  // copy assets
  await copyDir(path.join(ROOT, "css"), path.join(DIST, "css"));
  await copyDir(path.join(ROOT, "js"), path.join(DIST, "js"));
  await copyDir(path.join(ROOT, "img"), path.join(DIST, "img"));
  await copyDir(path.join(ROOT, "posts"), path.join(DIST, "posts")); // publica posts tal cual están

  // templates
  const tplIndex = await readText(path.join(ROOT, "templates", "index.template.html"));
  const tplCategory = await readText(path.join(ROOT, "templates", "category.template.html"));
  const tplTag = await readText(path.join(ROOT, "templates", "tag.template.html"));
  const tplContact = await readText(path.join(ROOT, "templates", "contact.template.html"));

  const posts = await scanPosts();

  // categories from folder list + posts
  const catMap = new Map();
  for (const p of posts) {
    if (!catMap.has(p.catSlug)) catMap.set(p.catSlug, { slug: p.catSlug, title: titleize(p.catSlug) });
  }

  // Además: si hay carpetas en /posts aunque estén vacías, igual las listamos (sin duplicar)
  const postsDir = path.join(ROOT, "posts");
  if (await exists(postsDir)) {
    const cats = await fsp.readdir(postsDir, { withFileTypes: true });
    for (const c of cats) {
      if (!c.isDirectory()) continue;
      const slug = slugify(c.name);
      if (!slug) continue;
      if (!catMap.has(slug)) catMap.set(slug, { slug, title: titleize(slug) });
    }
  }

  const categories = [...catMap.values()].sort((a, b) => a.title.localeCompare(b.title, "es"));

  // tags map
  const tagCounts = new Map(); // slug -> {label,count}
  const tagToPosts = new Map();
  for (const p of posts) {
    for (const t of p.tags) {
      if (!tagCounts.has(t.slug)) tagCounts.set(t.slug, { label: t.raw, count: 0 });
      tagCounts.get(t.slug).count++;
      if (!tagToPosts.has(t.slug)) tagToPosts.set(t.slug, []);
      tagToPosts.get(t.slug).push(p);
    }
  }

  const categoriesNav = renderCategoriesNav(categories);
  const postsListHome = renderPostsList(posts, 18);
  const tagsListHome = renderTagsList(tagCounts, 20);

  // HOME social meta
  const homeTitle = `${SITE.title} — textos para mañanas reales`;
  const homeDesc = "Lectura rápida, humana y real. Textos para arrancar sin humo: te acompaña la mañana y te deja una lección sin predicarte.";
  const homeUrl = `${SITE.url}/`;
  const homeSocial = buildSocialMeta({
    url: homeUrl,
    title: homeTitle,
    description: homeDesc,
    image: SITE.defaultOgImage,
  });

  // Write HOME
  const homeHtml = renderTemplate(tplIndex, {
    SITE_BRAND: SITE.brand,
    SITE_TITLE: SITE.title,
    SITE_DESC: homeDesc,
    SITE_URL: SITE.url,
    ADSENSE_HEAD,
    SOCIAL_META: homeSocial,
    CATEGORIES_NAV: categoriesNav,
    POSTS_COUNT: posts.length,
    POSTS_LIST: postsListHome,
    TAGS_LIST: tagsListHome,
    YEAR: new Date().getFullYear(),
  });

  await writeText(path.join(DIST, "index.html"), homeHtml);

  // CONTACT
  const contactUrl = `${SITE.url}/contacto/`;
  const contactTitle = `Contacto — ${SITE.title}`;
  const contactDesc = "Contacto directo. Un mensaje simple y listo.";
  const contactSocial = buildSocialMeta({
    url: contactUrl,
    title: contactTitle,
    description: contactDesc,
    image: SITE.defaultOgImage,
  });

  const contactHtml = renderTemplate(tplContact, {
    SITE_BRAND: SITE.brand,
    SITE_TITLE: SITE.title,
    SITE_URL: SITE.url,
    ADSENSE_HEAD,
    SOCIAL_META: contactSocial,
    CATEGORIES_NAV: categoriesNav,
    YEAR: new Date().getFullYear(),
  });

  await writeText(path.join(DIST, "contacto", "index.html"), contactHtml);

  // CATEGORY pages
  const monthSalt = new Date().toISOString().slice(0, 7); // YYYY-MM (para rotar “mensual”)
  for (const c of categories) {
    const catPosts = posts.filter((p) => p.catSlug === c.slug);
    const seo = buildCategorySEO({ catTitle: c.title, posts: catPosts, monthSalt });

    const catUrl = `${SITE.url}/posts/${c.slug}/`;
    const catTitle = `${c.title} — ${SITE.title}`;
    const catDesc = seo.metaDescription || `Textos de ${c.title} en buenosdia.com.`;
    const catSocial = buildSocialMeta({
      url: catUrl,
      title: catTitle,
      description: catDesc,
      image: SITE.defaultOgImage,
    });

    const catHtml = renderTemplate(tplCategory, {
      SITE_BRAND: SITE.brand,
      SITE_TITLE: SITE.title,
      SITE_URL: SITE.url,
      ADSENSE_HEAD,
      SOCIAL_META: catSocial,
      CATEGORIES_NAV: categoriesNav,

      CATEGORY_TITLE: c.title,
      CATEGORY_SLUG: c.slug,

      CATEGORY_VISIBLE_DESC: seo.visible ? `<p class="catdesc">${seo.visible}</p>` : "",
      CATEGORY_META_DESCRIPTION: catDesc,
      CATEGORY_KEYWORDS: seo.keywords || "",
      POSTS_COUNT: catPosts.length,
      POSTS_LIST: renderPostsList(catPosts, 50),

      YEAR: new Date().getFullYear(),
    });

    await writeText(path.join(DIST, "posts", c.slug, "index.html"), catHtml);
  }

  // TAG pages
  for (const [tagSlug, list] of tagToPosts.entries()) {
    const label = tagCounts.get(tagSlug)?.label || tagSlug;
    const tagUrl = `${SITE.url}/tags/${tagSlug}/`;
    const tagTitle = `#${label} — ${SITE.title}`;
    const tagDesc = shortDesc(`Publicaciones relacionadas con ${label} en buenosdia.com. Lectura rápida, humana y real.`, 155);
    const tagSocial = buildSocialMeta({
      url: tagUrl,
      title: tagTitle,
      description: tagDesc,
      image: SITE.defaultOgImage,
    });

    const html = renderTemplate(tplTag, {
      SITE_BRAND: SITE.brand,
      SITE_TITLE: SITE.title,
      SITE_URL: SITE.url,
      ADSENSE_HEAD,
      SOCIAL_META: tagSocial,
      CATEGORIES_NAV: categoriesNav,

      TAG_LABEL: label,
      TAG_SLUG: tagSlug,
      POSTS_COUNT: list.length,
      POSTS_LIST: renderPostsList(list, 50),

      YEAR: new Date().getFullYear(),
    });

    await writeText(path.join(DIST, "tags", tagSlug, "index.html"), html);
  }

  // robots.txt
  const robots = `
User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`.trim();
  await writeText(path.join(DIST, "robots.txt"), robots);

  // sitemap.xml “premium”
  const urls = [];

  // core
  urls.push({ loc: `${SITE.url}/`, lastmod: nowISODate(), changefreq: "daily", priority: 1.0 });
  urls.push({ loc: `${SITE.url}/contacto/`, lastmod: nowISODate(), changefreq: "monthly", priority: 0.3 });

  // categories
  for (const c of categories) {
    const catPosts = posts.filter((p) => p.catSlug === c.slug);
    const last = catPosts[0]?.lastmod || nowISODate();
    urls.push({ loc: `${SITE.url}/posts/${c.slug}/`, lastmod: last, changefreq: "weekly", priority: 0.7 });
  }

  // tags
  for (const [tagSlug, list] of tagToPosts.entries()) {
    const last = list[0]?.lastmod || nowISODate();
    urls.push({ loc: `${SITE.url}/tags/${tagSlug}/`, lastmod: last, changefreq: "weekly", priority: 0.4 });
  }

  // posts
  for (const p of posts) {
    const loc = p.urlPath.startsWith("http") ? p.urlPath : `${SITE.url}${p.urlPath}`;
    urls.push({ loc, lastmod: p.lastmod, changefreq: "yearly", priority: 0.8 });
  }

  // dedupe loc
  const seen = new Set();
  const deduped = [];
  for (const u of urls) {
    if (seen.has(u.loc)) continue;
    seen.add(u.loc);
    deduped.push(u);
  }

  await writeText(path.join(DIST, "sitemap.xml"), buildSitemap(deduped));

  console.log(`[build] done. posts=${posts.length} cats=${categories.length} tags=${tagToPosts.size}`);
}

main().catch((err) => {
  console.error("[build] ERROR", err);
  process.exit(1);
});

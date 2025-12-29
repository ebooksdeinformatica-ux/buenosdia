// build.mjs
import { promises as fs } from "fs";
import path from "path";

const SITE = {
  domain: "https://buenosdia.com",
  siteTitle: "Buenos días de verdad",
  siteBrand: "BUENOSDIA.COM",
  tagline: "Hecho para abrir rápido, leer fácil y sentir que te hablan a vos. Sin humo.",
  year: new Date().getFullYear(),
};

const ADSENSE_HEAD = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267" crossorigin="anonymous"></script>`;

const DIRS = {
  templates: "templates",
  posts: "posts",
  dist: "dist",
};

const FILES = {
  indexTpl: "index.template.html",
  categoryTpl: "category.template.html",
  tagTpl: "tag.template.html",
  contactTpl: "contact.template.html",
};

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin acentos
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readText(p) {
  return fs.readFile(p, "utf-8");
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function rmDir(p) {
  if (await exists(p)) await fs.rm(p, { recursive: true, force: true });
}

async function copyDir(src, dst) {
  if (!(await exists(src))) return;
  await ensureDir(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const sp = path.join(src, e.name);
    const dp = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(sp, dp);
    else await fs.copyFile(sp, dp);
  }
}

function socialMeta({ title, description, url, imageUrl, type = "website" }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImg = imageUrl ? escapeHtml(imageUrl) : "";

  // Nota: si no hay imagen todavía, no rompemos nada.
  return `
<link rel="canonical" href="${safeUrl}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${escapeHtml(SITE.siteTitle)}">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:url" content="${safeUrl}">
${safeImg ? `<meta property="og:image" content="${safeImg}">` : ""}

<meta name="twitter:card" content="${safeImg ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
${safeImg ? `<meta name="twitter:image" content="${safeImg}">` : ""}
`.trim();
}

function truncateMeta(s, max = 155) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

async function listCategories() {
  const base = DIRS.posts;
  const out = [];
  if (!(await exists(base))) return out;

  const entries = await fs.readdir(base, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const raw = e.name;
    const slug = slugify(raw);
    if (!slug) continue;
    out.push({ name: raw, slug, dir: path.join(base, raw) });
  }

  // Dedupe por slug (evita duplicados por acentos/mayúsculas)
  const map = new Map();
  for (const c of out) if (!map.has(c.slug)) map.set(c.slug, c);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

async function listPostsForCategory(category) {
  // Estructura esperada:
  // posts/<categoria>/<post-slug>/index.html  (o .html directo)
  const posts = [];
  const entries = await fs.readdir(category.dir, { withFileTypes: true });

  for (const e of entries) {
    const p = path.join(category.dir, e.name);
    if (e.isDirectory()) {
      const idx = path.join(p, "index.html");
      if (await exists(idx)) posts.push({ file: idx, folder: e.name });
    } else if (e.isFile() && e.name.endsWith(".html")) {
      posts.push({ file: p, folder: null });
    }
  }

  // metadata básico desde el HTML
  const detailed = [];
  for (const item of posts) {
    const html = await readText(item.file);

    const title =
      (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "Publicación")
        .replace(/\s+/g, " ")
        .trim();

    const desc =
      (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ||
        stripHtml(html).slice(0, 300)).trim();

    const keywords =
      (html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)?.[1] || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    // URL final donde va a vivir
    let urlPath = "";
    if (item.folder) {
      urlPath = `/posts/${category.slug}/${slugify(item.folder)}/`;
    } else {
      // archivo html directo
      const base = path.basename(item.file, ".html");
      urlPath = `/posts/${category.slug}/${slugify(base)}/`;
    }

    detailed.push({
      title,
      description: truncateMeta(desc, 170),
      url: SITE.domain + urlPath,
      urlPath,
      lastmod: new Date().toISOString().slice(0, 10),
      tags: keywords,
      sourceFile: item.file,
      categorySlug: category.slug,
      categoryName: category.name,
      folder: item.folder ? slugify(item.folder) : slugify(path.basename(item.file, ".html")),
    });
  }

  // Orden: por ahora, alfabético (cuando haya fechas reales en posts, lo cambiamos)
  detailed.sort((a, b) => a.title.localeCompare(b.title, "es"));
  return detailed;
}

function renderCategoriesPills(categories) {
  // pills horizontal scroll
  return categories
    .map(
      (c) =>
        `<a class="pill" href="/posts/${c.slug}/" title="${escapeHtml(c.name)}">${escapeHtml(
          c.name
        )}</a>`
    )
    .join("");
}

function renderPostsGrid(posts, limit = 12) {
  const items = posts.slice(0, limit);
  if (!items.length) {
    return `<div class="empty">Todavía no hay publicaciones. Subí tu primer post en <code>/posts/&lt;categoria&gt;/&lt;post&gt;/index.html</code>.</div>`;
  }
  return items
    .map(
      (p) => `
<a class="card" href="${p.urlPath}">
  <div class="cardTitle">${escapeHtml(p.title)}</div>
  <div class="cardDesc">${escapeHtml(truncateMeta(p.description, 110))}</div>
  <div class="cardMeta">${escapeHtml(p.categoryName)}</div>
</a>`.trim()
    )
    .join("");
}

function renderTagsList(allTags, limit = 12) {
  const tags = [...allTags.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (!tags.length) return `<div class="muted">Todavía no hay etiquetas.</div>`;

  return tags
    .map(([tag, count]) => `<a class="tag" href="/tag/${slugify(tag)}/">${escapeHtml(tag)} <span class="tagCount">${count}</span></a>`)
    .join("");
}

function categoryDescriptionFromPosts(categoryName, posts) {
  if (!posts.length) return "";

  // “SEO premium” pero humanizado: 1 párrafo corto + 1 frase “molde”
  // (Lo vamos a ir refinando con más posts)
  const topics = [];
  for (const p of posts) {
    const words = stripHtml(p.title + " " + (p.description || ""))
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/g)
      .filter((w) => w.length >= 4 && !["para", "como", "este", "esta", "desde", "porque", "cuando", "pero", "todo", "hoy", "dias", "buenos"].includes(w));
    topics.push(...words);
  }

  const freq = new Map();
  for (const w of topics) freq.set(w, (freq.get(w) || 0) + 1);

  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);

  const visible = truncateMeta(
    `Esta categoría junta textos que no fingen. ${categoryName} es para esas mañanas donde uno arranca cruzado, cansado o sensible, pero igual intenta. Vas a ver temas como ${top.slice(0, 6).join(", ")}… dicho simple, con VOz, para VOS.`,
    220
  );

  const meta = truncateMeta(
    `${categoryName}: textos reales, humanos y directos. Temas: ${top.slice(0, 8).join(", ")}. Buenosdia.com`,
    155
  );

  const keywords = top.slice(0, 12).join(", ");

  return { visible, meta, keywords };
}

function applyTemplate(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v ?? "");
  }
  return out;
}

async function writeFile(p, content) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, "utf-8");
}

async function main() {
  // clean dist
  await rmDir(DIRS.dist);
  await ensureDir(DIRS.dist);

  // copy assets
  await copyDir("css", path.join(DIRS.dist, "css"));
  await copyDir("img", path.join(DIRS.dist, "img"));
  await copyDir("js", path.join(DIRS.dist, "js"));

  // load templates
  const indexTpl = await readText(path.join(DIRS.templates, FILES.indexTpl));
  const categoryTpl = await readText(path.join(DIRS.templates, FILES.categoryTpl));
  const tagTpl = await readText(path.join(DIRS.templates, FILES.tagTpl));
  const contactTpl = await readText(path.join(DIRS.templates, FILES.contactTpl));

  const categories = await listCategories();

  // collect all posts
  const allPosts = [];
  const allTags = new Map(); // tag -> count

  const categoryPostsMap = new Map();
  for (const c of categories) {
    const posts = await listPostsForCategory(c);
    categoryPostsMap.set(c.slug, posts);
    for (const p of posts) {
      allPosts.push(p);
      for (const t of p.tags || []) {
        allTags.set(t, (allTags.get(t) || 0) + 1);
      }
    }
  }

  // HOME
  const homeTitle = `${SITE.siteTitle} — Textos para mañanas reales`;
  const homeDesc = truncateMeta(SITE.tagline, 155);
  const homeUrl = SITE.domain + "/";

  const homeHtml = applyTemplate(indexTpl, {
    PAGE_TITLE: escapeHtml(homeTitle),
    PAGE_DESCRIPTION: escapeHtml(homeDesc),
    SITE_TITLE: escapeHtml(SITE.siteTitle),
    SITE_BRAND: escapeHtml(SITE.siteBrand),
    SITE_TAGLINE: escapeHtml(SITE.tagline),
    YEAR: String(SITE.year),
    CATEGORIES_PILLS: renderCategoriesPills(categories),
    POSTS_COUNT: String(allPosts.length),
    POSTS_GRID: renderPostsGrid(allPosts, 12),
    TAGS_LIST: renderTagsList(allTags, 12),
    SOCIAL_META: socialMeta({
      title: homeTitle,
      description: homeDesc,
      url: homeUrl,
      imageUrl: "", // cuando tengas og-image, lo ponemos
      type: "website",
    }),
    ADSENSE_HEAD,
  });

  await writeFile(path.join(DIRS.dist, "index.html"), homeHtml);

  // CONTACT
  const contactTitle = `Contacto — ${SITE.siteTitle}`;
  const contactDesc = truncateMeta("Un contacto simple. Sin vueltas.", 155);
  const contactUrl = SITE.domain + "/contacto/";

  const contactHtml = applyTemplate(contactTpl, {
    PAGE_TITLE: escapeHtml(contactTitle),
    PAGE_DESCRIPTION: escapeHtml(contactDesc),
    SITE_TITLE: escapeHtml(SITE.siteTitle),
    SITE_BRAND: escapeHtml(SITE.siteBrand),
    SITE_TAGLINE: escapeHtml(SITE.tagline),
    YEAR: String(SITE.year),
    CATEGORIES_PILLS: renderCategoriesPills(categories),
    SOCIAL_META: socialMeta({
      title: contactTitle,
      description: contactDesc,
      url: contactUrl,
      type: "website",
    }),
    ADSENSE_HEAD,
  });

  await writeFile(path.join(DIRS.dist, "contacto", "index.html"), contactHtml);

  // CATEGORY PAGES (en /posts/<categoria>/)
  for (const c of categories) {
    const posts = categoryPostsMap.get(c.slug) || [];

    const descObj = categoryDescriptionFromPosts(c.name, posts);
    const visibleDesc = descObj?.visible || "";
    const metaDesc = descObj?.meta || truncateMeta(`Textos de ${c.name} en ${SITE.siteTitle}.`, 155);

    const catTitle = `${c.name} — ${SITE.siteTitle}`;
    const catUrl = SITE.domain + `/posts/${c.slug}/`;

    const catHtml = applyTemplate(categoryTpl, {
      PAGE_TITLE: escapeHtml(catTitle),
      PAGE_DESCRIPTION: escapeHtml(metaDesc),
      SITE_TITLE: escapeHtml(SITE.siteTitle),
      SITE_BRAND: escapeHtml(SITE.siteBrand),
      SITE_TAGLINE: escapeHtml(SITE.tagline),
      YEAR: String(SITE.year),
      CATEGORIES_PILLS: renderCategoriesPills(categories),
      POSTS_COUNT: String(posts.length),
      POSTS_GRID: renderPostsGrid(posts, 30),
      CATEGORY_NAME: escapeHtml(c.name),
      CATEGORY_DESCRIPTION_VISIBLE: escapeHtml(visibleDesc),
      SOCIAL_META: socialMeta({
        title: catTitle,
        description: metaDesc,
        url: catUrl,
        type: "website",
      }),
      ADSENSE_HEAD,
    });

    await writeFile(path.join(DIRS.dist, "posts", c.slug, "index.html"), catHtml);

    // Copiar posts a dist tal cual
    for (const p of posts) {
      const raw = await readText(p.sourceFile);

      // Dejar el HTML del post tal cual, pero podrías inyectar SOCIAL_META si querés luego.
      const outDir = path.join(DIRS.dist, "posts", c.slug, p.folder);
      await ensureDir(outDir);
      await fs.writeFile(path.join(outDir, "index.html"), raw, "utf-8");
    }
  }

  // TAG PAGES (en /tag/<tag>/) (solo si hay tags)
  const tagEntries = [...allTags.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag] of tagEntries) {
    const tagSlug = slugify(tag);
    const tagPosts = allPosts.filter((p) => (p.tags || []).some((t) => slugify(t) === tagSlug));

    const tagTitle = `${tag} — Etiqueta — ${SITE.siteTitle}`;
    const tagDesc = truncateMeta(`Posts relacionados con “${tag}”. Textos para mañanas reales.`, 155);
    const tagUrl = SITE.domain + `/tag/${tagSlug}/`;

    const tagHtml = applyTemplate(tagTpl, {
      PAGE_TITLE: escapeHtml(tagTitle),
      PAGE_DESCRIPTION: escapeHtml(tagDesc),
      SITE_TITLE: escapeHtml(SITE.siteTitle),
      SITE_BRAND: escapeHtml(SITE.siteBrand),
      SITE_TAGLINE: escapeHtml(SITE.tagline),
      YEAR: String(SITE.year),
      CATEGORIES_PILLS: renderCategoriesPills(categories),
      TAG_NAME: escapeHtml(tag),
      POSTS_COUNT: String(tagPosts.length),
      POSTS_GRID: renderPostsGrid(tagPosts, 30),
      SOCIAL_META: socialMeta({
        title: tagTitle,
        description: tagDesc,
        url: tagUrl,
        type: "website",
      }),
      ADSENSE_HEAD,
    });

    await writeFile(path.join(DIRS.dist, "tag", tagSlug, "index.html"), tagHtml);
  }

  // SITEMAP (premium)
  const urls = [];

  function addUrl(loc, lastmod, changefreq, priority) {
    urls.push({ loc, lastmod, changefreq, priority });
  }

  addUrl(SITE.domain + "/", new Date().toISOString().slice(0, 10), "daily", "1.0");
  addUrl(SITE.domain + "/contacto/", new Date().toISOString().slice(0, 10), "monthly", "0.6");

  for (const c of categories) {
    addUrl(SITE.domain + `/posts/${c.slug}/`, new Date().toISOString().slice(0, 10), "weekly", "0.8");
  }

  for (const p of allPosts) {
    addUrl(p.url, p.lastmod, "monthly", "0.7");
  }

  for (const [tag] of tagEntries) {
    addUrl(SITE.domain + `/tag/${slugify(tag)}/`, new Date().toISOString().slice(0, 10), "weekly", "0.5");
  }

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  await writeFile(path.join(DIRS.dist, "sitemap.xml"), sitemap);

  // ROBOTS
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE.domain}/sitemap.xml
`;
  await writeFile(path.join(DIRS.dist, "robots.txt"), robots);

  console.log("✅ Build OK → dist/ generado");
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * BuenosDia.com - build.mjs (robusto)
 * - Genera dist/ con HTML listo (sin {{placeholders}})
 * - Copia assets (css/img/js) a dist/
 * - OG/Twitter + canonical automáticos
 * - Sitemap.xml "premium" + robots.txt
 * - Categorías y tags se arman leyendo /posts
 *
 * Convención de posts soportada:
 *  A) /posts/<categoria>/<slug>/index.html
 *  B) /posts/<categoria>/<slug>.html
 *  C) /posts/<categoria>/index.html (solo para que GitHub "vea" carpeta; NO se toma como post)
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TEMPLATES_DIR = path.join(ROOT, "templates");
const POSTS_DIR = path.join(ROOT, "posts");

const SITE = {
  domain: "buenosdia.com",
  baseUrl: "https://buenosdia.com",
  brandMini: "BUENOSDIA.COM",
  siteTitle: "Buenos días de verdad",
  tagline: "Hecho para abrir rápido, leer fácil y sentir que te hablan a vos. Sin humo.",
  year: "2025",
  defaultOgImage: "/img/og.webp", // si no existe, igual no rompe
  twitterSite: "", // opcional: "@tuCuenta"
  twitterCreator: "", // opcional
  adsenseHead: process.env.ADSENSE_HEAD || "", // pegás el <script ...> acá como variable Netlify
};

// ========= helpers =========
const exists = async (p) => {
  try { await fsp.access(p); return true; } catch { return false; }
};

const ensureDir = async (p) => fsp.mkdir(p, { recursive: true });

const readText = async (p) => fsp.readFile(p, "utf8");

const writeText = async (p, s) => {
  await ensureDir(path.dirname(p));
  await fsp.writeFile(p, s, "utf8");
};

const copyDir = async (src, dest) => {
  if (!(await exists(src))) return;
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const from = path.join(src, e.name);
    const to = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(from, to);
    else await fsp.copyFile(from, to);
  }
};

const stripHtml = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const htmlEscape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const slugToTitle = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const normalizeSlug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function mdDate(d = new Date()) {
  // YYYY-MM-DD
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function buildSocialMeta({ url, title, description, image }) {
  const canonical = `<link rel="canonical" href="${htmlEscape(url)}" />`;
  const og = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${htmlEscape(SITE.siteTitle)}" />`,
    `<meta property="og:url" content="${htmlEscape(url)}" />`,
    `<meta property="og:title" content="${htmlEscape(title)}" />`,
    `<meta property="og:description" content="${htmlEscape(description)}" />`,
    image ? `<meta property="og:image" content="${htmlEscape(image)}" />` : "",
  ].filter(Boolean).join("\n  ");

  const tw = [
    `<meta name="twitter:card" content="summary_large_image" />`,
    SITE.twitterSite ? `<meta name="twitter:site" content="${htmlEscape(SITE.twitterSite)}" />` : "",
    SITE.twitterCreator ? `<meta name="twitter:creator" content="${htmlEscape(SITE.twitterCreator)}" />` : "",
    `<meta name="twitter:title" content="${htmlEscape(title)}" />`,
    `<meta name="twitter:description" content="${htmlEscape(description)}" />`,
    image ? `<meta name="twitter:image" content="${htmlEscape(image)}" />` : "",
  ].filter(Boolean).join("\n  ");

  return `${canonical}\n  ${og}\n  ${tw}`;
}

function renderTemplate(tpl, map) {
  let out = tpl;
  for (const [k, v] of Object.entries(map)) {
    out = out.replaceAll(`{{${k}}}`, v ?? "");
  }
  return out;
}

// ========= load templates =========
async function loadTemplates() {
  const files = {
    index: path.join(TEMPLATES_DIR, "index.template.html"),
    category: path.join(TEMPLATES_DIR, "category.template.html"),
    tag: path.join(TEMPLATES_DIR, "tag.template.html"),
    contact: path.join(TEMPLATES_DIR, "contact.template.html"),
  };

  const missing = [];
  for (const [k, p] of Object.entries(files)) if (!(await exists(p))) missing.push(`${k}: ${p}`);
  if (missing.length) {
    throw new Error("Faltan templates:\n" + missing.join("\n"));
  }

  return {
    index: await readText(files.index),
    category: await readText(files.category),
    tag: await readText(files.tag),
    contact: await readText(files.contact),
  };
}

// ========= scan posts =========
async function scanPosts() {
  const posts = [];

  if (!(await exists(POSTS_DIR))) return posts;

  const cats = await fsp.readdir(POSTS_DIR, { withFileTypes: true });
  for (const c of cats) {
    if (!c.isDirectory()) continue;
    const catSlug = c.name;
    const catDir = path.join(POSTS_DIR, catSlug);

    const entries = await fsp.readdir(catDir, { withFileTypes: true });

    for (const e of entries) {
      // ignora el index.html "placeholder" de la categoría
      if (e.isFile() && e.name.toLowerCase() === "index.html") continue;

      // A) carpeta con index.html
      if (e.isDirectory()) {
        const slug = e.name;
        const p = path.join(catDir, slug, "index.html");
        if (await exists(p)) {
          posts.push(await parsePostFile(p, catSlug, slug));
        }
        continue;
      }

      // B) html directo
      if (e.isFile() && e.name.toLowerCase().endsWith(".html")) {
        const slug = e.name.replace(/\.html$/i, "");
        const p = path.join(catDir, e.name);
        posts.push(await parsePostFile(p, catSlug, slug));
      }
    }
  }

  // orden por fecha (si existe) o por título
  posts.sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || "") || a.title.localeCompare(b.title));
  return posts;
}

async function parsePostFile(filePath, categorySlug, slug) {
  const html = await readText(filePath);

  // title del <title> o H1
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let title = titleMatch?.[1]?.trim() || "";

  if (!title) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    title = h1?.[1]?.replace(/<[^>]+>/g, "").trim() || slugToTitle(slug);
  }

  // description: primer párrafo o recorte texto
  let description = "";
  const p1 = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  description = p1?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
  if (!description) {
    const txt = stripHtml(html);
    description = txt.slice(0, 160);
  }
  description = description.replace(/\s+/g, " ").trim();

  // tags: buscá meta keywords o data-tags="a,b"
  let tags = [];
  const kw = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)?.[1];
  if (kw) tags = kw.split(",").map((t) => t.trim()).filter(Boolean);

  const dataTags = html.match(/data-tags=["']([^"']+)["']/i)?.[1];
  if (dataTags) tags = [...new Set([...tags, ...dataTags.split(",").map((t) => t.trim())])];

  tags = tags.map(normalizeSlug).filter(Boolean).slice(0, 25);

  // date: meta article:published_time o data-date
  let dateISO = "";
  const d1 = html.match(/data-date=["']([^"']+)["']/i)?.[1];
  if (d1) dateISO = d1.slice(0, 10);

  const urlPath = `/posts/${categorySlug}/${slug}/`;
  return {
    id: sha1(filePath),
    filePath,
    categorySlug,
    categoryName: slugToTitle(categorySlug),
    slug,
    title,
    description,
    tags,
    dateISO,
    urlPath,
  };
}

// ========= build pages =========
function categoriesBar(categories) {
  // chips tipo “pill”
  return categories
    .map((c) => `<a class="chip" href="/posts/${c.slug}/">${htmlEscape(c.name)}</a>`)
    .join("\n      ");
}

function postsGrid(posts, limit = 12) {
  const list = posts.slice(0, limit);
  if (!list.length) {
    return `<div class="muted">Todavía no hay publicaciones. Subí tu primer post en <code>/posts/&lt;categoria&gt;/&lt;post&gt;/index.html</code>.</div>`;
  }
  return list
    .map((p) => {
      return `
      <article class="post">
        <a class="posttitle" href="${p.urlPath}">${htmlEscape(p.title)}</a>
        <div class="postmeta">
          <span class="pill">${htmlEscape(p.categoryName)}</span>
          ${p.dateISO ? `<span class="muted">${htmlEscape(p.dateISO)}</span>` : ""}
        </div>
        <p class="postdesc">${htmlEscape(p.description)}</p>
      </article>
      `.trim();
    })
    .join("\n");
}

function tagsList(tags, limit = 12) {
  const list = tags.slice(0, limit);
  if (!list.length) return `<div class="muted">Todavía no hay etiquetas.</div>`;
  return list
    .map((t) => `<a class="tag" href="/tags/${t.slug}/">${htmlEscape(t.label)}</a>`)
    .join("\n");
}

// “Molde” para descripción de categoría (simple, humano, sin IA externa)
function generateCategoryDescription(categoryName, postsInCat) {
  if (!postsInCat.length) return "";

  const sample = postsInCat.slice(0, 6).map((p) => stripHtml(p.title + " " + p.description)).join(" ");
  const words = sample
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !["para","pero","porque","cuando","donde","desde","hasta","esto","esta","este","estos","estas","como","con","sin","sobre","entre","algo","hoy","ayer","todo","toda","todos","todas"].includes(w));

  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  const top = [...freq.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8).map(([w]) => w);
  const k = top.slice(0, 5).join(", ");

  // Visible (humano, tu onda)
  const visible =
    `Si caíste acá, es porque <b>${htmlEscape(categoryName)}</b> te está rozando algo. ` +
    `Acá no hay “motivación de taza”: hay textos cortos, honestos, para atravesar la mañana sin fingir. ` +
    `Si estás con la cabeza llena o el pecho apretado, entrá igual. Capaz encontrás una frase, una idea, ` +
    `o ese empujoncito mínimo que te deja seguir.`;

  // Meta description ideal ~150-160 chars
  const meta =
    `Textos reales de ${categoryName}: mañana, emoción, energía y foco sin humo. Lectura rápida, humana y directa. (${k}).`;

  // Keywords
  const keywords = [...new Set([normalizeSlug(categoryName), ...top].filter(Boolean))].slice(0, 18).join(", ");

  return { visible, meta: meta.slice(0, 160), keywords };
}

async function build() {
  const templates = await loadTemplates();

  // reset dist
  await fsp.rm(DIST, { recursive: true, force: true });
  await ensureDir(DIST);

  // copy assets
  await copyDir(path.join(ROOT, "css"), path.join(DIST, "css"));
  await copyDir(path.join(ROOT, "img"), path.join(DIST, "img"));
  await copyDir(path.join(ROOT, "js"), path.join(DIST, "js"));

  // scan posts
  const posts = await scanPosts();

  // categories data
  const catMap = new Map();
  for (const p of posts) {
    if (!catMap.has(p.categorySlug)) {
      catMap.set(p.categorySlug, { slug: p.categorySlug, name: slugToTitle(p.categorySlug), posts: [] });
    }
    catMap.get(p.categorySlug).posts.push(p);
  }

  // IMPORTANT: también incluir categorías aunque no tengan posts (carpetas existentes)
  if (await exists(POSTS_DIR)) {
    const cats = await fsp.readdir(POSTS_DIR, { withFileTypes: true });
    for (const c of cats) {
      if (!c.isDirectory()) continue;
      if (!catMap.has(c.name)) catMap.set(c.name, { slug: c.name, name: slugToTitle(c.name), posts: [] });
    }
  }

  const categories = [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const catBarHtml = categoriesBar(categories);

  // tags data
  const tagMap = new Map();
  for (const p of posts) {
    for (const t of p.tags) {
      if (!tagMap.has(t)) tagMap.set(t, { slug: t, label: slugToTitle(t) , posts: [] });
      tagMap.get(t).posts.push(p);
    }
  }
  const tags = [...tagMap.values()].sort((a, b) => b.posts.length - a.posts.length);

  // ===== index =====
  const indexUrl = `${SITE.baseUrl}/`;
  const indexTitle = SITE.siteTitle;
  const indexDesc = SITE.tagline;

  const socialMetaIndex = buildSocialMeta({
    url: indexUrl,
    title: indexTitle,
    description: indexDesc,
    image: `${SITE.baseUrl}${SITE.defaultOgImage}`,
  });

  const indexHtml = renderTemplate(templates.index, {
    SITE_BRAND: htmlEscape(SITE.brandMini),
    SITE_TITLE: htmlEscape(SITE.siteTitle),
    SITE_TAGLINE: htmlEscape(SITE.tagline),
    CATEGORIES_BAR: catBarHtml,
    POSTS_COUNT: String(posts.length),
    POSTS_GRID: postsGrid(posts, 12),
    TAGS_LIST: tagsList(tags, 14),
    SOCIAL_META: socialMetaIndex,
    ADSENSE_HEAD: SITE.adsenseHead || "",
  });

  await writeText(path.join(DIST, "index.html"), indexHtml);

  // ===== categories pages =====
  for (const c of categories) {
    const desc = generateCategoryDescription(c.name, c.posts);
    const catUrlPath = `/posts/${c.slug}/`;
    const catUrl = `${SITE.baseUrl}${catUrlPath}`;

    const pageTitle = `${c.name} — ${SITE.siteTitle}`;
    const pageDescription = desc?.meta || `Publicaciones de ${c.name} en ${SITE.siteTitle}.`;
    const pageKeywords = desc?.keywords || normalizeSlug(c.name);

    const socialMeta = buildSocialMeta({
      url: catUrl,
      title: pageTitle,
      description: pageDescription,
      image: `${SITE.baseUrl}${SITE.defaultOgImage}`,
    });

    const listHtml = (c.posts.length ? c.posts : [])
      .map((p) => `<a class="row" href="${p.urlPath}"><span>${htmlEscape(p.title)}</span><span class="muted">${htmlEscape(p.description)}</span></a>`)
      .join("\n");

    const out = renderTemplate(templates.category, {
      SITE_BRAND: htmlEscape(SITE.brandMini),
      SITE_TITLE: htmlEscape(SITE.siteTitle),
      SITE_TAGLINE: htmlEscape(SITE.tagline),
      CATEGORIES_BAR: catBarHtml,

      CATEGORY_NAME: htmlEscape(c.name),
      CATEGORY_DESCRIPTION_VISIBLE: desc?.visible || "",
      CATEGORY_POSTS_COUNT: String(c.posts.length),
      CATEGORY_POSTS_LIST: c.posts.length ? listHtml : `<div class="muted">Todavía no hay publicaciones en esta categoría.</div>`,

      PAGE_TITLE: htmlEscape(pageTitle),
      PAGE_DESCRIPTION: htmlEscape(pageDescription),
      PAGE_KEYWORDS: htmlEscape(pageKeywords),

      SOCIAL_META: socialMeta,
      ADSENSE_HEAD: SITE.adsenseHead || "",
    });

    await writeText(path.join(DIST, "posts", c.slug, "index.html"), out);
  }

  // ===== tags pages =====
  for (const t of tags) {
    const tagUrlPath = `/tags/${t.slug}/`;
    const tagUrl = `${SITE.baseUrl}${tagUrlPath}`;

    const pageTitle = `Etiqueta: ${t.label} — ${SITE.siteTitle}`;
    const pageDescription = `Publicaciones con la etiqueta ${t.label} en ${SITE.siteTitle}.`;
    const pageKeywords = `${t.slug}, etiquetas, ${normalizeSlug(SITE.siteTitle)}`;

    const socialMeta = buildSocialMeta({
      url: tagUrl,
      title: pageTitle,
      description: pageDescription,
      image: `${SITE.baseUrl}${SITE.defaultOgImage}`,
    });

    const listHtml = t.posts
      .slice(0, 80)
      .map((p) => `<a class="row" href="${p.urlPath}"><span>${htmlEscape(p.title)}</span><span class="muted">${htmlEscape(p.categoryName)}</span></a>`)
      .join("\n");

    const out = renderTemplate(templates.tag, {
      SITE_BRAND: htmlEscape(SITE.brandMini),
      SITE_TITLE: htmlEscape(SITE.siteTitle),
      SITE_TAGLINE: htmlEscape(SITE.tagline),
      CATEGORIES_BAR: catBarHtml,

      TAG_NAME: htmlEscape(t.label),
      TAG_POSTS_COUNT: String(t.posts.length),
      TAG_POSTS_LIST: listHtml || `<div class="muted">Todavía no hay publicaciones con esta etiqueta.</div>`,

      PAGE_TITLE: htmlEscape(pageTitle),
      PAGE_DESCRIPTION: htmlEscape(pageDescription),
      PAGE_KEYWORDS: htmlEscape(pageKeywords),

      SOCIAL_META: socialMeta,
      ADSENSE_HEAD: SITE.adsenseHead || "",
    });

    await writeText(path.join(DIST, "tags", t.slug, "index.html"), out);
  }

  // ===== contact page =====
  {
    const urlPath = `/contacto/`;
    const url = `${SITE.baseUrl}${urlPath}`;
    const pageTitle = `Contacto — ${SITE.siteTitle}`;
    const pageDescription = `Contacto y mensajes para ${SITE.siteTitle}.`;
    const socialMeta = buildSocialMeta({
      url,
      title: pageTitle,
      description: pageDescription,
      image: `${SITE.baseUrl}${SITE.defaultOgImage}`,
    });

    const out = renderTemplate(templates.contact, {
      SITE_BRAND: htmlEscape(SITE.brandMini),
      SITE_TITLE: htmlEscape(SITE.siteTitle),
      SITE_TAGLINE: htmlEscape(SITE.tagline),
      CATEGORIES_BAR: catBarHtml,

      PAGE_TITLE: htmlEscape(pageTitle),
      PAGE_DESCRIPTION: htmlEscape(pageDescription),
      PAGE_KEYWORDS: htmlEscape("contacto, mensajes, buenosdia"),

      SOCIAL_META: socialMeta,
      ADSENSE_HEAD: SITE.adsenseHead || "",
    });

    await writeText(path.join(DIST, "contacto", "index.html"), out);
  }

  // ===== robots.txt =====
  await writeText(
    path.join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${SITE.baseUrl}/sitemap.xml\n`
  );

  // ===== sitemap.xml (premium simple) =====
  const urls = [];
  const now = mdDate(new Date());

  // core pages
  urls.push({ loc: `${SITE.baseUrl}/`, lastmod: now });
  urls.push({ loc: `${SITE.baseUrl}/contacto/`, lastmod: now });

  // category + tag
  for (const c of categories) urls.push({ loc: `${SITE.baseUrl}/posts/${c.slug}/`, lastmod: now });
  for (const t of tags) urls.push({ loc: `${SITE.baseUrl}/tags/${t.slug}/`, lastmod: now });

  // posts (solo si existen)
  for (const p of posts) urls.push({ loc: `${SITE.baseUrl}${p.urlPath}`, lastmod: p.dateISO || now });

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${htmlEscape(u.loc)}</loc>\n` +
          `    <lastmod>${htmlEscape(u.lastmod)}</lastmod>\n` +
          `  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  await writeText(path.join(DIST, "sitemap.xml"), sitemap);

  console.log(`OK ✅ dist generado. Posts: ${posts.length} | Categorías: ${categories.length} | Tags: ${tags.length}`);
}

build().catch((err) => {
  console.error("BUILD FAILED ❌");
  console.error(err?.stack || err);
  process.exit(1);
});

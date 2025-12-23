import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const TPL_DIR = path.join(ROOT, "templates");
const DIST_DIR = path.join(ROOT, "dist");

const SITE_URL = "https://buenosdia.com";

// === AdSense ===
const ADSENSE_HEAD = `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7756135514831267"
     crossorigin="anonymous"></script>
`.trim();

// =====================
// Utils
// =====================
async function mkdirp(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeFile(file, content) {
  await mkdirp(path.dirname(file));
  await fs.writeFile(file, content, "utf8");
}

async function readTemplate(name) {
  const p = path.join(TPL_DIR, name);
  return fs.readFile(p, "utf8");
}

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripHtml(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(s = "", n = 160) {
  const t = String(s).replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trim() + "…";
}

function normalizeText(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STOPWORDS = new Set([
  "a","al","algo","algunas","algunos","ante","antes","asi","aun","aunque","bajo","bien","cada","casi","como","con","contra",
  "cual","cuales","cuando","da","de","del","desde","donde","dos","el","ella","ellas","ellos","en","entre","era","eres","es",
  "esa","esas","ese","eso","esos","esta","estaba","estaban","estas","este","esto","estos","estoy","fin","fue","fueron","fui",
  "ha","han","hasta","hay","la","las","le","les","lo","los","mas","me","mi","mis","muy","no","nos","o","otra","otro","para",
  "pero","poco","por","porque","que","quien","quienes","se","ser","si","sin","sobre","su","sus","tambien","tan","te","tenes",
  "tengo","ti","tu","tus","un","una","unas","unos","vos","ya","y","yo"
]);

function tokensFromText(s = "") {
  const n = normalizeText(s);
  const raw = n.split(/[^a-z0-9]+/g).filter(Boolean);
  const out = [];
  for (const w of raw) {
    if (w.length < 4) continue;
    if (STOPWORDS.has(w)) continue;
    out.push(w);
  }
  return out;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function slugifyTag(s = "") {
  return normalizeText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function slugifyCategory(s = "") {
  return normalizeText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function injectBefore(html, needleLower, injection) {
  const idx = html.toLowerCase().indexOf(needleLower);
  if (idx === -1) return html + "\n" + injection;
  return html.slice(0, idx) + injection + "\n" + html.slice(idx);
}

function injectBeforeBodyClose(html, injection) {
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx === -1) return html + "\n" + injection;
  return html.slice(0, idx) + "\n" + injection + "\n" + html.slice(idx);
}

function injectAfterBodyOpen(html, injection) {
  const m = html.match(/<body[^>]*>/i);
  if (!m) return injection + "\n" + html;
  const pos = m.index + m[0].length;
  return html.slice(0, pos) + "\n" + injection + "\n" + html.slice(pos);
}

function injectAdSense(html) {
  if (html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")) return html;
  if (html.includes("{{ADSENSE_HEAD}}")) return html.replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD);
  return injectBefore(html, "</head>", ADSENSE_HEAD + "\n");
}

// Reemplaza SOLO texto (no toca tags)
function boldKeywordsInHtml(html, keywords) {
  if (!keywords || keywords.length === 0) return html;

  const parts = html.split(/(<[^>]+>)/g);
  const used = new Set();

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("<")) continue;
    let segment = parts[i];

    for (const kw of keywords) {
      if (used.has(kw)) continue;
      const re = new RegExp(`\\b(${kw})\\b`, "i");
      if (re.test(segment)) {
        segment = segment.replace(re, "<b>$1</b>");
        used.add(kw);
      }
      if (used.size >= keywords.length) break;
    }
    parts[i] = segment;
  }
  return parts.join("");
}

// Hash determinístico (para variar textos sin cambiar en cada build)
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// =====================
// Descubrir estructura
// =====================
async function getCategories() {
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => slugifyCategory(e.name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function parseMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']\\s*\\/?>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function parseTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return "";
  return m[1].replace(/\s+/g, " ").trim();
}

function parseH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return "";
  return stripHtml(m[1]);
}

function parseOgImage(html) {
  const m = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/i);
  return m ? m[1].trim() : "";
}

async function collectPosts(categories) {
  const posts = [];

  for (const cat of categories) {
    const catDir = path.join(POSTS_DIR, cat);
    let items = [];
    try {
      items = await fs.readdir(catDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const it of items) {
      if (!it.isFile()) continue;
      if (!it.name.toLowerCase().endsWith(".html")) continue;

      const file = it.name;
      if (file.toLowerCase() === "index.html") continue;

      const abs = path.join(catDir, file);
      const raw = await fs.readFile(abs, "utf8");

      const title = parseTitle(raw) || parseH1(raw) || file.replace(/\.html$/i, "");
      const description = parseMeta(raw, "description") || excerpt(stripHtml(raw), 170);
      const date = parseMeta(raw, "date") || "";
      const kw = parseMeta(raw, "keywords");
      const tags = kw ? kw.split(",").map(s => s.trim()).filter(Boolean) : [];
      const ogImage = parseOgImage(raw) || "";

      const url = `/posts/${cat}/${file}`;
      posts.push({
        cat, file, abs, url,
        title,
        description,
        excerpt: excerpt(description),
        date,
        tags,
        ogImage,
        _text: stripHtml(raw),
        _titleText: title,
      });
    }
  }

  posts.sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
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
  return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
}

// =====================
// Relacionados / Retención
// =====================
function buildVectors(posts) {
  const vectors = new Map();
  for (const p of posts) {
    const body = new Set(tokensFromText(p._text));
    const title = new Set(tokensFromText(p._titleText));
    const tags = new Set(tokensFromText((p.tags || []).join(" ")));
    vectors.set(p.url, { body, title, tags });
  }
  return vectors;
}

function scoreRelated(vA, vB) {
  let s = 0;
  let cBody = 0;
  for (const w of vA.body) if (vB.body.has(w)) cBody++;
  let cTitle = 0;
  for (const w of vA.title) if (vB.title.has(w)) cTitle++;
  let cTags = 0;
  for (const w of vA.tags) if (vB.tags.has(w)) cTags++;

  s += cBody * 1;
  s += cTitle * 3;
  s += cTags * 2;
  return s;
}

function pickRelated(posts, vectors, current, n = 6) {
  const vA = vectors.get(current.url);
  if (!vA) return [];

  const scored = [];
  for (const p of posts) {
    if (p.url === current.url) continue;
    const vB = vectors.get(p.url);
    if (!vB) continue;

    let s = scoreRelated(vA, vB);
    if (p.cat === current.cat) s += 6; // fuerte sesgo a misma categoría
    scored.push({ p, s });
  }

  scored.sort((a, b) => b.s - a.s);
  const picked = scored.filter(x => x.s > 0).slice(0, n).map(x => x.p);

  if (picked.length >= n) return picked;

  const fallback = posts.filter(p => p.url !== current.url && !picked.some(k => k.url === p.url));
  return picked.concat(fallback.slice(0, n - picked.length));
}

// =====================
// Inline links automáticos (SIN marcador)
// =====================
function buildInlineLinkPara(p, variant = 0) {
  const templates = [
    `Si esto te está pegando, capaz te sirve leer esto también: <a href="${esc(p.url)}">${esc(p.title)}</a>.`,
    `Te dejo una puerta interna, por si querés seguir sin salir de acá: <a href="${esc(p.url)}">${esc(p.title)}</a>.`,
    `Si hoy venís con la cabeza pesada, este otro post te puede ordenar un poco: <a href="${esc(p.url)}">${esc(p.title)}</a>.`,
    `No es para “hacerte bien”. Es para acompañarte un poquito más: <a href="${esc(p.url)}">${esc(p.title)}</a>.`,
    `Si te quedaste pensando en esto, seguí por acá: <a href="${esc(p.url)}">${esc(p.title)}</a>.`,
  ];
  const t = templates[Math.max(0, Math.min(templates.length - 1, variant))];
  return `<p class="inlink" style="margin:0 0 14px;color:#334155;"><b>Mirá:</b> ${t}</p>`;
}

function insertInlineLinksAuto(html, picks, seedStr) {
  if (!picks || picks.length === 0) return html;

  const seed = hash32(seedStr || "");
  const v0 = seed % 5;
  const v1 = (seed >>> 3) % 5;

  const p1 = picks[0] ? buildInlineLinkPara(picks[0], v0) : "";
  const p2 = picks[1] ? buildInlineLinkPara(picks[1], v1) : "";

  // Insert 1 after 2nd </p>, 2nd after 6th </p> (si existe). Si no hay tantos, queda 1 solo.
  let count = 0;
  let inserted1 = false;
  let inserted2 = false;

  return html.replace(/<\/p>/gi, (m) => {
    count += 1;
    let add = "";

    if (!inserted1 && count === 2 && p1) {
      add = "\n" + p1 + "\n";
      inserted1 = true;
    } else if (!inserted2 && count === 6 && p2) {
      add = "\n" + p2 + "\n";
      inserted2 = true;
    }
    return m + add;
  });
}

// =====================
// Bloques (mid + end)
// =====================
function buildAlsoHtml(post) {
  return `
<div class="also">
  <div class="also-k">Mirá también</div>
  <a class="also-link" href="${esc(post.url)}">${esc(post.title)}</a>
  <div class="also-desc">${esc(post.excerpt || post.description || "")}</div>
</div>`.trim();
}

function buildRelatedGridHtml(posts6) {
  const cards = posts6.map(p => `
<a class="r" href="${esc(p.url)}">
  <div class="k">${esc(p.cat.toUpperCase().replaceAll("-", " "))}</div>
  <div class="t">${esc(p.title)}</div>
  <div class="d">${esc(p.excerpt || p.description || "")}</div>
</a>`.trim()).join("\n");

  return `
<section class="related">
  <div class="related-h">Te puede interesar</div>
  <div class="related-grid">
${cards}
  </div>
</section>`.trim();
}

function buildReadTopAndMicroScript() {
  return `
<style>
  .readtop{position:sticky;top:0;z-index:60;background:#fff;border-bottom:1px solid #e5e7eb}
  .readtop-inner{max-width:900px;margin:0 auto;padding:8px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px}
  .rt-left{display:flex;align-items:center;gap:10px}
  .rt-pill{font-size:12px;border:1px solid #e5e7eb;padding:4px 10px;border-radius:999px;color:#334155;background:#fff}
  .rt-time{font-size:12px;color:#64748b}
  .progress{height:3px;background:#f1f5f9}
  .progress>div{height:3px;width:0%;background:#0b1220}
  .also{border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin:18px 0;background:#fff}
  .also-k{font-size:12px;letter-spacing:.12em;color:#64748b;margin-bottom:6px}
  .also-link{display:block;font-weight:950;font-size:16px;line-height:1.15}
  .also-desc{margin-top:6px;color:#334155;font-size:13px}
  .micro{border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin:18px 0;background:#fff}
  .micro-h{font-weight:950;margin-bottom:8px}
  .micro p{margin:0 0 10px;color:#334155}
  .micro-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .micro-out{margin-top:10px;border:1px dashed #cbd5e1;border-radius:12px;padding:10px;color:#0b1220;background:#f8fafc;display:none}
  .micro-out b{font-weight:950}
  .micro-small{font-size:12px;color:#64748b;margin-top:8px}
  .related{border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin:18px 0;background:#fff}
  .related-h{font-weight:950;margin-bottom:10px}
  .related-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .r{border:1px solid #e5e7eb;border-radius:14px;padding:10px;background:#fff}
  .r:hover{background:#f8fafc}
  .r .k{font-size:12px;color:#64748b;letter-spacing:.08em;margin-bottom:4px}
  .r .t{font-weight:950;line-height:1.15}
  .r .d{margin-top:6px;color:#334155;font-size:13px}
  @media (max-width:720px){.related-grid{grid-template-columns:1fr}}
</style>
<script>
(function(){
  const article = document.getElementById("article") || document.querySelector("article") || document.body;
  const readTimeEl = document.getElementById("readTime");
  const pbar = document.getElementById("pbar");

  if (article && readTimeEl) {
    const text = article.innerText || "";
    const words = text.trim().split(/\\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / 180));
    readTimeEl.textContent = mins + " min de lectura";
  }

  function onScroll(){
    const doc = document.documentElement;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const pct = Math.min(100, Math.max(0, (doc.scrollTop / max) * 100));
    if (pbar) pbar.style.width = pct.toFixed(2) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  const btn = document.getElementById("btnMicro");
  const out = document.getElementById("microOut");
  const copyMini = document.getElementById("btnCopyMini");
  const lines = [
    "Hoy me siento <b>pesado</b>, y aun así elijo <b>no pegarme más</b>.",
    "Hoy no estoy bien. Pero estoy <b>acá</b>. Y eso vale.",
    "Hoy no gano el mundo. Hoy me <b>reordeno</b> y sigo.",
    "Hoy me duele, pero no me abandono. <b>Respiro</b>. Camino. Y ya.",
    "Hoy el plan es simple: <b>una cosa</b> bien. Nada más."
  ];
  let lastPlain = "";
  if (btn && out && copyMini) {
    btn.addEventListener("click", function(){
      const pick = lines[Math.floor(Math.random() * lines.length)];
      out.style.display = "block";
      out.innerHTML = "✔ " + pick;
      lastPlain = out.innerText.replace(/^✔\\s*/, "");
      copyMini.disabled = false;
      copyMini.textContent = "Copiar esto";
    });
    copyMini.addEventListener("click", async function(){
      try{
        await navigator.clipboard.writeText(lastPlain || "");
        copyMini.textContent = "Copiado ✅";
        setTimeout(()=> copyMini.textContent="Copiar esto", 1100);
      }catch(e){
        alert("No pude copiar. Copialo manualmente.");
      }
    });
  }
})();
</script>`.trim();
}

function buildReadTopHtml(categoryLabel) {
  return `
<div class="readtop" aria-hidden="true">
  <div class="readtop-inner">
    <div class="rt-left">
      <span class="rt-pill">${esc(categoryLabel)}</span>
      <span class="rt-time" id="readTime">—</span>
    </div>
    <span class="rt-time">Deslizá tranqui</span>
  </div>
  <div class="progress"><div id="pbar"></div></div>
</div>`.trim();
}

function buildMicroHtml() {
  return `
<section class="micro" id="micro">
  <div class="micro-h">Micro-acción de 20 segundos</div>
  <p>Sin drama. Sin “cambio de vida”. Solo un paso chiquito para hoy.</p>
  <div class="micro-row">
    <button class="sbtn" type="button" id="btnMicro">Hoy: respiro y sigo</button>
    <button class="sbtn" type="button" id="btnCopyMini" disabled>Copiar esto</button>
  </div>
  <div class="micro-out" id="microOut"></div>
  <div class="micro-small">Tip: si no estás para hablar con nadie hoy, copiá esto y mandátelo a vos mismo.</div>
</section>`.trim();
}

function insertMidBlocks(html, alsoHtml, microHtml) {
  // SIN marcadores: lo mete después del 3er párrafo
  let count = 0;
  return html.replace(/<\/p>/i, (m) => {
    count += 1;
    if (count === 3) return m + "\n" + (alsoHtml ? alsoHtml + "\n" : "") + microHtml + "\n";
    return m;
  });
}

function insertEndBlocks(html, relatedHtml) {
  const shareIdx = html.indexOf('data-share');
  if (shareIdx !== -1) {
    const before = html.slice(0, shareIdx);
    const after = html.slice(shareIdx);
    return before + "\n" + relatedHtml + "\n" + after;
  }
  return injectBeforeBodyClose(html, relatedHtml);
}

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
  <div class="muted tiny">Instagram/TikTok: copiá el link y pegalo en la app.</div>
</section>`.trim();
}

function ensureShare(html) {
  if (html.includes('data-share')) return html;
  return injectBeforeBodyClose(html, buildShareHtml());
}

// =====================
// Index/Cats/Tags
// =====================
function renderSimpleLinks(list) {
  if (!list || list.length === 0) return `<div class="muted">Todavía no hay publicaciones.</div>`;
  return list.map(p => `<a class="post-link" href="${esc(p.url)}">${esc(p.title)}</a>`).join("\n");
}

function renderIndexPosts(posts, limit = 30) {
  const top = posts.slice(0, limit);
  if (top.length === 0) return `<div class="muted">Todavía no hay publicaciones.</div>`;
  return top.map(p => {
    const img = p.ogImage ? `<img class="thumb" src="${esc(p.ogImage)}" alt="" loading="lazy" decoding="async">` : "";
    return `
<article class="post-card">
  <a class="post-card-link" href="${esc(p.url)}">
    ${img}
    <div class="post-card-body">
      <div class="muted tiny">${esc(p.cat.replaceAll("-", " "))}${p.date ? " · " + esc(p.date) : ""}</div>
      <div class="post-card-title">${esc(p.title)}</div>
      <div class="post-card-excerpt">${esc(p.excerpt)}</div>
    </div>
  </a>
</article>`.trim();
  }).join("\n");
}

function renderCategoriesList(categories) {
  if (!categories || categories.length === 0) return "";
  return categories.map(c => `<a class="cat" href="/categorias/${esc(c)}/">${esc(c.replaceAll("-", " "))}</a>`).join("\n");
}

// =====================
// Copia + inyección posts
// =====================
async function buildPostsToDist(categories, posts) {
  const byUrl = new Map(posts.map(p => [p.url, p]));
  const vectors = buildVectors(posts);

  for (const cat of categories) {
    const srcCat = path.join(POSTS_DIR, cat);
    const dstCat = path.join(DIST_DIR, "posts", cat);
    await mkdirp(dstCat);

    let items = [];
    try {
      items = await fs.readdir(srcCat, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const it of items) {
      if (!it.isFile()) continue;
      if (!it.name.toLowerCase().endsWith(".html")) continue;

      const src = path.join(srcCat, it.name);
      const dst = path.join(dstCat, it.name);

      if (it.name.toLowerCase() === "index.html") {
        const ph = await fs.readFile(src, "utf8");
        await writeFile(dst, ph);
        continue;
      }

      const url = `/posts/${cat}/${it.name}`;
      const info = byUrl.get(url);

      let html = await fs.readFile(src, "utf8");

      // AdSense
      html = injectAdSense(html);

      // Readtop
      if (!html.includes('class="readtop"')) {
        html = injectAfterBodyOpen(html, buildReadTopHtml(cat.replaceAll("-", " ")));
      }

      if (info) {
        const rel6 = pickRelated(posts, vectors, info, 6);

        // Elegimos “Mirá también” como el mejor (0)
        const mid1 = rel6[0] || null;

        // Inline links: usamos 1 y 2 (si existen) y evitamos repetir mid
        const inline = [];
        if (rel6[1]) inline.push(rel6[1]);
        if (rel6[2]) inline.push(rel6[2]);

        // (1) Interlinks dentro del texto - automático
        html = insertInlineLinksAuto(html, inline, info.url);

        // (2) Mid box + micro
        html = insertMidBlocks(html, mid1 ? buildAlsoHtml(mid1) : "", buildMicroHtml());

        // (3) End related grid (6)
        html = insertEndBlocks(html, buildRelatedGridHtml(rel6));

        // Negritas suaves
        const metaKw = parseMeta(html, "keywords");
        const kws = uniq(tokensFromText((metaKw || "") + " " + (info.title || ""))).slice(0, 4);
        html = boldKeywordsInHtml(html, kws);
      } else {
        html = insertMidBlocks(html, "", buildMicroHtml());
      }

      // Share
      html = ensureShare(html);

      // Script (si el post no trae)
      if (!html.includes("readTimeEl.textContent")) {
        html = injectBeforeBodyClose(html, buildReadTopAndMicroScript());
      }

      await writeFile(dst, html);
    }
  }
}

// =====================
// Main
// =====================
async function main() {
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await mkdirp(DIST_DIR);

  for (const dir of ["css", "js", "img"]) {
    const src = path.join(ROOT, dir);
    const dst = path.join(DIST_DIR, dir);
    try { await fs.access(src); await copyDir(src, dst); } catch {}
  }

  const [tplIndex, tplCat, tplTag] = await Promise.all([
    readTemplate("index.template.html"),
    readTemplate("category.template.html"),
    readTemplate("tag.template.html"),
  ]);

  const categories = await getCategories();
  const posts = await collectPosts(categories);
  const tagsIndex = buildTagIndex(posts);

  await buildPostsToDist(categories, posts);

  const indexHtml = tplIndex
    .replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD)
    .replaceAll("{{CATEGORIES}}", renderCategoriesList(categories))
    .replaceAll("{{POSTS}}", renderIndexPosts(posts, 40))
    .replaceAll("{{YEAR}}", String(new Date().getFullYear()));
  await writeFile(path.join(DIST_DIR, "index.html"), indexHtml);

  for (const cat of categories) {
    const inCat = posts.filter(p => p.cat === cat);
    const catHtml = tplCat
      .replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD)
      .replaceAll("{{CATEGORY_NAME}}", esc(cat.replaceAll("-", " ")))
      .replaceAll("{{CATEGORY_SLUG}}", esc(cat))
      .replaceAll("{{POSTS_LIST}}", renderSimpleLinks(inCat))
      .replaceAll("{{YEAR}}", String(new Date().getFullYear()));
    await writeFile(path.join(DIST_DIR, "categorias", cat, "index.html"), catHtml);

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

  for (const [slug, info] of tagsIndex) {
    const tagHtml = tplTag
      .replaceAll("{{ADSENSE_HEAD}}", ADSENSE_HEAD)
      .replaceAll("{{TAG_NAME}}", esc(info.name))
      .replaceAll("{{TAG_SLUG}}", esc(slug))
      .replaceAll("{{POSTS_LIST}}", renderSimpleLinks(info.posts))
      .replaceAll("{{YEAR}}", String(new Date().getFullYear()));
    await writeFile(path.join(DIST_DIR, "tags", slug, "index.html"), tagHtml);
  }

  const urls = new Set();
  urls.add(SITE_URL + "/");
  for (const cat of categories) urls.add(SITE_URL + `/categorias/${cat}/`);
  for (const [slug] of tagsIndex) urls.add(SITE_URL + `/tags/${slug}/`);
  for (const p of posts) urls.add(SITE_URL + p.url);

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...urls].sort().map(u => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`;

  await writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap);
  await writeFile(path.join(DIST_DIR, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log(`OK: Posts=${posts.length} Cats=${categories.length} Tags=${tagsIndex.length}`);
}

async function copyDir(src, dst) {
  await mkdirp(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else if (e.isFile()) await fs.copyFile(s, d);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

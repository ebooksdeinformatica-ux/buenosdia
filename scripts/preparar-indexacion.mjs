import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.buenosdia.com';
const LASTMOD = '2026-06-10';
const posts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('data/categories.json', 'utf8'));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function postCard(post) {
  return `<a class="post-card" href="${esc(post.url)}"><div class="post-card-media"><img src="${esc(post.image)}" alt="${esc(post.title)}" loading="lazy" decoding="async"></div><div class="post-card-body"><span class="badge">${esc(post.category)}</span><h3>${esc(post.title)}</h3><p>${esc(post.description)}</p><div class="post-meta"><span>${esc(post.date)}</span><span>·</span><span>${esc(post.readingTime)}</span></div></div></a>`;
}

function categoryCard(category) {
  const icon = String(category.icon || '').includes('/')
    ? `<img src="${esc(category.icon)}" alt="" loading="lazy" decoding="async">`
    : esc(category.icon || category.name.slice(0,2));
  return `<a class="category-card" href="/${esc(category.slug)}/"><span>${icon}</span><strong>${esc(category.name)}</strong><p>${esc(category.description)}</p></a>`;
}

function renderStaticHome() {
  let html = fs.readFileSync('index.html', 'utf8');
  const cards = posts.slice(0, 24).map(postCard).join('');
  const categoryCards = categories.map(categoryCard).join('');

  html = html.replace(
    /<div class="category-grid" id="categoryGrid">[\s\S]*?<\/div><\/section>/,
    `<div class="category-grid" id="categoryGrid">${categoryCards}</div></section>`
  );

  html = html.replace(
    /<div class="posts-grid" id="postsList">[\s\S]*?<\/div><div class="load-more-wrap">/,
    `<div class="posts-grid" id="postsList">${cards}</div><div class="load-more-wrap">`
  );

  fs.writeFileSync('index.html', html);
}

function noindexThinTags() {
  const dir = 'tags';
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.html')) continue;
    const full = path.join(dir, file);
    let html = fs.readFileSync(full, 'utf8');
    if (/<meta name="robots"/i.test(html)) {
      html = html.replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="noindex,follow">');
    } else {
      html = html.replace('</title>', '</title><meta name="robots" content="noindex,follow">');
    }
    fs.writeFileSync(full, html);
  }
}

function generateSitemap() {
  const fixed = [
    '/', '/tecnologia/', '/pan-y-circo/', '/alimentacion/', '/deportes/', '/matrix/', '/saliendo-de-la-matrix/',
    '/youtube/', '/autor/aspf.html', '/contacto/', '/privacidad/', '/cookies/', '/terminos/', '/aviso-legal/'
  ];
  const postUrls = posts.map(post => post.url).filter(url => /^\/posts\/.+\.html$/.test(url));
  if (postUrls.length !== posts.length) throw new Error('Hay publicaciones con URL inválida.');
  const urls = [...new Set([...fixed, ...postUrls])];
  if (urls.length < 300) throw new Error(`Sitemap incompleto: ${urls.length} URLs.`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${SITE}${url}</loc><lastmod>${LASTMOD}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync('sitemap.xml', xml);
}

function generate404() {
  const html = `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página no encontrada | buenosdia.com</title><meta name="robots" content="noindex,follow"><link rel="stylesheet" href="/assets/css/main.css"></head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><img src="/assets/img/logo-buenosdia-icon-192.webp" width="56" height="56" alt="Logo de buenosdia.com"><span><strong>buenosdia.com</strong><small>Tecnología, Matrix y vida real</small></span></a></div></header><main><section class="hero-section"><div class="container hero-copy"><p class="eyebrow">Error 404</p><h1>Esta página no existe</h1><p class="hero-text">La dirección pudo cambiar o estar incompleta. Volvé al inicio para encontrar las últimas publicaciones y categorías.</p><a class="btn btn-primary" href="/">Volver al inicio</a></div></section></main></body></html>`;
  fs.writeFileSync('404.html', html);
}

renderStaticHome();
noindexThinTags();
generateSitemap();
generate404();

console.log(`Indexación preparada: ${posts.length} posts, portada estática, tags noindex y sitemap válido.`);

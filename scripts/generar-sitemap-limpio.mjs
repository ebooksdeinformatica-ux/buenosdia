import fs from 'node:fs';

const SITE = 'https://www.buenosdia.com';
const LASTMOD = '2026-06-10';
const posts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));

const fixed = [
  '/',
  '/tecnologia/',
  '/pan-y-circo/',
  '/alimentacion/',
  '/deportes/',
  '/matrix/',
  '/saliendo-de-la-matrix/',
  '/youtube/',
  '/autor/aspf.html',
  '/contacto/',
  '/privacidad/',
  '/cookies/',
  '/terminos/',
  '/aviso-legal/'
];

const postUrls = posts
  .map(post => post.url)
  .filter(url => typeof url === 'string' && url.startsWith('/posts/') && url.endsWith('.html'));

const paths = [...new Set([...fixed, ...postUrls])];

if (postUrls.length !== posts.length) {
  throw new Error(`Hay publicaciones con URL inválida: ${posts.length - postUrls.length}`);
}

if (paths.length < 300) {
  throw new Error(`El sitemap tendría solo ${paths.length} URLs; se esperaba más de 300.`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(path => `  <url><loc>${SITE}${path}</loc><lastmod>${LASTMOD}</lastmod></url>`).join('\n')}
</urlset>
`;

fs.writeFileSync('sitemap.xml', xml);
console.log(`Sitemap válido generado con ${paths.length} URLs. Las páginas de tags delgadas quedan excluidas.`);

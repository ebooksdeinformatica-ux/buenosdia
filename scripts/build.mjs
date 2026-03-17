import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.buenosdia.com';
const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DATA_DIR = path.join(ROOT, 'data');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const POSTS_JSON = path.join(DATA_DIR, 'posts.json');

if (!fs.existsSync(POSTS_DIR)) {
  console.error('No existe la carpeta /posts');
  process.exit(1);
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html'));

const posts = files.map(file => {
  const fullPath = path.join(POSTS_DIR, file);
  const html = fs.readFileSync(fullPath, 'utf8');

  const title =
    matchMeta(html, /<title>(.*?)<\/title>/is) ||
    matchMeta(html, /<h1[^>]*>(.*?)<\/h1>/is) ||
    cleanSlug(file.replace('.html', ''));

  const description =
    matchMeta(html, /<meta\s+name="description"\s+content="(.*?)"\s*\/?>/is) ||
    matchMeta(html, /<p[^>]*class="lead"[^>]*>(.*?)<\/p>/is) ||
    'Reflexión en buenosdia.com';

  const keywords =
    matchMeta(html, /<meta\s+name="keywords"\s+content="(.*?)"\s*\/?>/is) || '';

  const articleDate =
    matchMeta(html, /"datePublished"\s*:\s*"(.*?)"/is) ||
    today();

  const tags = keywords
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  return {
    title: strip(title.replace(/\|\s*buenosdia\.com/i, '').trim()),
    description: strip(description),
    tags,
    date: articleDate.slice(0, 10),
    slug: file.replace('.html', ''),
    url: `/posts/${file}`
  };
}).sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2), 'utf8');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today()}</lastmod>
  </url>
${posts.map(post => `  <url>
    <loc>${SITE_URL}${post.url}</loc>
    <lastmod>${post.date}</lastmod>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');

console.log(`Generados ${posts.length} posts en data/posts.json y sitemap.xml`);

function matchMeta(str, regex) {
  const m = str.match(regex);
  return m?.[1]?.trim() || '';
}

function strip(str) {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSlug(str) {
  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

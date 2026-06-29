import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const POSTS_DIRS = ['posts', 'en/posts', 'fr/posts'];
const hrefRegex = /href=["']([^"']+)["']/g;
const failures = [];

function exists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath.replace(/^\//, '')));
}

function read(filePath) {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
}

function isNoindexRedirect(html) {
  const lower = html.toLowerCase();
  return lower.includes('noindex') && lower.includes('http-equiv="refresh"');
}

function htmlFiles(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter(name => name.endsWith('.html'))
    .map(name => path.join(dir, name));
}

const files = POSTS_DIRS.flatMap(htmlFiles);

for (const file of files) {
  const html = read(file);
  const matches = [...html.matchAll(hrefRegex)];

  for (const match of matches) {
    const href = match[1];
    if (!href.startsWith('/posts/') && !href.startsWith('/en/posts/') && !href.startsWith('/fr/posts/')) continue;

    const clean = href.split('#')[0].split('?')[0];
    const localPath = clean.replace(/^\//, '');

    if (!exists(clean)) {
      failures.push(`${file} enlaza a recurso inexistente: ${href}`);
      continue;
    }

    const target = read(localPath);
    if (isNoindexRedirect(target)) {
      failures.push(`${file} enlaza a redirect noindex: ${href}`);
    }
  }
}

if (failures.length) {
  console.error('Auditoria de enlaces internos fallo:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Auditoria de enlaces internos OK.');

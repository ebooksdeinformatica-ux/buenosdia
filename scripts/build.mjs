import fs from 'node:fs';
const SITE='https://www.buenosdia.com';
const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const today=new Date().toISOString().slice(0,10);
const urls=['/',...posts.map(p=>p.url),'/categorias/saliendo-de-la-matrix/','/autor/aspf.html','/contacto/','/privacidad/','/cookies/','/terminos/','/aviso-legal/'];
fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>'  <url><loc>'+SITE+u+'</loc><lastmod>'+today+'</lastmod></url>').join('\n')+'\n</urlset>\n');
console.log('Build OK: '+posts.length+' publicación(es).');

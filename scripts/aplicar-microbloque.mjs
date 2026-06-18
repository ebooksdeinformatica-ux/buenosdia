import fs from 'node:fs';

const manifestPath=process.argv[2];
if(!manifestPath)throw new Error('Uso: node scripts/aplicar-microbloque.mjs <manifest.json>');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const file='data/posts.json';
const posts=JSON.parse(fs.readFileSync(file,'utf8'));
const changes=new Map(manifest.posts.map(post=>[post.url,post]));
let updated=0;
for(const post of posts){
  const next=changes.get(post.url);
  if(!next)continue;
  Object.assign(post,next);
  updated++;
}
if(updated!==manifest.posts.length)throw new Error(`Se actualizaron ${updated} de ${manifest.posts.length} publicaciones.`);
fs.writeFileSync(file,JSON.stringify(posts,null,2)+'\n');
console.log(`${manifest.name}: ${updated} metadatos actualizados.`);

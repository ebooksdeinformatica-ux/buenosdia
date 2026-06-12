import fs from 'node:fs';

const errors=[];
const patterns=[
  /topic\s*=>/i,
  /\$\{topic\}/,
  /\$\{post\./,
  /DIRECT_OPENINGS\[/,
  /function\s*\(/,
  /const\s+[A-Za-z_$][\w$]*\s*=/,
  /undefined/,
  /\[object Object\]/
];

for(const file of fs.readdirSync('posts').filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(`posts/${file}`,'utf8');
  const article=html.match(/<article[\s\S]*?<\/article>/i)?.[0]||'';
  const visible=article.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/\s+/g,' ');
  for(const pattern of patterns) if(pattern.test(visible)) errors.push(`${file}: fragmento técnico detectado (${pattern}).`);
}

console.log(`Auditoría de fragmentos: ${errors.length} errores.`);
for(const error of errors.slice(0,100)) console.error(`ERROR: ${error}`);
if(errors.length) process.exit(1);

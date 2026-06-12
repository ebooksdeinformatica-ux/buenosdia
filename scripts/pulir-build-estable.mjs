import fs from 'node:fs';
import { tecnologia } from './contenido-real/tecnologia.mjs';
import { panYCirco } from './contenido-real/pan-y-circo.mjs';
import { alimentacion } from './contenido-real/alimentacion.mjs';
import { deportes } from './contenido-real/deportes.mjs';
import { matrix } from './contenido-real/matrix.mjs';
import { saliendoDeLaMatrix } from './contenido-real/saliendo-de-la-matrix.mjs';
import { UPDATED, description, fmt, render, strip, writeAudit } from './contenido-real/motor.mjs';

const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const rules={'Tecnología':tecnologia,'Pan y Circo':panYCirco,'Alimentación':alimentacion,'Deportes':deportes,'Matrix':matrix,'Saliendo de la Matrix':saliendoDeLaMatrix};
const families=new Map();
for(const post of posts){
 const profile=rules[post.category].find(item=>item.match.test(strip(post.title)));
 post.description=description(fmt(profile.summary,post)); post.date=UPDATED; post.readingTime='8–12 min';
 fs.writeFileSync(post.url.replace(/^\//,''),render(post,profile,posts));
 families.set(profile.key,(families.get(profile.key)||0)+1);
}
fs.writeFileSync('data/posts.json',JSON.stringify(posts,null,2)+'\n');
writeAudit(families);
console.log(`Reconstruidas ${posts.length} publicaciones con ${families.size} familias temáticas reales.`);

import fs from 'node:fs';

const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
const terms=['ruido','pantalla','presencia','automático','automatico','claridad','cabeza','mando','volver a vos','puerta','paso mínimo','paso minimo','día perdido','dia perdido'];
const patterns=[
  {name:'diagnostico-no-es',re:/no (es|est[aá]s|falta)[^.!?]{0,80}(es|est[aá]s|falta)/gi},
  {name:'accion-minima',re:/acci[oó]n (m[ií]nima|pequeña|concreta)|paso (real|posible|pequeño|m[ií]nimo)/gi},
  {name:'recuperar',re:/recuper(ar|[aá]s|[aá]) (la mirada|presencia|mando|claridad|direcci[oó]n)/gi},
  {name:'ruido-digital',re:/ruido|pantalla|notificaciones|redes|scroll/gi}
];
const visibleText=h=>h.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ');
const clean=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const read=p=>fs.existsSync(p.url.replace(/^\//,''))?fs.readFileSync(p.url.replace(/^\//,''),'utf8'):'';
const recent=posts.slice(0,5).map(p=>({title:p.title,file:p.url.replace(/^\//,''),text:clean(visibleText(read(p)))}));
let warnings=0;
function warn(msg){warnings++;console.warn('⚠ '+msg)}

for(const term of terms){
  const normalized=clean(term);
  const hits=recent.filter(p=>p.text.includes(normalized)).length;
  if(recent.length>=3&&hits>=Math.ceil(recent.length*.75))warn('Término/motivo repetido en '+hits+'/'+recent.length+' posts recientes: "'+term+'"');
}

for(const pat of patterns){
  const hits=recent.filter(p=>(p.text.match(pat.re)||[]).length>0).length;
  if(recent.length>=3&&hits>=Math.ceil(recent.length*.75))warn('Patrón narrativo repetido en '+hits+'/'+recent.length+' posts recientes: '+pat.name);
}

if(warnings){
  console.warn('Auditor de voz: revisar variedad de mirada, motor narrativo, vocabulario y cierre.');
}else{
  console.log('✓ Auditor de voz OK: sin patrones dominantes fuertes en posts recientes.');
}

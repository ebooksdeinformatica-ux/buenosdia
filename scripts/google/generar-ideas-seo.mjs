import fs from 'node:fs';

const OUT='data/google/content-ideas.json';
function readJson(path,fallback){try{return JSON.parse(fs.readFileSync(path,'utf8'))}catch{return fallback}}
function ensureDir(){fs.mkdirSync('data/google',{recursive:true})}
function uniqueBy(arr,key){const seen=new Set();return arr.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true})}

const posts=readJson('data/posts.json',[]);
const sc=readJson('data/google/search-console-opportunities.json',null);
const ps=readJson('data/google/pagespeed-report.json',null);

const ideas=[];
const improvements=[];

if(sc?.opportunities){
  for(const r of sc.opportunities.improveCtr||[]){
    ideas.push({type:'mejorar-ctr',priority:'alta',query:r.query,page:r.page,reason:`Muchas impresiones (${r.impressions}) con CTR bajo (${Math.round(r.ctr*10000)/100}%).`,action:'Revisar título SEO, meta description, primer párrafo y enlace interno hacia esta página.'});
  }
  for(const r of sc.opportunities.quickWins||[]){
    ideas.push({type:'quick-win',priority:'alta',query:r.query,page:r.page,reason:`Posición media ${r.position}; puede subir con actualización e interlinks.`,action:'Ampliar una sección útil y sumar enlaces internos desde posts relacionados.'});
  }
  for(const r of sc.opportunities.contentIdeas||[]){
    ideas.push({type:'nuevo-post',priority:'media',query:r.query,page:r.page,reason:`Google ya muestra el sitio por esta búsqueda, pero todavía lejos: posición ${r.position}.`,action:'Crear una publicación nueva si la intención no está cubierta o sumar un bloque específico si ya existe una página adecuada.'});
  }
}

if(ps?.weak?.length){
  for(const r of ps.weak){
    improvements.push({type:'tecnico-pagespeed',priority:'alta',url:r.url,reason:r.ok?'Alguna puntuación está por debajo de 85.':'La URL no pudo revisarse correctamente.',scores:r.scores||null,action:'Revisar peso de recursos, accesibilidad, SEO técnico y errores Lighthouse.'});
  }
}

if(!ideas.length){
  ideas.push({type:'semilla-editorial',priority:'media',query:null,page:null,reason:'Todavía no hay suficientes datos útiles de Search Console o el sitio es muy nuevo.',action:'Seguir publicando contenido núcleo y revisar Search Console semanalmente hasta que aparezcan consultas reales.'});
}

const payload={
  generatedAt:new Date().toISOString(),
  source:{searchConsoleOk:!!sc?.ok,pageSpeedOk:!!ps?.ok,totalPosts:posts.length},
  nextActions:uniqueBy(ideas,x=>`${x.type}:${x.query}:${x.page}`).slice(0,50),
  technicalImprovements:improvements.slice(0,30),
  editorialRules:[
    'No publicar por keyword sola: validar intención y utilidad real.',
    'Priorizar queries con impresiones reales y CTR bajo.',
    'Actualizar posts viejos relacionados cuando se publique uno nuevo.',
    'No crear contenido duplicado para consultas casi iguales.'
  ]
};
ensureDir();
fs.writeFileSync(OUT,JSON.stringify(payload,null,2)+'\n');
console.log('Ideas SEO generadas: '+payload.nextActions.length+'. Mejoras técnicas: '+payload.technicalImprovements.length+'.');

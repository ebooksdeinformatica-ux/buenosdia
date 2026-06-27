import fs from 'node:fs';

const sources=JSON.parse(fs.readFileSync('data/thot_sources.json','utf8'));
const outDir='thot';
if(!fs.existsSync(outDir))fs.mkdirSync(outDir,{recursive:true});

const strip=s=>String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const uniq=arr=>[...new Set(arr.filter(Boolean))];

function classify(title){
  const t=title.toLowerCase();
  const tags=[];
  if(/how to|cómo|como|guide|guía|guia|tutorial/.test(t))tags.push('guia');
  if(/checklist|lista|steps|pasos|ways|formas|tips/.test(t))tags.push('pasos-lista');
  if(/why|por qué|porque|what is|qué es|que es/.test(t))tags.push('explicativo');
  if(/study|research|data|report|datos|estudio|informe/.test(t))tags.push('datos');
  if(/ai|llm|geo|aeo|search|seo|google/.test(t))tags.push('seo-ai-search');
  if(!tags.length)tags.push('editorial');
  return tags;
}

function extractCandidates(html,base){
  const links=[];
  for(const m of html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const href=m[1];
    const text=strip(m[2]);
    if(text.length<18||text.length>140)continue;
    if(/subscribe|login|privacy|terms|contact|newsletter/i.test(text))continue;
    let url=href;
    try{url=new URL(href,base).href}catch{}
    links.push({title:text,url});
  }
  return uniq(links.map(x=>x.title+'|||'+x.url)).slice(0,18).map(x=>{const [title,url]=x.split('|||');return{title,url,signals:classify(title)}});
}

async function scan(source){
  const res=await fetch(source.url,{headers:{'user-agent':'THOT-Radar/1.0 (+BuenosDia.com)'}});
  const html=await res.text();
  const candidates=extractCandidates(html,source.url).slice(0,source.scanLast||5);
  return {name:source.name,url:source.url,role:source.role,scannedAt:new Date().toISOString(),candidates};
}

const results=[];
for(const source of sources){
  try{results.push(await scan(source));}
  catch(e){results.push({name:source.name,url:source.url,error:String(e.message||e),scannedAt:new Date().toISOString(),candidates:[]});}
}

const all=results.flatMap(r=>r.candidates.map(c=>({...c,source:r.name,role:r.role})));
const signalCount={};
for(const item of all)for(const s of item.signals)signalCount[s]=(signalCount[s]||0)+1;
const preferred=Object.entries(signalCount).sort((a,b)=>b[1]-a[1]).map(([signal,count])=>({signal,count}));

const report={
  generatedAt:new Date().toISOString(),
  rule:'Solo se analizan formatos y señales estructurales. No copiar texto, ideas, ejemplos ni enfoques ajenos.',
  sources:results,
  preferredSignals:preferred,
  recommendation: preferred[0] ? `Formato dominante detectado: ${preferred[0].signal}. Adaptar solo estructura a un tema propio.` : 'Sin señal dominante. Elegir formato manualmente.'
};

fs.writeFileSync(`${outDir}/radar-latest.json`,JSON.stringify(report,null,2));
fs.writeFileSync(`${outDir}/radar-latest.md`,'# THOT Radar\n\nGenerado: '+report.generatedAt+'\n\nRegla: '+report.rule+'\n\n## Señales\n\n'+preferred.map(x=>'- '+x.signal+': '+x.count).join('\n')+'\n\n## Recomendación\n\n'+report.recommendation+'\n');
console.log('THOT Radar OK: '+results.length+' fuente(s), '+all.length+' candidato(s).');

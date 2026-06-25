import fs from 'node:fs';

const SITE='https://www.buenosdia.com';
const OUT='data/google/pagespeed-report.json';
function ensureDir(){fs.mkdirSync('data/google',{recursive:true})}
function score(cat){return cat?.score==null?null:Math.round(cat.score*100)}
function getUrls(){
  const posts=JSON.parse(fs.readFileSync('data/posts.json','utf8'));
  return ['/',...posts.map(p=>p.url),'/categorias/saliendo-de-la-matrix/','/autor/aspf.html','/contacto/'].map(u=>SITE+u.replace(/^\//,''));
}
async function check(url){
  const key=process.env.PAGESPEED_API_KEY;
  const qs=new URLSearchParams({url,strategy:'mobile'});
  for(const c of ['performance','seo','accessibility','best-practices'])qs.append('category',c);
  if(key)qs.set('key',key);
  const endpoint='https://www.googleapis.com/pagespeedonline/v5/runPagespeed?'+qs.toString();
  const res=await fetch(endpoint);
  if(!res.ok)return {url,ok:false,error:'PageSpeed error '+res.status+': '+await res.text()};
  const json=await res.json();
  const cats=json.lighthouseResult?.categories||{};
  const audits=json.lighthouseResult?.audits||{};
  const failedAudits=Object.values(audits).filter(a=>a&&a.score!==null&&a.score!==undefined&&a.score<1&&['numeric','binary'].includes(a.scoreDisplayMode)).slice(0,20).map(a=>({id:a.id,title:a.title,score:a.score,displayValue:a.displayValue||null}));
  return {url,ok:true,fetchTime:json.lighthouseResult?.fetchTime||null,scores:{performance:score(cats.performance),seo:score(cats.seo),accessibility:score(cats.accessibility),bestPractices:score(cats['best-practices'])},failedAudits};
}
async function main(){
  ensureDir();
  const urls=[...new Set(getUrls())];
  const results=[];
  for(const url of urls){
    try{results.push(await check(url))}
    catch(e){results.push({url,ok:false,error:e.message})}
  }
  const weak=results.filter(r=>!r.ok||Object.values(r.scores||{}).some(v=>v!==null&&v<85));
  fs.writeFileSync(OUT,JSON.stringify({generatedAt:new Date().toISOString(),ok:true,totalUrls:results.length,results,weak},null,2)+'\n');
  console.log('PageSpeed OK: '+results.length+' URL(s) revisadas. Problemas: '+weak.length+'.');
}
main().catch(e=>{ensureDir();fs.writeFileSync(OUT,JSON.stringify({generatedAt:new Date().toISOString(),ok:false,error:e.message},null,2)+'\n');process.exitCode=0});

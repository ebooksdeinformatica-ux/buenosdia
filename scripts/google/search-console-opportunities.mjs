import fs from 'node:fs';

const OUT='data/google/search-console-opportunities.json';
const TOKEN_URL='https://oauth2.googleapis.com/token';
const SCOPED_API='https://searchconsole.googleapis.com/webmasters/v3/sites/';

function ensureDir(){fs.mkdirSync('data/google',{recursive:true})}
function isoDaysAgo(days){const d=new Date();d.setUTCDate(d.getUTCDate()-days);return d.toISOString().slice(0,10)}
function num(x){return Number.isFinite(Number(x))?Number(x):0}
function writeFallback(reason){
  ensureDir();
  const payload={generatedAt:new Date().toISOString(),ok:false,reason,site:process.env.GOOGLE_SEARCH_CONSOLE_SITE||null,rows:[],opportunities:{improveCtr:[],quickWins:[],contentIdeas:[]}};
  fs.writeFileSync(OUT,JSON.stringify(payload,null,2)+'\n');
  console.log('Search Console sin datos: '+reason);
}

async function getAccessToken(){
  const client_id=process.env.GOOGLE_CLIENT_ID;
  const client_secret=process.env.GOOGLE_CLIENT_SECRET;
  const refresh_token=process.env.GOOGLE_REFRESH_TOKEN;
  if(!client_id||!client_secret||!refresh_token)throw new Error('Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REFRESH_TOKEN');
  const body=new URLSearchParams({client_id,client_secret,refresh_token,grant_type:'refresh_token'});
  const res=await fetch(TOKEN_URL,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  if(!res.ok)throw new Error('OAuth token error '+res.status+': '+await res.text());
  const json=await res.json();
  if(!json.access_token)throw new Error('Google no devolvió access_token');
  return json.access_token;
}

function classify(rows){
  const normalized=rows.map(r=>{
    const [query,page]=r.keys||['',''];
    const clicks=num(r.clicks), impressions=num(r.impressions), ctr=num(r.ctr), position=num(r.position);
    return {query,page,clicks,impressions,ctr:Number(ctr.toFixed(4)),position:Number(position.toFixed(2))};
  });
  const improveCtr=normalized.filter(r=>r.impressions>=20&&r.position<=20&&r.ctr<0.04).sort((a,b)=>b.impressions-a.impressions).slice(0,30);
  const quickWins=normalized.filter(r=>r.impressions>=10&&r.position>=4&&r.position<=15).sort((a,b)=>a.position-b.position||b.impressions-a.impressions).slice(0,30);
  const contentIdeas=normalized.filter(r=>r.impressions>=5&&r.position>8&&r.position<=40).sort((a,b)=>b.impressions-a.impressions).slice(0,40);
  return {rows:normalized,opportunities:{improveCtr,quickWins,contentIdeas}};
}

async function main(){
  const site=process.env.GOOGLE_SEARCH_CONSOLE_SITE;
  if(!site)return writeFallback('Falta GOOGLE_SEARCH_CONSOLE_SITE');
  let token;
  try{token=await getAccessToken()}catch(e){return writeFallback(e.message)}

  const startDate=process.env.GSC_START_DATE||isoDaysAgo(31);
  const endDate=process.env.GSC_END_DATE||isoDaysAgo(3);
  const request={startDate,endDate,dimensions:['query','page'],rowLimit:25000,startRow:0};
  const url=SCOPED_API+encodeURIComponent(site)+'/searchAnalytics/query';
  const res=await fetch(url,{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(request)});
  if(!res.ok)return writeFallback('Search Console API error '+res.status+': '+await res.text());
  const json=await res.json();
  const {rows,opportunities}=classify(json.rows||[]);
  ensureDir();
  fs.writeFileSync(OUT,JSON.stringify({generatedAt:new Date().toISOString(),ok:true,site,startDate,endDate,totalRows:rows.length,rows,opportunities},null,2)+'\n');
  console.log('Search Console OK: '+rows.length+' filas analizadas.');
}

main().catch(e=>{writeFallback(e.message);process.exitCode=0});

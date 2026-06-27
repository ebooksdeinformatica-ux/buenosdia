import fs from 'node:fs';

const read=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const posts=JSON.parse(read('data/posts.json')||'[]');
const sources=JSON.parse(read('data/thot_sources.json')||'[]');
const experience=read('docs/EXPERIENCIA_EDITORIAL.md');
const source=read('docs/FUENTE_UNICA_PUBLICACIONES.md');
const radar=read('thot/radar-latest.md');

const latest=posts.slice(0,5).map(p=>`- ${p.title} | ${p.category} | ${p.format||'sin-formato'} | ${p.readingTime||''}`).join('\n');
const radarLine=radar ? radar.split('\n').slice(0,30).join('\n') : 'Sin informe radar disponible. Ejecutar npm run thot:radar antes de definir formato.';

const brief=`# Brief THOT previo a publicar

## Publicaciones recientes

${latest||'Sin publicaciones cargadas.'}

## Fuentes externas configuradas

${sources.map(s=>`- ${s.name}: ${s.role}`).join('\n')}

## Radar disponible

${radarLine}

## Experiencia editorial

${experience}

## Fuente unica

${source.slice(0,2500)}

## Orden de trabajo

1. Elegir formato segun radar y tema propio.
2. Diferenciarlo de las publicaciones recientes.
3. Desarrollar cada seccion con cuerpo.
4. No mostrar andamiaje interno.
5. Pasar auditoria.
`;

if(!fs.existsSync('thot'))fs.mkdirSync('thot',{recursive:true});
fs.writeFileSync('thot/brief-latest.md',brief);
console.log('THOT Brief OK');

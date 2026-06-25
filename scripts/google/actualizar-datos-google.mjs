import { spawnSync } from 'node:child_process';

const scripts=[
  'scripts/google/search-console-opportunities.mjs',
  'scripts/google/pagespeed-check.mjs',
  'scripts/google/generar-ideas-seo.mjs'
];

for(const script of scripts){
  console.log('\n▶ '+script);
  const run=spawnSync(process.execPath,[script],{stdio:'inherit',env:process.env});
  if(run.status!==0){
    console.error('Script con salida no cero: '+script);
    process.exitCode=run.status||1;
    break;
  }
}

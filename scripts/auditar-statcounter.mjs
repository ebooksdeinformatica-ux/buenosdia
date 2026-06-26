import fs from 'node:fs';
import path from 'node:path';

const NEW_PROJECT='11923944';
const NEW_SECURITY='5b35b841';
const OLD_PROJECT='12058975';
const OLD_SECURITY='49f17e11';
const scriptPath='assets/js/statcounter.js';
let failed=false;

function fail(msg){
  console.error('✗ '+msg);
  failed=true;
}

function walk(dir){
  const out=[];
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    if(item.name==='.git'||item.name==='node_modules')continue;
    const full=path.join(dir,item.name);
    if(item.isDirectory())out.push(...walk(full));
    else out.push(full.replace(/\\/g,'/'));
  }
  return out;
}

if(!fs.existsSync(scriptPath)){
  fail('Falta '+scriptPath);
}else{
  const js=fs.readFileSync(scriptPath,'utf8');
  if(!js.includes('sc_project='+NEW_PROJECT))fail('Statcounter no usa sc_project '+NEW_PROJECT);
  if(!js.includes('sc_security="'+NEW_SECURITY+'"'))fail('Statcounter no usa sc_security '+NEW_SECURITY);
  if(js.includes(OLD_PROJECT)||js.includes(OLD_SECURITY))fail('El JS global contiene credenciales viejas de Statcounter');
}

for(const file of walk('.').filter(f=>f.endsWith('.html'))){
  if(file.includes('google')&&file.endsWith('.html'))continue;
  const html=fs.readFileSync(file,'utf8');
  const executable=html.replace(/<noscript[\s\S]*?<\/noscript>/gi,'');
  if(executable.includes(OLD_PROJECT)||executable.includes(OLD_SECURITY))fail(file+': contiene Statcounter viejo en zona ejecutable');
  if(!html.includes('/assets/js/statcounter.js'))fail(file+': no carga assets/js/statcounter.js');
}

if(failed)process.exit(1);
console.log('✓ Statcounter OK: JS global correcto y sin código ejecutable viejo.');

import fs from 'node:fs';
const FILE='data/posts.json';
const posts=JSON.parse(fs.readFileSync(FILE,'utf8'));
const changes={
'/posts/automatizar-tareas-simples-sin-complicarte.html':{title:'Cómo automatizar tareas simples sin complicarte',description:'Cómo elegir una tarea repetitiva, automatizarla con seguridad, probarla sobre copias y medir si realmente ahorra tiempo en lugar de crear otro problema.',date:'2026-06-12',readingTime:'11–14 min',tags:['automatización','Python','GitHub Actions','productividad digital']},
'/posts/vender-plantillas-digitales-a-gente-comun.html':{title:'Cómo vender plantillas digitales a gente común',description:'Cómo crear plantillas que una persona no técnica pueda abrir, entender y usar: problema, formato, instrucciones, licencia, prueba, precio y soporte.',date:'2026-06-12',readingTime:'10–13 min',tags:['plantillas digitales','productos digitales','pequeños negocios','accesibilidad']},
'/posts/crear-contenido-sin-depender-de-redes-sociales.html':{title:'Cómo crear contenido sin depender de redes sociales',description:'Cómo construir contenido en un dominio propio, atraer visitas desde buscadores, conservar archivos y usar redes como distribución sin entregarles todo.',date:'2026-06-12',readingTime:'10–13 min',tags:['contenido propio','redes sociales','blog','distribución']},
'/posts/convertir-ideas-sueltas-en-publicaciones-utiles.html':{title:'Cómo convertir ideas sueltas en publicaciones útiles',description:'Cómo pasar de una nota dispersa a un artículo con intención, preguntas, experiencia, fuentes, estructura, edición y una razón real para publicarse.',date:'2026-06-12',readingTime:'10–13 min',tags:['ideas de contenido','escritura web','edición','SEO humano']},
'/posts/usar-ia-para-ordenar-un-proyecto-online.html':{title:'Cómo usar IA para ordenar un proyecto online',description:'Cómo usar inteligencia artificial para inventariar archivos, aclarar objetivos, ordenar tareas y detectar huecos sin entregarle el control del proyecto.',date:'2026-06-12',readingTime:'10–13 min',tags:['inteligencia artificial','gestión de proyectos','organización digital','productividad']}
};
let updated=0;
for(const post of posts){const next=changes[post.url];if(!next)continue;Object.assign(post,next);updated++;}
if(updated!==5)throw new Error(`Se actualizaron ${updated} de 5 publicaciones.`);
fs.writeFileSync(FILE,JSON.stringify(posts,null,2)+'\n');
console.log(`Metadatos actualizados: ${updated}.`);

import fs from 'node:fs';

const FILE='data/posts.json';
const posts=JSON.parse(fs.readFileSync(FILE,'utf8'));
const changes={
  '/posts/usar-una-computadora-vieja-para-crear-valor-digital.html':{
    title:'Cómo usar una computadora vieja para crear valor digital',
    description:'Una computadora vieja todavía puede producir valor: cómo diagnosticarla, trabajar con herramientas livianas y decidir cuándo mejorarla o cambiarla.',
    date:'2026-06-12',readingTime:'12–15 min',
    tags:['computadoras viejas','trabajo digital','hardware','GitHub Pages']
  },
  '/posts/inteligencia-artificial-como-herramienta-de-trabajo-diario.html':{
    title:'Cómo usar la inteligencia artificial en el trabajo diario',
    description:'Cómo integrar inteligencia artificial al trabajo sin delegar criterio: tareas útiles, verificación, privacidad, límites y un flujo que realmente ahorre tiempo.',
    date:'2026-06-12',readingTime:'12–15 min',
    tags:['inteligencia artificial','trabajo digital','verificación','privacidad']
  },
  '/posts/organizar-archivos-para-no-perder-proyectos.html':{
    title:'Cómo organizar archivos para no perder proyectos',
    description:'Un sistema simple para encontrar la versión correcta, separar trabajo activo, usar Git cuando corresponde y recuperar un proyecto sin depender de la memoria.',
    date:'2026-06-12',readingTime:'12–15 min',
    tags:['organización digital','Git','backups','archivos']
  },
  '/posts/crear-un-blog-aunque-no-tengas-equipo-perfecto.html':{
    title:'Cómo crear un blog sin una computadora perfecta',
    description:'Cómo crear y sostener un blog con una computadora común: estructura mínima, GitHub Pages, contenido útil, velocidad, SEO y publicación sin humo.',
    date:'2026-06-12',readingTime:'10–13 min',
    tags:['crear un blog','GitHub Pages','SEO','sitios estáticos']
  },
  '/posts/aprender-programacion-cuando-venis-de-cero.html':{
    title:'Cómo aprender programación cuando venís de cero',
    description:'Cómo empezar a programar sin perderte entre cursos: elegir una ruta, construir proyectos pequeños, entender errores y medir avances reales.',
    date:'2026-06-12',readingTime:'11–14 min',
    tags:['aprender programación','Python','desarrollo web','GitHub']
  }
};

let updated=0;
for(const post of posts){
  const next=changes[post.url];
  if(!next)continue;
  Object.assign(post,next);
  updated++;
}
if(updated!==Object.keys(changes).length)throw new Error(`Se actualizaron ${updated} de ${Object.keys(changes).length} publicaciones.`);
fs.writeFileSync(FILE,JSON.stringify(posts,null,2)+'\n');
console.log(`Metadatos actualizados: ${updated}.`);

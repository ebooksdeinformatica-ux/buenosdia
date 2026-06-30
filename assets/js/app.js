document.documentElement.classList.add('js');

function normalizeLocalUrl(url){
  try{
    const parsed=new URL(url,window.location.origin);
    return parsed.pathname;
  }catch(_){
    return url;
  }
}

const BD_CATEGORIES=[
  ['Calma y Claridad Mental','/categorias/calma-y-claridad-mental/'],
  ['Productividad Humana','/categorias/productividad-humana/'],
  ['Internet, IA y Vida Digital','/categorias/internet-ia-y-vida-digital/'],
  ['Hábitos y Rutinas','/categorias/habitos-y-rutinas/'],
  ['Frases para Compartir','/categorias/frases-para-compartir/'],
  ['Emociones Reales','/categorias/emociones-reales/'],
  ['Autoestima y Reconstrucción','/categorias/autoestima-y-reconstruccion/'],
  ['Saliendo de la Matrix','/categorias/saliendo-de-la-matrix/']
];

const BD_MAIN_LINKS=[
  ['Inicio','/'],
  ['Explorar','/explorar/'],
  ['Publicaciones','/#publicaciones'],
  ['Autor','/autor/aspf.html'],
  ['Contacto','/contacto/']
];

function isActiveUrl(url){
  const current=window.location.pathname.replace(/\/index\.html$/,'/');
  const target=normalizeLocalUrl(url).replace(/\/index\.html$/,'/');
  if(target==='/'&&current==='/')return true;
  return target!=='/'&&current===target;
}

function ensureHeader(){
  let header=document.querySelector('header');
  if(header)return header;
  header=document.createElement('header');
  header.innerHTML='<div class="wrap nav"><a class="brand" href="/"><b>BuenosDia.com</b><small>Buenos días de verdad</small></a></div>';
  document.body.insertAdjacentElement('afterbegin',header);
  return header;
}

function renderSiteMenu(){
  const header=ensureHeader();
  const navWrap=header.querySelector('.nav')||header;
  if(navWrap.querySelector('.menu-toggle'))return;

  const oldNav=navWrap.querySelector('nav');
  if(oldNav)oldNav.remove();

  const button=document.createElement('button');
  button.className='menu-toggle';
  button.type='button';
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-controls','site-menu');
  button.innerHTML='<span class="bars" aria-hidden="true">☰</span><span>Menú</span>';

  const menu=document.createElement('nav');
  menu.id='site-menu';
  menu.className='site-menu';
  menu.setAttribute('aria-label','Menú principal');

  const mainLinks=BD_MAIN_LINKS.map(([label,url])=>{
    const active=isActiveUrl(url)?' aria-current="page"':'';
    return '<a href="'+url+'"'+active+'>'+label+'</a>';
  }).join('');

  const categoryLinks=BD_CATEGORIES.map(([label,url])=>{
    const active=isActiveUrl(url)?' aria-current="page"':'';
    return '<a href="'+url+'"'+active+'><span>'+label+'</span></a>';
  }).join('');

  menu.innerHTML='<div class="menu-main">'+mainLinks+'</div><div class="menu-title">Categorías</div><div class="menu-cats">'+categoryLinks+'</div><p class="menu-note">Menú visible en toda la web. Tocá fuera o Esc para cerrar.</p>';

  navWrap.appendChild(button);
  navWrap.appendChild(menu);

  function closeMenu(){
    document.body.classList.remove('menu-open');
    menu.classList.remove('open');
    button.setAttribute('aria-expanded','false');
  }
  function openMenu(){
    document.body.classList.add('menu-open');
    menu.classList.add('open');
    button.setAttribute('aria-expanded','true');
  }
  function toggleMenu(){
    const isOpen=button.getAttribute('aria-expanded')==='true';
    isOpen?closeMenu():openMenu();
  }

  button.addEventListener('click',event=>{
    event.stopPropagation();
    toggleMenu();
  });
  menu.addEventListener('click',event=>{
    if(event.target.closest('a'))closeMenu();
    event.stopPropagation();
  });
  document.addEventListener('click',event=>{
    if(!header.contains(event.target))closeMenu();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')closeMenu();
  });
}

function groupFromAlternates(){
  const links=[...document.querySelectorAll('link[rel="alternate"][hreflang]')];
  const group={};
  for(const link of links){
    const lang=(link.getAttribute('hreflang')||'').toLowerCase();
    if(['es','en','fr'].includes(lang))group[lang]=normalizeLocalUrl(link.getAttribute('href')||'');
  }
  return group.es&&group.en&&group.fr?group:null;
}

function renderLangSwitch(group){
  const article=document.querySelector('article.article');
  if(!group||!article||article.querySelector('.lang-switch'))return;
  const path=window.location.pathname;
  const current=Object.entries(group).find(([,url])=>normalizeLocalUrl(url)===path)?.[0]||document.documentElement.lang.slice(0,2)||'es';
  const labels={es:'Español',en:'English',fr:'Français'};
  const title={es:'Leer en otro idioma',en:'Read in another language',fr:'Lire dans une autre langue'}[current]||'Leer en otro idioma';
  const box=document.createElement('nav');
  box.className='lang-switch';
  box.setAttribute('aria-label',title);
  box.innerHTML='<span>'+title+'</span>'+Object.entries(group).map(([lang,url])=>{
    const active=lang===current?' class="active" aria-current="page"':'';
    return '<a'+active+' hreflang="'+lang+'" lang="'+lang+'" href="'+normalizeLocalUrl(url)+'">'+labels[lang]+'</a>';
  }).join('');
  const share=article.querySelector('.share');
  const lead=article.querySelector('.lead');
  if(share)share.insertAdjacentElement('afterend',box);
  else if(lead)lead.insertAdjacentElement('afterend',box);
  else article.insertAdjacentElement('afterbegin',box);
}

renderSiteMenu();

fetch('/data/i18n_posts.json')
  .then(response=>response.ok?response.json():[])
  .then(groups=>{
    const path=window.location.pathname;
    const i18nGroups=groups.map(item=>({es:item.es,en:item.en,fr:item.fr})).filter(item=>item.es&&item.en&&item.fr);
    const group=i18nGroups.find(item=>Object.values(item).map(normalizeLocalUrl).includes(path))||groupFromAlternates();
    renderLangSwitch(group);
  })
  .catch(()=>renderLangSwitch(groupFromAlternates()));

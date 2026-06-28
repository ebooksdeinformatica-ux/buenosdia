document.documentElement.classList.add('js');

const i18nGroups=[
  {
    es:'/posts/como-ordenar-la-cabeza-cuando-todo-parece-demasiado.html',
    en:'/en/posts/how-to-clear-your-head-when-everything-feels-too-much.html',
    fr:'/fr/posts/comment-remettre-de-lordre-dans-sa-tete-quand-tout-deborde.html'
  },
  {
    es:'/posts/cuando-funcionas-en-automatico-y-ya-no-sabes-que-elegiste.html',
    en:'/en/posts/when-you-run-on-autopilot-and-dont-know-what-you-chose.html',
    fr:'/fr/posts/quand-tu-fonctionnes-en-automatique-sans-savoir-ce-que-tu-choisis.html'
  },
  {
    es:'/posts/bitacora-para-un-dia-torcido.html',
    en:'/en/posts/logbook-for-a-crooked-day.html',
    fr:'/fr/posts/carnet-pour-une-journee-de-travers.html'
  },
  {
    es:'/posts/cuando-la-manana-pesa-salir-de-la-matrix.html',
    en:'/en/posts/when-the-morning-feels-heavy-and-you-can-recover-your-gaze.html',
    fr:'/fr/posts/quand-le-matin-pese-et-que-tu-peux-retrouver-ton-regard.html'
  }
];

(function renderLanguageSwitch(){
  const path=window.location.pathname;
  const group=i18nGroups.find(item=>Object.values(item).includes(path));
  const article=document.querySelector('article.article');
  if(!group||!article||article.querySelector('.lang-switch'))return;

  const current=Object.entries(group).find(([,url])=>url===path)?.[0]||'es';
  const labels={es:'Español',en:'English',fr:'Français'};
  const title={es:'Leer en otro idioma',en:'Read in another language',fr:'Lire dans une autre langue'}[current]||'Leer en otro idioma';
  const box=document.createElement('nav');
  box.className='lang-switch';
  box.setAttribute('aria-label',title);
  box.innerHTML=`<span>${title}</span>`+Object.entries(group).map(([lang,url])=>{
    const active=lang===current?' class="active" aria-current="page"':'';
    return `<a${active} hreflang="${lang}" lang="${lang}" href="${url}">${labels[lang]}</a>`;
  }).join('');

  const share=article.querySelector('.share');
  const lead=article.querySelector('.lead');
  if(share)share.insertAdjacentElement('afterend',box);
  else if(lead)lead.insertAdjacentElement('afterend',box);
  else article.insertAdjacentElement('afterbegin',box);
})();

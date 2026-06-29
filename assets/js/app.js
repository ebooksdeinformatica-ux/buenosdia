document.documentElement.classList.add('js');

fetch('/data/i18n_posts.json')
  .then(response=>response.ok?response.json():[])
  .then(groups=>{
    const i18nGroups=groups.map(item=>({es:item.es,en:item.en,fr:item.fr})).filter(item=>item.es&&item.en&&item.fr);
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
    box.innerHTML='<span>'+title+'</span>'+Object.entries(group).map(([lang,url])=>{
      const active=lang===current?' class="active" aria-current="page"':'';
      return '<a'+active+' hreflang="'+lang+'" lang="'+lang+'" href="'+url+'">'+labels[lang]+'</a>';
    }).join('');

    const share=article.querySelector('.share');
    const lead=article.querySelector('.lead');
    if(share)share.insertAdjacentElement('afterend',box);
    else if(lead)lead.insertAdjacentElement('afterend',box);
    else article.insertAdjacentElement('afterbegin',box);
  })
  .catch(()=>{});

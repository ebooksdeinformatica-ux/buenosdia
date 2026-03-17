fetch('data/posts.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('No se pudo cargar data/posts.json');
    }
    return response.json();
  })
  .then(posts => {
    const postsContainer = document.getElementById('posts-container');
    const tagCloud = document.getElementById('tag-cloud');

    if (!Array.isArray(posts) || posts.length === 0) {
      postsContainer.innerHTML = '<div class="empty-state">Todavía no hay publicaciones cargadas.</div>';
      tagCloud.innerHTML = '<span>Sin etiquetas todavía</span>';
      return;
    }

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const allTags = [];

    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'post-card';

      const tags = Array.isArray(post.tags) ? post.tags : [];
      allTags.push(...tags);

      article.innerHTML = `
        <h3><a href="${post.url}">${post.title}</a></h3>
        <p class="post-description">${post.description || ''}</p>
        <div class="post-meta">
          ${tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
        </div>
        <a class="read-more" href="${post.url}">Leer publicación →</a>
      `;

      postsContainer.appendChild(article);
    });

    const uniqueTags = [...new Set(allTags.map(tag => tag.trim()).filter(Boolean))].sort();

    tagCloud.innerHTML = uniqueTags.length
      ? uniqueTags.map(tag => `<span>${tag}</span>`).join('')
      : '<span>Sin etiquetas todavía</span>';
  })
  .catch(error => {
    console.error(error);
    document.getElementById('posts-container').innerHTML =
      '<div class="error-state">Hubo un problema cargando las publicaciones.</div>';

    document.getElementById('tag-cloud').innerHTML =
      '<span>Error cargando etiquetas</span>';
  });

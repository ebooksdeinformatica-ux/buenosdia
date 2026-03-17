fetch('/data/posts.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('No se pudo cargar posts.json');
    }
    return response.json();
  })
  .then(posts => {
    const container = document.getElementById('posts-container');

    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = '<p>No hay publicaciones todavía.</p>';
      return;
    }

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'post-card';

      article.innerHTML = `
        <h3><a href="${post.url}">${post.title}</a></h3>
        <p>${post.description}</p>
        <a class="read-more" href="${post.url}">Leer más</a>
      `;

      container.appendChild(article);
    });
  })
  .catch(error => {
    console.error(error);
    document.getElementById('posts-container').innerHTML =
      '<p>Hubo un problema cargando las publicaciones.</p>';
  });
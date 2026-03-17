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
    const activeFilterBox = document.getElementById('active-filter-box');
    const activeFilterLabel = document.getElementById('active-filter-label');
    const clearFilterBtn = document.getElementById('clear-filter-btn');

    if (!Array.isArray(posts) || posts.length === 0) {
      postsContainer.innerHTML = '<div class="empty-state">Todavía no hay publicaciones cargadas.</div>';
      tagCloud.innerHTML = '<span>Sin etiquetas todavía</span>';
      return;
    }

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const allTags = [];
    let activeTag = null;

    function normalizeTag(tag) {
      return String(tag || '').trim().toLowerCase();
    }

    function escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    posts.forEach(post => {
      if (Array.isArray(post.tags)) {
        allTags.push(...post.tags);
      }
    });

    const uniqueTags = [...new Set(allTags.map(tag => tag.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    function renderTagCloud() {
      if (uniqueTags.length === 0) {
        tagCloud.innerHTML = '<span>Sin etiquetas todavía</span>';
        return;
      }

      tagCloud.innerHTML = uniqueTags
        .map(tag => {
          const isActive = activeTag && normalizeTag(tag) === normalizeTag(activeTag);
          return `
            <button
              type="button"
              class="tag-cloud-btn${isActive ? ' is-active' : ''}"
              data-tag="${escapeHtml(tag)}"
            >
              ${escapeHtml(tag)}
            </button>
          `;
        })
        .join('');

      tagCloud.querySelectorAll('.tag-cloud-btn').forEach(button => {
        button.addEventListener('click', () => {
          const tag = button.getAttribute('data-tag');
          activeTag = tag;
          renderAll();
          document.getElementById('posts').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    function renderPosts() {
      let visiblePosts = posts;

      if (activeTag) {
        visiblePosts = posts.filter(post =>
          Array.isArray(post.tags) &&
          post.tags.some(tag => normalizeTag(tag) === normalizeTag(activeTag))
        );
      }

      if (activeTag) {
        activeFilterBox.style.display = 'block';
        activeFilterLabel.textContent = activeTag;
      } else {
        activeFilterBox.style.display = 'none';
        activeFilterLabel.textContent = '';
      }

      if (visiblePosts.length === 0) {
        postsContainer.innerHTML = '<div class="empty-state">No hay publicaciones para esa etiqueta.</div>';
        return;
      }

      postsContainer.innerHTML = visiblePosts
        .map(post => {
          const tags = Array.isArray(post.tags) ? post.tags : [];

          return `
            <article class="post-card">
              <h3><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></h3>
              <p class="post-description">${escapeHtml(post.description || '')}</p>
              <div class="post-meta">
                ${tags.map(tag => {
                  const isActive = activeTag && normalizeTag(tag) === normalizeTag(activeTag);
                  return `
                    <button
                      type="button"
                      class="post-tag-btn${isActive ? ' is-active' : ''}"
                      data-tag="${escapeHtml(tag)}"
                    >
                      ${escapeHtml(tag)}
                    </button>
                  `;
                }).join('')}
              </div>
              <a class="read-more" href="${escapeHtml(post.url)}">Leer publicación →</a>
            </article>
          `;
        })
        .join('');

      postsContainer.querySelectorAll('.post-tag-btn').forEach(button => {
        button.addEventListener('click', () => {
          const tag = button.getAttribute('data-tag');
          activeTag = tag;
          renderAll();
          document.getElementById('posts').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    function renderAll() {
      renderTagCloud();
      renderPosts();
    }

    clearFilterBtn.addEventListener('click', () => {
      activeTag = null;
      renderAll();
    });

    renderAll();
  })
  .catch(error => {
    console.error(error);
    document.getElementById('posts-container').innerHTML =
      '<div class="error-state">Hubo un problema cargando las publicaciones.</div>';

    document.getElementById('tag-cloud').innerHTML =
      '<span>Error cargando etiquetas</span>';
  });

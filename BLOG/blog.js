document.addEventListener('DOMContentLoaded', () => {
    // --- Funcionalidade da Página Principal do Blog (index.html) ---
    const categoryButtons = document.querySelectorAll('.category-button');
    const searchInput = document.querySelector('.search-input');
    const allPosts = document.querySelectorAll('.featured-post, .post-card');

    function filterPosts(category) {
        // Atualiza o botão ativo
        categoryButtons.forEach(btn => {
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Filtra os posts
        allPosts.forEach(post => {
            const postCategory = post.getAttribute('data-category');
            if (category === 'todos' || postCategory === category) {
                post.style.display = '';
            } else {
                post.style.display = 'none';
            }
        });
    }

    // Filtro de Categoria pelos botões
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterPosts(button.getAttribute('data-category'));
            });
        });
    }

    // Barra de Pesquisa
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.toLowerCase();

            allPosts.forEach(post => {
                const title = post.querySelector('h3 a')?.textContent.toLowerCase() || '';
                const summary = post.querySelector('p:not(.post-category)')?.textContent.toLowerCase() || '';
                
                if (title.includes(searchTerm) || summary.includes(searchTerm)) {
                    post.style.display = '';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    }

    // Filtro de Categoria pelos links da sidebar
    const categoryLinks = document.querySelectorAll('.category-link');
    if (categoryLinks.length > 0) {
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                filterPosts(link.getAttribute('data-category'));
            });
        });
    }

    // --- Funcionalidade da Página de Post ---
    const shareButtons = document.querySelectorAll('.share-button');

    if (shareButtons.length > 0) {
        const pageUrl = window.location.href;
        const pageTitle = document.title;

        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                let shareUrl = '';

                if (button.classList.contains('whatsapp')) {
                    shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(pageTitle + " - " + pageUrl)}`;
                } else if (button.classList.contains('linkedin')) {
                    shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(pageTitle)}`;
                } else if (button.classList.contains('instagram')) {
                    // Instagram não tem API de compartilhamento direto de link
                    alert('Para compartilhar no Instagram, copie o link e cole em sua postagem ou story.');
                    navigator.clipboard.writeText(pageUrl).then(() => {
                        alert('Link copiado para a área de transferência!');
                    });
                    return;
                }

                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=400');
                }
            });
        });
    }
});
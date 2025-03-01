document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidade de pesquisa
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    const posts = document.querySelectorAll('.post-card, .featured-post');
    const noResultsMessage = document.createElement('div');
    noResultsMessage.className = 'no-results';
    noResultsMessage.style.display = 'none';
    noResultsMessage.innerHTML = '<p>Nenhum resultado encontrado. Tente outra pesquisa.</p>';
    document.querySelector('.posts-grid').appendChild(noResultsMessage);

    function searchPosts(query) {
        query = query.toLowerCase().trim();
        let foundResults = false;

        posts.forEach(post => {
            const title = post.querySelector('h3').textContent.toLowerCase();
            const content = post.querySelector('p').textContent.toLowerCase();
            const category = post.querySelector('.post-category').textContent.toLowerCase();
            
            const isVisible = title.includes(query) || 
                            content.includes(query) || 
                            category.includes(query);
            
            post.style.display = isVisible ? 'block' : 'none';
            if (isVisible) foundResults = true;
        });

        noResultsMessage.style.display = foundResults ? 'none' : 'block';
    }

    searchButton.addEventListener('click', () => {
        searchPosts(searchInput.value);
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchPosts(searchInput.value);
        }
    });

    // Limpar pesquisa quando o input estiver vazio
    searchInput.addEventListener('input', () => {
        if (searchInput.value === '') {
            posts.forEach(post => post.style.display = 'block');
            noResultsMessage.style.display = 'none';
        }
    });

    // Filtro por categorias
    const categoryButtons = document.querySelectorAll('.category-button');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            posts.forEach(post => {
                const postCategory = post.querySelector('.post-category').textContent.toLowerCase();
                if (category === 'todos' || postCategory === category) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    });

    // Newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        // Implementar lógica de inscrição na newsletter
        alert('Obrigado por se inscrever! Em breve você receberá nossas atualizações.');
        newsletterForm.reset();
    });
}); 
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const searchInput = document.querySelector('.search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const allCards = document.querySelectorAll('.tool-card, .link-card, .document-card');

    // Função de busca e filtro
    function filterTools() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.categoria || 'todas';

        allCards.forEach(card => {
            const cardTitle = card.querySelector('h3').textContent.toLowerCase();
            const cardCategory = card.dataset.categoria;
            const matchesSearch = cardTitle.includes(searchTerm);
            const matchesFilter = activeFilter === 'todas' || cardCategory === activeFilter;

            // Elemento pai que precisa ser ocultado/mostrado
            const cardToToggle = card.closest('.tool-card, .link-card, .document-card');

            if (matchesSearch && matchesFilter) {
                cardToToggle.style.display = '';
                setTimeout(() => {
                    cardToToggle.style.opacity = '1';
                    cardToToggle.style.transform = 'translateY(0)';
                }, 10);
            } else {
                cardToToggle.style.opacity = '0';
                cardToToggle.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    cardToToggle.style.display = 'none';
                }, 300);
            }
        });
    }

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterTools);
    }

    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterTools();
            });
        });
    }

    // Animação inicial dos cards
    allCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Animação de entrada das ferramentas
    const ferramentaCards = document.querySelectorAll('.ferramenta-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    ferramentaCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.5s ease';
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // Efeito de hover nos ícones
    ferramentaCards.forEach(card => {
        const icon = card.querySelector('.ferramenta-icon');
        
        card.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
        });

        card.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1) rotate(0)';
        });
    });

    // Adicionar loading state nos botões
    const btnsFerramentas = document.querySelectorAll('.btn-ferramenta');
    
    btnsFerramentas.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const textoOriginal = btn.textContent;
            
            btn.textContent = 'Carregando...';
            btn.style.pointerEvents = 'none';
            btn.classList.add('loading');

            setTimeout(() => {
                btn.textContent = textoOriginal;
                btn.style.pointerEvents = 'auto';
                btn.classList.remove('loading');
            }, 1500);
        });
    });
}); 
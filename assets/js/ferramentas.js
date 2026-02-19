document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.hub-card[data-kind]'));
    const revealBlocks = Array.from(document.querySelectorAll('.hub-hero, .hub-toolbar, .hub-section, .hub-section-cta'));
    const searchInput = document.getElementById('toolSearch');
    const toolbar = document.querySelector('.hub-toolbar');
    const filterButtons = Array.from(document.querySelectorAll('.hub-filter-btn'));
    const resultInfo = document.getElementById('resultsInfo');
    const favoritesKey = 'vl_tools_favorites_v1';
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let activeFilter = 'todos';
    let favorites = new Set();

    document.body.classList.add('hub-js');

    function loadFavorites() {
        try {
            const parsed = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
            favorites = new Set(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
            favorites = new Set();
        }
    }

    function saveFavorites() {
        localStorage.setItem(favoritesKey, JSON.stringify(Array.from(favorites)));
    }

    function pulseFavoriteButton(button) {
        if (!button || prefersReducedMotion) return;
        button.classList.remove('is-pulsing');
        void button.offsetWidth;
        button.classList.add('is-pulsing');
    }

    function applyFavoritesState() {
        cards.forEach((card) => {
            const favId = card.dataset.favId;
            if (!favId) return;
            const isFavorite = favorites.has(favId);
            const favButton = card.querySelector('.hub-fav-btn');
            card.classList.toggle('is-favorite', isFavorite);
            if (favButton) {
                favButton.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
                favButton.title = isFavorite ? 'Remover dos favoritos' : 'Salvar como favorito';
            }
        });
    }

    function cardMatches(card, filter, query) {
        const normalizedQuery = query.trim().toLowerCase();
        const cardText = `${card.dataset.search || ''} ${card.textContent || ''}`.toLowerCase();
        const groups = (card.dataset.groups || '').toLowerCase();
        const kind = (card.dataset.kind || '').toLowerCase();

        const matchFilter = filter === 'todos' || filter === kind || groups.includes(filter);
        const matchQuery = normalizedQuery.length === 0 || cardText.includes(normalizedQuery);

        return matchFilter && matchQuery;
    }

    function getActiveFilterLabel() {
        const activeButton = filterButtons.find((button) => button.classList.contains('active'));
        return activeButton ? activeButton.textContent.trim() : 'Todos';
    }

    function updateResultInfo(visibleCount) {
        if (!resultInfo) return;
        const total = cards.length;
        resultInfo.textContent = `Mostrando ${visibleCount} de ${total} recursos em ${getActiveFilterLabel()}.`;
    }

    function animateVisibleCards(visibleCards) {
        visibleCards.forEach((card, index) => {
            if (prefersReducedMotion) {
                card.classList.add('is-filtered-in');
                return;
            }
            card.classList.remove('is-filtered-in');
            card.style.setProperty('--hub-enter-delay', `${Math.min(index * 35, 220)}ms`);
            requestAnimationFrame(() => {
                card.classList.add('is-filtered-in');
            });
        });
    }

    function applyFilter() {
        const query = searchInput ? searchInput.value : '';
        const visibleCards = [];

        cards.forEach((card) => {
            const visible = cardMatches(card, activeFilter, query);
            card.classList.toggle('is-hidden', !visible);
            if (visible) visibleCards.push(card);
        });

        if (toolbar) {
            toolbar.classList.toggle('is-searching', query.trim().length > 0);
        }

        updateResultInfo(visibleCards.length);
        animateVisibleCards(visibleCards);
    }

    function activateFilter(button) {
        if (!button) return;
        activeFilter = button.dataset.filter || 'todos';
        filterButtons.forEach((item) => item.classList.toggle('active', item === button));
        applyFilter();
    }

    function bindFavorites() {
        cards.forEach((card) => {
            const favId = card.dataset.favId;
            const button = card.querySelector('.hub-fav-btn');
            if (!favId || !button) return;

            button.addEventListener('click', () => {
                if (favorites.has(favId)) {
                    favorites.delete(favId);
                } else {
                    favorites.add(favId);
                }
                saveFavorites();
                applyFavoritesState();
                pulseFavoriteButton(button);
            });
        });
    }

    function initRevealAnimations() {
        const targets = [...revealBlocks, ...cards];
        targets.forEach((target) => target.classList.add('hub-reveal'));

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            targets.forEach((target) => target.classList.add('is-revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.14,
            rootMargin: '0px 0px -10% 0px'
        });

        targets.forEach((target) => observer.observe(target));
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => activateFilter(button));
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);
        searchInput.addEventListener('focus', () => toolbar?.classList.add('is-search-focus'));
        searchInput.addEventListener('blur', () => toolbar?.classList.remove('is-search-focus'));
    }

    loadFavorites();
    applyFavoritesState();
    bindFavorites();
    initRevealAnimations();
    applyFilter();
});

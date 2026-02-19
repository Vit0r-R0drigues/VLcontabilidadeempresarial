document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.hub-card[data-kind]'));
    const searchInput = document.getElementById('toolSearch');
    const filterButtons = Array.from(document.querySelectorAll('.hub-filter-btn'));
    const resultInfo = document.getElementById('resultsInfo');
    const favoritesKey = 'vl_tools_favorites_v1';

    let activeFilter = 'todos';
    let favorites = new Set();

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

        const matchFilter =
            filter === 'todos' ||
            filter === kind ||
            groups.includes(filter);

        const matchQuery = normalizedQuery.length === 0 || cardText.includes(normalizedQuery);

        return matchFilter && matchQuery;
    }

    function updateResultInfo(visibleCount) {
        if (!resultInfo) return;
        const total = cards.length;
        resultInfo.textContent = `Mostrando ${visibleCount} de ${total} recursos.`;
    }

    function applyFilter() {
        const query = searchInput ? searchInput.value : '';
        let visibleCount = 0;

        cards.forEach((card) => {
            const visible = cardMatches(card, activeFilter, query);
            card.classList.toggle('is-hidden', !visible);
            if (visible) visibleCount += 1;
        });

        updateResultInfo(visibleCount);
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
            });
        });
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => activateFilter(button));
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);
    }

    loadFavorites();
    applyFavoritesState();
    bindFavorites();
    applyFilter();
});

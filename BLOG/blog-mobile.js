(function () {
    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 80);
    }

    function setCurrentYear() {
        var yearEl = document.getElementById('currentYear');
        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }
    }

    function setupBlogHub() {
        var searchInput = document.getElementById('postSearch');
        var filters = Array.from(document.querySelectorAll('.filter-btn[data-filter]'));
        var cards = Array.from(document.querySelectorAll('.post-card[data-category]'));
        var resultNote = document.getElementById('resultsNote');

        if (!searchInput || cards.length === 0 || filters.length === 0) {
            return;
        }

        var activeFilter = 'todos';

        function cardMatches(card, filter, query) {
            var cat = (card.getAttribute('data-category') || '').toLowerCase();
            var search = (card.getAttribute('data-search') || '').toLowerCase();
            var title = (card.querySelector('h2, h3') || { textContent: '' }).textContent.toLowerCase();
            var text = (card.textContent || '').toLowerCase();

            var categoryOk = filter === 'todos' || cat === filter;
            var queryValue = query.trim().toLowerCase();
            var queryOk = !queryValue || search.indexOf(queryValue) >= 0 || title.indexOf(queryValue) >= 0 || text.indexOf(queryValue) >= 0;

            return categoryOk && queryOk;
        }

        function updateResultNote(visibleCount) {
            if (!resultNote) {
                return;
            }
            var label = filters.find(function (btn) { return btn.classList.contains('active'); });
            var categoryLabel = label ? label.textContent.trim() : 'Todos';
            resultNote.textContent = 'Mostrando ' + visibleCount + ' de ' + cards.length + ' posts em ' + categoryLabel + '.';
        }

        function applyFilter() {
            var query = searchInput.value || '';
            var visibleCount = 0;

            cards.forEach(function (card) {
                var show = cardMatches(card, activeFilter, query);
                card.classList.toggle('is-hidden', !show);
                if (show) {
                    visibleCount += 1;
                }
            });

            updateResultNote(visibleCount);
        }

        filters.forEach(function (btn) {
            btn.addEventListener('click', function () {
                activeFilter = btn.getAttribute('data-filter') || 'todos';
                filters.forEach(function (other) {
                    other.classList.toggle('active', other === btn);
                });
                applyFilter();
            });
        });

        searchInput.addEventListener('input', applyFilter);
        applyFilter();
    }

    function setupReadingTime() {
        var article = document.querySelector('.article-content');
        var target = document.querySelector('[data-reading-time]');
        if (!article || !target) {
            return;
        }

        var words = article.textContent.trim().split(/\s+/).filter(Boolean).length;
        var minutes = Math.max(1, Math.round(words / 210));
        target.textContent = minutes + ' min de leitura';
    }

    function setupReadingProgress() {
        var bar = document.getElementById('readingBar');
        var article = document.querySelector('.article-content');

        if (!bar || !article) {
            return;
        }

        function update() {
            var viewportTop = window.scrollY;
            var articleTop = article.getBoundingClientRect().top + window.scrollY;
            var articleHeight = article.offsetHeight;
            var viewportHeight = window.innerHeight;

            var start = articleTop - viewportHeight * 0.15;
            var end = articleTop + articleHeight - viewportHeight * 0.7;
            var total = Math.max(1, end - start);
            var progress = Math.min(100, Math.max(0, ((viewportTop - start) / total) * 100));

            bar.style.width = progress.toFixed(2) + '%';
        }

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    function setupToc() {
        var tocList = document.getElementById('tocList');
        var content = document.querySelector('.article-content');

        if (!tocList || !content) {
            return;
        }

        var headings = Array.from(content.querySelectorAll('h2, h3'));
        if (headings.length === 0) {
            return;
        }

        tocList.innerHTML = '';

        headings.forEach(function (heading, index) {
            if (!heading.id) {
                heading.id = slugify(heading.textContent) || ('secao-' + (index + 1));
            }

            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + heading.id;
            a.textContent = heading.textContent;
            a.dataset.tocTarget = heading.id;

            if (heading.tagName.toLowerCase() === 'h3') {
                a.style.paddingLeft = '0.9rem';
                a.style.fontSize = '0.8rem';
            }

            li.appendChild(a);
            tocList.appendChild(li);
        });

        var links = Array.from(tocList.querySelectorAll('a[data-toc-target]'));

        function activate(id) {
            links.forEach(function (link) {
                link.classList.toggle('active', link.dataset.tocTarget === id);
            });
        }

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        activate(entry.target.id);
                    }
                });
            }, {
                threshold: 0.15,
                rootMargin: '-18% 0px -65% 0px'
            });

            headings.forEach(function (heading) {
                observer.observe(heading);
            });
        }

        links.forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                var id = link.dataset.tocTarget;
                var target = document.getElementById(id);
                if (!target) {
                    return;
                }

                var top = target.getBoundingClientRect().top + window.scrollY - 86;
                window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                activate(id);
            });
        });

        activate(headings[0].id);
    }

    function setupCopyButtons() {
        Array.from(document.querySelectorAll('[data-copy-link]')).forEach(function (btn) {
            btn.addEventListener('click', function () {
                var url = window.location.href;
                navigator.clipboard.writeText(url).then(function () {
                    var old = btn.textContent;
                    btn.textContent = 'Link copiado';
                    setTimeout(function () {
                        btn.textContent = old;
                    }, 1600);
                }).catch(function () {
                    // fail silently
                });
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setCurrentYear();
        setupBlogHub();
        setupReadingTime();
        setupReadingProgress();
        setupToc();
        setupCopyButtons();
    });
})();

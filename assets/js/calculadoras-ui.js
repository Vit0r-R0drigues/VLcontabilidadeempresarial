(function () {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function parseMoeda(texto) {
        if (!texto) return 0;
        const normalizado = String(texto)
            .replace(/[^\d,.-]/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
        const numero = Number(normalizado);
        return Number.isFinite(numero) ? numero : 0;
    }

    function animateNumber({
        element,
        from,
        to,
        duration = 420,
        formatter
    }) {
        if (!element) return;
        if (prefersReducedMotion) {
            element.textContent = formatter(to);
            return;
        }

        const inicio = performance.now();

        function step(agora) {
            const progresso = Math.min((agora - inicio) / duration, 1);
            const easing = 1 - Math.pow(1 - progresso, 3);
            const valorAtual = from + (to - from) * easing;
            element.textContent = formatter(valorAtual);

            if (progresso < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    function animateCurrency(element, valor) {
        const atual = parseMoeda(element.textContent);
        animateNumber({
            element,
            from: atual,
            to: Number(valor || 0),
            formatter: (v) => Number(v).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
        });
        pulseElement(element);
    }

    function animatePercent(element, valor) {
        const atual = parseMoeda(element.textContent);
        animateNumber({
            element,
            from: atual,
            to: Number(valor || 0),
            formatter: (v) => `${v.toFixed(2).replace('.', ',')}%`
        });
        pulseElement(element);
    }

    function pulseElement(element) {
        if (!element) return;
        element.classList.remove('calc-value-updated');
        void element.offsetWidth;
        element.classList.add('calc-value-updated');
    }

    function updateProgress(barElement, percentage) {
        if (!barElement) return;
        barElement.style.width = `${percentage}%`;
        pulseElement(barElement);
    }

    function revealOnScroll() {
        const blocks = document.querySelectorAll('.calculadora-hero, .entrada-dados, .passo-a-passo, .resultados');
        blocks.forEach((block) => block.classList.add('calc-reveal'));

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            blocks.forEach((block) => block.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        blocks.forEach((block) => observer.observe(block));
    }

    function highlightResultCards() {
        document.querySelectorAll('.resultado-cards .card').forEach((card, index) => {
            card.style.setProperty('--calc-delay', `${index * 70}ms`);
            card.classList.add('calc-card-enter');
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        revealOnScroll();
        highlightResultCards();
    });

    window.CalculadoraUI = {
        animateCurrency,
        animatePercent,
        pulseElement,
        updateProgress
    };
})();

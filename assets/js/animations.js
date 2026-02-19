// Animação de contagem nos números
document.addEventListener('DOMContentLoaded', function () {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const animateValue = (element, start, end, duration, suffix = '') => {
        const startTime = performance.now();
        const isPercentage = suffix === '%';
        const hasPlus = element.textContent.includes('+');

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (end - start) * easeOutQuart);

            element.textContent = (hasPlus ? '+' : '') + current + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const target = parseInt(element.getAttribute('data-target'));
                const text = element.textContent;
                const suffix = text.includes('%') ? '%' : '';

                element.textContent = suffix === '%' ? '0%' : '0';
                animateValue(element, 0, target, 2000, suffix);

                observer.unobserve(element);
            }
        });
    }, observerOptions);

    // Observe all number elements with data-target
    document.querySelectorAll('.numero[data-target]').forEach(el => {
        observer.observe(el);
    });
});

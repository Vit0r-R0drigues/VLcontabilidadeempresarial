document.addEventListener('DOMContentLoaded', () => {
    if (!window.VLMotion) {
        return;
    }

    const motion = window.VLMotion;
    const page = document.body?.dataset.page || '';

    motion.applyRootState();
    motion.initTapFeedback();
    motion.initSwapValues();

    const revealConfigs = [
        '.page-hero > *',
        '.detail-hero > *',
        '.section-heading',
        '.final-cta-panel > *',
        '.responsible-card > *',
        '.contact-form-panel > *',
        { container: '.grid-2, .grid-3, .process-grid, .faq-grid-v2, .fit-grid, .contact-grid-v2, .service-overview-grid, .audience-grid, .services-home-grid, .trust-metric-row, .hero-proof-band', itemSelector: ':scope > *', step: 70 },
        { container: '.faq-details', itemSelector: ':scope > details', step: 70 },
        { container: '.service-anchor-row', itemSelector: ':scope > a', step: 48, baseDelay: 90 },
        { container: '.request-options', itemSelector: ':scope > *', step: 70 }
    ];

    if (page === 'home') {
        revealConfigs.push(
            { container: '.hero-home-grid', itemSelector: ':scope > *', step: 120 },
            '.hero-home-copy > *',
            '.hero-visual-card > *',
            { container: '.hero-direct-links, .audience-track-list, .audience-callout-actions, .proof-support-list', itemSelector: ':scope > *', step: 70 },
            '.proof-support-header > *',
            { container: '.audience-layout', itemSelector: ':scope > *', step: 110 },
            '.audience-fusion-panel .section-heading',
            '.services-home-panel .section-heading',
            '.dre-section .section-heading',
            { container: '.dre-layout', itemSelector: ':scope > *', step: 120 },
            '.dre-footnote'
        );
    }

    if (page === 'ir-2026') {
        revealConfigs.push('.hero', '.intro-card', '.quiz-shell', '.faq-shell');
    }

    motion.markRevealTargets(revealConfigs);
    motion.initRevealTargets();
    motion.initCountUps();
    motion.initParallaxScene();
    motion.initDreSection();
    motion.initTaxHero();
    motion.initFormEnhancements();
    motion.initIr2026Enhancements();

    if (page === 'home') {
        const homeFloat = document.querySelector('.whatsapp-float');
        const homeHero = document.querySelector('.hero-home-premium');
        const heroProofBand = document.querySelector('.hero-proof-band');
        const audiencePanel = document.querySelector('.audience-fusion-panel');
        const mobileFloatQuery = window.matchMedia('(max-width: 640px)');

        const syncHomeFloat = () => {
            if (!homeFloat || !homeHero) {
                return;
            }

            const thresholdAnchor = mobileFloatQuery.matches
                ? (audiencePanel || heroProofBand || homeHero)
                : (heroProofBand || homeHero);
            const threshold = thresholdAnchor.offsetTop + thresholdAnchor.offsetHeight - Math.min(window.innerHeight * 0.18, 120);
            const shouldShow = !mobileFloatQuery.matches || window.scrollY > threshold;
            document.body.classList.toggle('home-float-active', shouldShow);
        };

        syncHomeFloat();
        window.addEventListener('scroll', syncHomeFloat, { passive: true });
        window.addEventListener('resize', syncHomeFloat);

        if (typeof mobileFloatQuery.addEventListener === 'function') {
            mobileFloatQuery.addEventListener('change', syncHomeFloat);
        } else if (typeof mobileFloatQuery.addListener === 'function') {
            mobileFloatQuery.addListener(syncHomeFloat);
        }
    }
});

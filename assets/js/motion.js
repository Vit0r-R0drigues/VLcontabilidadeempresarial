(function () {
    const reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const reducedMotion = () => !!(reduceMotionQuery && reduceMotionQuery.matches);

    const countRegistry = new WeakSet();

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function formatValue(element, value) {
        const locale = element.dataset.locale || 'pt-BR';
        const decimals = Number.parseInt(element.dataset.decimals || '0', 10);
        const prefix = element.dataset.prefix || '';
        const suffix = element.dataset.suffix || '';
        const abs = Math.abs(value);
        const formatted = abs.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        const signal = value < 0 ? '-' : '';

        return `${signal}${prefix}${formatted}${suffix}`;
    }

    function animateCount(element, options) {
        const endValue = Number(options.endValue ?? element.dataset.countTo ?? '0');

        if (!Number.isFinite(endValue)) {
            return;
        }

        const duration = options.duration || Number(element.dataset.countDuration || 1400);
        const startValue = Number(options.startValue ?? 0);
        const startedAt = performance.now();

        const step = (now) => {
            const progress = clamp((now - startedAt) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextValue = startValue + ((endValue - startValue) * eased);
            element.textContent = formatValue(element, progress === 1 ? endValue : nextValue);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }

    function applyRootState() {
        const body = document.body;
        if (!body) {
            return;
        }

        body.classList.add('motion-ready');
        body.classList.toggle('reduced-motion', reducedMotion());
    }

    function markRevealTargets(configs) {
        configs.forEach((config) => {
            if (!config) {
                return;
            }

            if (typeof config === 'string') {
                document.querySelectorAll(config).forEach((element) => {
                    if (!element.hasAttribute('data-reveal')) {
                        element.setAttribute('data-reveal', '');
                    }
                });
                return;
            }

            const groups = document.querySelectorAll(config.container);
            groups.forEach((group) => {
                const items = config.direct
                    ? [group]
                    : Array.from(group.querySelectorAll(config.itemSelector || ':scope > *'));

                items.forEach((item, index) => {
                    if (!item || item.hasAttribute('data-reveal')) {
                        return;
                    }

                    item.setAttribute('data-reveal', config.reveal || '');

                    if (config.baseDelay != null || config.step != null) {
                        const baseDelay = config.baseDelay || 0;
                        const step = config.step || 60;
                        item.style.setProperty('--reveal-delay', `${baseDelay + (index * step)}ms`);
                    }
                });
            });
        });
    }

    function initRevealTargets() {
        const targets = Array.from(document.querySelectorAll('[data-reveal]'));
        if (targets.length === 0) {
            return;
        }

        if (reducedMotion() || !('IntersectionObserver' in window)) {
            targets.forEach((target) => target.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.14,
            rootMargin: '0px 0px -12% 0px'
        });

        targets.forEach((target) => observer.observe(target));
    }

    function initCountUps(root) {
        const scope = root || document;
        const targets = Array.from(scope.querySelectorAll('[data-count-to]:not([data-count-mode="manual"])'));

        if (targets.length === 0) {
            return;
        }

        const start = (element) => {
            if (countRegistry.has(element)) {
                return;
            }

            countRegistry.add(element);
            animateCount(element, {
                endValue: Number(element.dataset.countTo),
                duration: Number(element.dataset.countDuration || 1400)
            });
        };

        if (reducedMotion() || !('IntersectionObserver' in window)) {
            targets.forEach(start);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                start(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.35,
            rootMargin: '0px 0px -8% 0px'
        });

        targets.forEach((target) => observer.observe(target));
    }

    function initTapFeedback() {
        const selectors = '.btn-v2, .hub-btn, .submit-button, .hub-filter-btn, .hub-link, .hero-direct-link, .text-link-v2, .service-anchor-row a, .topbar-link, .primary-btn, .secondary-btn, .option-card';

        document.querySelectorAll(selectors).forEach((element) => {
            const release = () => element.classList.remove('is-pressed');

            element.addEventListener('pointerdown', () => element.classList.add('is-pressed'));
            element.addEventListener('pointerup', release);
            element.addEventListener('pointerleave', release);
            element.addEventListener('pointercancel', release);
            element.addEventListener('blur', release);
        });
    }

    function initParallaxScene() {
        const scene = document.querySelector('[data-hero-scene]');
        if (!scene || reducedMotion() || window.innerWidth < 960) {
            return;
        }

        let frame = null;
        let nextX = 0;
        let nextY = 0;

        const commit = () => {
            scene.style.setProperty('--pointer-x', nextX.toFixed(3));
            scene.style.setProperty('--pointer-y', nextY.toFixed(3));
            frame = null;
        };

        scene.addEventListener('pointermove', (event) => {
            const bounds = scene.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) - 0.5;
            const y = ((event.clientY - bounds.top) / bounds.height) - 0.5;

            nextX = clamp(x, -0.5, 0.5);
            nextY = clamp(y, -0.5, 0.5);

            if (!frame) {
                frame = window.requestAnimationFrame(commit);
            }
        });

        scene.addEventListener('pointerleave', () => {
            nextX = 0;
            nextY = 0;

            if (!frame) {
                frame = window.requestAnimationFrame(commit);
            }
        });
    }

    function initSwapValues() {
        if (reducedMotion()) {
            return;
        }

        document.querySelectorAll('[data-swap-values]').forEach((element) => {
            const values = (element.dataset.swapValues || '').split('|').map((item) => item.trim()).filter(Boolean);
            if (values.length < 2) {
                return;
            }

            let index = 0;
            element.textContent = values[index];

            window.setInterval(() => {
                index = (index + 1) % values.length;
                element.textContent = values[index];
            }, Number(element.dataset.swapInterval || 2600));
        });
    }

    function initFormEnhancements() {
        const form = document.getElementById('whatsappForm');
        if (!form) {
            return;
        }

        const fields = Array.from(form.querySelectorAll('input, select, textarea'));
        fields.forEach((field) => {
            const group = field.closest('.form-group');
            if (!group) {
                return;
            }

            const sync = () => {
                const hasValue = field.value != null && String(field.value).trim() !== '';
                group.classList.toggle('is-filled', hasValue);
            };

            field.addEventListener('focus', () => group.classList.add('is-focused'));
            field.addEventListener('blur', () => group.classList.remove('is-focused'));
            field.addEventListener('input', sync);
            field.addEventListener('change', sync);
            sync();
        });
    }

    function runDreSequence(panel) {
        if (!panel || panel.dataset.animated === 'true') {
            return;
        }

        panel.dataset.animated = 'true';
        panel.classList.add('is-dre-active');

        const rows = Array.from(panel.querySelectorAll('[data-dre-row]'));
        rows.forEach((row, index) => {
            window.setTimeout(() => {
                row.classList.add('is-row-visible');
                if (row.dataset.dreEmphasis === 'true') {
                    row.classList.add('is-row-emphasis');
                }

                const value = row.querySelector('[data-count-to]');
                if (value) {
                    animateCount(value, {
                        endValue: Number(value.dataset.countTo),
                        duration: 920
                    });
                }
            }, reducedMotion() ? 0 : index * 180);
        });

        window.setTimeout(() => {
            panel.classList.add('is-dre-complete');
        }, reducedMotion() ? 0 : (rows.length * 180) + 520);
    }

    function initDreSection() {
        const panel = document.querySelector('[data-dre-panel]');
        if (!panel) {
            return;
        }

        if (reducedMotion() || !('IntersectionObserver' in window)) {
            runDreSequence(panel);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                runDreSequence(panel);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.25,
            rootMargin: '0px 0px -10% 0px'
        });

        observer.observe(panel);
    }

    function runTaxSequence(panel) {
        if (!panel || panel.dataset.taxAnimated === 'true') {
            return;
        }

        panel.dataset.taxAnimated = 'true';
        const board = panel.querySelector('[data-tax-board]');
        const cursor = panel.querySelector('[data-tax-cursor]');
        const rows = Array.from(panel.querySelectorAll('[data-tax-row]'));
        const result = panel.querySelector('[data-tax-result]');

        rows.forEach((row, index) => {
            window.setTimeout(() => {
                row.classList.add('is-active');

                if (cursor && board) {
                    cursor.style.opacity = '1';
                    cursor.style.transform = `translateY(${row.offsetTop - 4}px)`;
                }

                const value = row.querySelector('[data-count-to]');
                if (value) {
                    animateCount(value, {
                        endValue: Number(value.dataset.countTo),
                        duration: 860
                    });
                }
            }, reducedMotion() ? 0 : index * 260);
        });

        window.setTimeout(() => {
            if (cursor) {
                cursor.style.opacity = '0';
            }

            if (result) {
                result.classList.add('is-complete');
                const value = result.querySelector('[data-count-to]');
                if (value) {
                    animateCount(value, {
                        endValue: Number(value.dataset.countTo),
                        duration: 980
                    });
                }
            }
        }, reducedMotion() ? 0 : (rows.length * 260) + 260);
    }

    function initTaxHero() {
        const panel = document.querySelector('[data-tax-hero]');
        if (!panel) {
            return;
        }

        if (reducedMotion() || !('IntersectionObserver' in window)) {
            runTaxSequence(panel);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                runTaxSequence(panel);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -14% 0px'
        });

        observer.observe(panel);
    }

    function initIr2026Enhancements() {
        if (document.body?.dataset.page !== 'ir-2026') {
            return;
        }

        const bodyObserver = new MutationObserver(() => {
            document.body.classList.toggle('quiz-started', document.body.dataset.started === 'true');
        });

        bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-started']
        });
    }

    window.VLMotion = {
        animateCount,
        applyRootState,
        initCountUps,
        initDreSection,
        initFormEnhancements,
        initIr2026Enhancements,
        initParallaxScene,
        initRevealTargets,
        initSwapValues,
        initTapFeedback,
        initTaxHero,
        markRevealTargets,
        reducedMotion
    };
})();

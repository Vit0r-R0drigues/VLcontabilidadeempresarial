(function () {
    const page = document.body?.dataset.page;
    if (page !== 'home') {
        return;
    }

    const main = document.querySelector('.home-main-premium');
    const layer = document.querySelector('[data-hero-background]');
    const canvas = document.querySelector('[data-hero-bg-canvas]');

    if (!main || !layer || !canvas || typeof canvas.getContext !== 'function') {
        return;
    }

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        return;
    }

    const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const mobileQuery = window.matchMedia ? window.matchMedia('(max-width: 860px)') : null;
    const reducedMotion = () => !!(reducedMotionQuery && reducedMotionQuery.matches);
    const isMobile = () => !!(mobileQuery && mobileQuery.matches);
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const chainBlueprints = [
        [
            { x: 0.08, y: 0.22, depth: 0.22 },
            { x: 0.22, y: 0.25, depth: 0.28 },
            { x: 0.38, y: 0.24, depth: 0.34 },
            { x: 0.56, y: 0.22, depth: 0.4 },
            { x: 0.74, y: 0.28, depth: 0.48 },
            { x: 0.92, y: 0.34, depth: 0.34 }
        ],
        [
            { x: 0.14, y: 0.46, depth: 0.18 },
            { x: 0.28, y: 0.43, depth: 0.24 },
            { x: 0.44, y: 0.48, depth: 0.3 },
            { x: 0.61, y: 0.44, depth: 0.38 },
            { x: 0.79, y: 0.49, depth: 0.46 },
            { x: 0.94, y: 0.56, depth: 0.34 }
        ],
        [
            { x: 0.18, y: 0.67, depth: 0.16 },
            { x: 0.34, y: 0.62, depth: 0.24 },
            { x: 0.52, y: 0.66, depth: 0.32 },
            { x: 0.68, y: 0.64, depth: 0.38 },
            { x: 0.84, y: 0.72, depth: 0.34 }
        ],
        [
            { x: 0.64, y: 0.14, depth: 0.28 },
            { x: 0.7, y: 0.28, depth: 0.34 },
            { x: 0.74, y: 0.46, depth: 0.42 },
            { x: 0.8, y: 0.61, depth: 0.48 },
            { x: 0.88, y: 0.78, depth: 0.28 }
        ]
    ].map((chain, chainIndex) => chain.map((point, pointIndex) => ({
        ...point,
        seed: (chainIndex * 1.9) + (pointIndex * 0.73)
    })));

    const bridgeBlueprints = [
        [[0, 2], [1, 2]],
        [[0, 4], [3, 1]],
        [[1, 3], [2, 3]],
        [[1, 4], [3, 2]]
    ];

    const barBlueprints = [
        { x: 0.58, y: 0.8, width: 12, height: 56, depth: 0.28 },
        { x: 0.61, y: 0.8, width: 12, height: 78, depth: 0.34 },
        { x: 0.64, y: 0.8, width: 12, height: 96, depth: 0.42 },
        { x: 0.67, y: 0.8, width: 12, height: 62, depth: 0.32 },
        { x: 0.7, y: 0.8, width: 12, height: 88, depth: 0.46 }
    ];

    const labels = [
        { chain: 0, point: 3, text: 'Receita' },
        { chain: 1, point: 4, text: 'Base' },
        { chain: 2, point: 2, text: 'DRE' },
        { chain: 3, point: 2, text: 'Tributo' },
        { chain: 3, point: 4, text: '+2,8%' }
    ];

    const state = {
        width: 0,
        height: 0,
        dpr: 1,
        frameId: 0,
        visible: true,
        lastFrameAt: 0,
        pointer: {
            x: 0.62,
            y: 0.34,
            targetX: 0.62,
            targetY: 0.34
        }
    };

    function setLayerVariables() {
        const shiftX = ((state.pointer.x - 0.5) * 2).toFixed(3);
        const shiftY = ((state.pointer.y - 0.5) * 2).toFixed(3);
        layer.style.setProperty('--hero-bg-shift-x', shiftX);
        layer.style.setProperty('--hero-bg-shift-y', shiftY);
        layer.style.setProperty('--hero-bg-glow-x', `${(state.pointer.x * 100).toFixed(2)}%`);
        layer.style.setProperty('--hero-bg-glow-y', `${(state.pointer.y * 100).toFixed(2)}%`);
    }

    function syncCanvasSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (!width || !height) {
            return;
        }

        state.width = width;
        state.height = height;
        state.dpr = Math.min(window.devicePixelRatio || 1, 1.4);

        canvas.width = Math.round(state.width * state.dpr);
        canvas.height = Math.round(state.height * state.dpr);
        context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        render(performance.now(), true);
    }

    function projectPoint(point, time) {
        const motionFactor = reducedMotion() ? 0 : 1;
        const mobileFactor = isMobile() ? 0.46 : 1;
        const parallaxX = ((state.pointer.x - 0.5) * 34 * point.depth * mobileFactor) * motionFactor;
        const parallaxY = ((state.pointer.y - 0.5) * 28 * point.depth * mobileFactor) * motionFactor;
        const driftX = Math.sin((time * 0.00017) + point.seed) * 9 * point.depth * mobileFactor * motionFactor;
        const driftY = Math.cos((time * 0.00013) + (point.seed * 1.7)) * 7 * point.depth * mobileFactor * motionFactor;

        return {
            x: (point.x * state.width) + parallaxX + driftX,
            y: (point.y * state.height) + parallaxY + driftY,
            depth: point.depth,
            seed: point.seed
        };
    }

    function roundRectPath(ctx, x, y, width, height, radius) {
        const safeRadius = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + safeRadius, y);
        ctx.lineTo(x + width - safeRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        ctx.lineTo(x + width, y + height - safeRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
        ctx.lineTo(x + safeRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        ctx.lineTo(x, y + safeRadius);
        ctx.quadraticCurveTo(x, y, x + safeRadius, y);
        ctx.closePath();
    }

    function drawGlow() {
        const glowX = state.pointer.x * state.width;
        const glowY = state.pointer.y * state.height;
        const gradient = context.createRadialGradient(glowX, glowY, 0, glowX, glowY, state.width * (isMobile() ? 0.22 : 0.3));
        gradient.addColorStop(0, 'rgba(98, 153, 255, 0.18)');
        gradient.addColorStop(0.45, 'rgba(98, 153, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(98, 153, 255, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, state.width, state.height);
    }

    function drawBars(time) {
        barBlueprints.forEach((bar, index) => {
            const sway = reducedMotion() ? 0 : Math.sin((time * 0.00028) + index) * 4;
            const shiftX = (state.pointer.x - 0.5) * 10 * bar.depth * (isMobile() ? 0.36 : 1);
            const barHeight = bar.height + sway;
            const x = (bar.x * state.width) + shiftX;
            const y = (bar.y * state.height) - barHeight;

            const fill = context.createLinearGradient(0, y, 0, y + barHeight);
            fill.addColorStop(0, 'rgba(156, 122, 255, 0.34)');
            fill.addColorStop(0.65, 'rgba(91, 144, 255, 0.22)');
            fill.addColorStop(1, 'rgba(91, 144, 255, 0.04)');

            roundRectPath(context, x, y, bar.width, barHeight, 8);
            context.fillStyle = fill;
            context.fill();
        });
    }

    function drawChains(projectedChains) {
        projectedChains.forEach((points, chainIndex) => {
            context.save();
            context.beginPath();
            points.forEach((point, index) => {
                if (index === 0) {
                    context.moveTo(point.x, point.y);
                    return;
                }

                context.lineTo(point.x, point.y);
            });

            if (chainIndex % 2 === 0) {
                context.setLineDash([7, 14]);
            }

            context.lineWidth = chainIndex === 3 ? 1.1 : 1;
            context.strokeStyle = chainIndex === 3
                ? 'rgba(155, 124, 255, 0.18)'
                : 'rgba(109, 165, 255, 0.16)';
            context.stroke();
            context.restore();
        });

        bridgeBlueprints.forEach((bridge) => {
            const [fromChain, fromPoint] = bridge[0];
            const [toChain, toPoint] = bridge[1];
            const start = projectedChains[fromChain][fromPoint];
            const end = projectedChains[toChain][toPoint];

            context.save();
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.setLineDash([4, 16]);
            context.strokeStyle = 'rgba(143, 242, 182, 0.1)';
            context.lineWidth = 0.9;
            context.stroke();
            context.restore();
        });
    }

    function drawNodes(projectedChains, time) {
        projectedChains.forEach((points) => {
            points.forEach((point) => {
                const pulse = reducedMotion() ? 0.5 : (0.5 + (Math.sin((time * 0.0022) + (point.seed * 5)) * 0.5));
                const radius = 1.4 + (point.depth * 3.2);

                context.beginPath();
                context.arc(point.x, point.y, radius + (pulse * 1.1), 0, Math.PI * 2);
                context.fillStyle = `rgba(133, 184, 255, ${0.08 + (pulse * 0.08)})`;
                context.fill();

                context.beginPath();
                context.arc(point.x, point.y, radius, 0, Math.PI * 2);
                context.fillStyle = point.depth > 0.38 ? 'rgba(143, 242, 182, 0.66)' : 'rgba(164, 190, 255, 0.52)';
                context.fill();
            });
        });
    }

    function pointAlongChain(points, progress) {
        const segments = [];
        let totalLength = 0;

        for (let index = 0; index < points.length - 1; index += 1) {
            const start = points[index];
            const end = points[index + 1];
            const length = Math.hypot(end.x - start.x, end.y - start.y);
            segments.push({ start, end, length });
            totalLength += length;
        }

        let targetLength = progress * totalLength;
        for (const segment of segments) {
            if (targetLength <= segment.length) {
                const ratio = segment.length === 0 ? 0 : targetLength / segment.length;
                return {
                    x: segment.start.x + ((segment.end.x - segment.start.x) * ratio),
                    y: segment.start.y + ((segment.end.y - segment.start.y) * ratio)
                };
            }

            targetLength -= segment.length;
        }

        return points[points.length - 1];
    }

    function drawTravelers(projectedChains, time) {
        projectedChains.forEach((points, chainIndex) => {
            const progress = ((time * 0.00006) + (chainIndex * 0.18)) % 1;
            const pulse = pointAlongChain(points, progress);
            const gradient = context.createRadialGradient(pulse.x, pulse.y, 0, pulse.x, pulse.y, isMobile() ? 12 : 18);
            gradient.addColorStop(0, 'rgba(143, 242, 182, 0.82)');
            gradient.addColorStop(0.42, 'rgba(104, 168, 255, 0.28)');
            gradient.addColorStop(1, 'rgba(104, 168, 255, 0)');
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(pulse.x, pulse.y, isMobile() ? 12 : 18, 0, Math.PI * 2);
            context.fill();
        });
    }

    function drawLabels(projectedChains) {
        context.save();
        context.font = '600 11px Inter, sans-serif';
        context.fillStyle = 'rgba(218, 232, 255, 0.32)';

        labels.forEach((label) => {
            const point = projectedChains[label.chain]?.[label.point];
            if (!point) {
                return;
            }

            context.fillText(label.text, point.x + 10, point.y - 10);
        });

        context.restore();
    }

    function drawLedgerMarks(time) {
        const rows = [0.18, 0.34, 0.52, 0.7];
        context.save();
        context.lineWidth = 1;
        context.setLineDash([10, 18]);

        rows.forEach((row, index) => {
            const drift = reducedMotion() ? 0 : Math.sin((time * 0.00008) + index) * 8;
            const y = (row * state.height) + drift;
            context.beginPath();
            context.moveTo(state.width * 0.52, y);
            context.lineTo(state.width * 0.98, y);
            context.strokeStyle = 'rgba(204, 220, 255, 0.05)';
            context.stroke();
        });

        context.restore();
    }

    function drawFrame(time) {
        context.clearRect(0, 0, state.width, state.height);
        drawGlow();
        drawLedgerMarks(time);
        drawBars(time);

        const projectedChains = chainBlueprints.map((chain) => chain.map((point) => projectPoint(point, time)));
        drawChains(projectedChains);
        drawNodes(projectedChains, time);
        drawTravelers(projectedChains, time);
        drawLabels(projectedChains);
    }

    function render(time, force) {
        if (!state.width || !state.height) {
            return false;
        }

        const frameBudget = isMobile() ? 52 : 34;
        if (!force && !reducedMotion() && time - state.lastFrameAt < frameBudget) {
            return false;
        }

        state.pointer.x += (state.pointer.targetX - state.pointer.x) * (isMobile() ? 0.04 : 0.08);
        state.pointer.y += (state.pointer.targetY - state.pointer.y) * (isMobile() ? 0.04 : 0.08);
        setLayerVariables();
        drawFrame(time);
        state.lastFrameAt = time;
        return true;
    }

    function loop(time) {
        if (!state.visible || document.hidden) {
            state.frameId = 0;
            return;
        }

        render(time, false);
        if (!reducedMotion()) {
            state.frameId = window.requestAnimationFrame(loop);
        } else {
            state.frameId = 0;
        }
    }

    function start() {
        if (!state.visible) {
            return;
        }

        if (reducedMotion()) {
            render(performance.now(), true);
            return;
        }

        if (!state.frameId) {
            state.frameId = window.requestAnimationFrame(loop);
        }
    }

    function stop() {
        if (state.frameId) {
            window.cancelAnimationFrame(state.frameId);
            state.frameId = 0;
        }
    }

    function resetPointer() {
        state.pointer.targetX = 0.62;
        state.pointer.targetY = 0.34;
    }

    main.addEventListener('pointermove', (event) => {
        if (reducedMotion() || isMobile()) {
            return;
        }

        const bounds = main.getBoundingClientRect();
        state.pointer.targetX = clamp((event.clientX - bounds.left) / bounds.width, 0.08, 0.92);
        state.pointer.targetY = clamp((event.clientY - bounds.top) / bounds.height, 0.12, 0.88);
        start();
    });

    main.addEventListener('pointerleave', resetPointer);

    const visibilityObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            const entry = entries[0];
            state.visible = !!entry?.isIntersecting;

            if (state.visible) {
                start();
            } else {
                stop();
            }
        }, {
            threshold: 0.04
        })
        : null;

    if (visibilityObserver) {
        visibilityObserver.observe(main);
    }

    const resizeObserver = 'ResizeObserver' in window
        ? new ResizeObserver(() => syncCanvasSize())
        : null;

    if (resizeObserver) {
        resizeObserver.observe(layer);
    }

    const onModeChange = () => {
        resetPointer();
        syncCanvasSize();
        stop();
        start();
    };

    if (mobileQuery) {
        if (typeof mobileQuery.addEventListener === 'function') {
            mobileQuery.addEventListener('change', onModeChange);
        } else if (typeof mobileQuery.addListener === 'function') {
            mobileQuery.addListener(onModeChange);
        }
    }

    if (reducedMotionQuery) {
        if (typeof reducedMotionQuery.addEventListener === 'function') {
            reducedMotionQuery.addEventListener('change', onModeChange);
        } else if (typeof reducedMotionQuery.addListener === 'function') {
            reducedMotionQuery.addListener(onModeChange);
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
            return;
        }

        start();
    });

    window.addEventListener('resize', syncCanvasSize, { passive: true });
    window.addEventListener('load', syncCanvasSize, { once: true });

    syncCanvasSize();
    setLayerVariables();
    start();
})();

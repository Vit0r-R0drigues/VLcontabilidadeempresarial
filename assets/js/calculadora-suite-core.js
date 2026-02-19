(function () {
    const suite = window.CalculadoraSuite || {};
    const calcUI = window.CalculadoraUI || null;
    const STORAGE_PREFIX = 'vl_suite_calculadora_v1_';
    const H = suite.helpers;

    if (!H) return;

    const state = {
        current: null,
        chartRef: null
    };

    const el = {};

    function mapElements() {
        [
            'calcTitle',
            'calcDescription',
            'calcBadges',
            'dynamicFields',
            'calcular',
            'exemploValores',
            'progressBar',
            'stepsContainer',
            'resultSection',
            'emptyState',
            'highlightLabel',
            'highlightValue',
            'secondaryLabelA',
            'secondaryValueA',
            'secondaryLabelB',
            'secondaryValueB',
            'notesList',
            'chartWrap',
            'graficoResultados',
            'ctaEspecialista',
            'verDetalhes',
            'tabelaDetalhes',
            'detailBlocks'
        ].forEach((id) => {
            el[id] = document.getElementById(id);
        });
    }

    function getCalculatorId() {
        const params = new URLSearchParams(window.location.search);
        const requested = (params.get('calc') || '').trim();
        if (!requested) return '';
        return requested;
    }

    function setProgress(value) {
        if (!el.progressBar) return;
        if (calcUI && typeof calcUI.updateProgress === 'function') {
            calcUI.updateProgress(el.progressBar, value);
            return;
        }
        el.progressBar.style.width = `${value}%`;
    }

    function metricToText(metric) {
        if (!metric) return '-';
        if (metric.type === 'currency') return H.formatCurrency(metric.value);
        if (metric.type === 'percent') return H.formatPercent(metric.value);
        if (metric.type === 'number') return `${H.formatNumber(metric.value, 2)}${metric.suffix || ''}`;
        return String(metric.value || '-');
    }

    function renderMetricValue(target, metric) {
        if (!target || !metric) return;
        if (metric.type === 'currency' && calcUI && typeof calcUI.animateCurrency === 'function') {
            calcUI.animateCurrency(target, metric.value);
            return;
        }
        if (metric.type === 'percent' && calcUI && typeof calcUI.animatePercent === 'function') {
            calcUI.animatePercent(target, metric.value);
            return;
        }
        target.textContent = metricToText(metric);
        if (calcUI && typeof calcUI.pulseElement === 'function') {
            calcUI.pulseElement(target);
        }
    }

    function renderBadges(badges) {
        if (!el.calcBadges) return;
        el.calcBadges.innerHTML = '';
        (badges || []).forEach((badge) => {
            const span = document.createElement('span');
            span.className = 'calc-info-badge';
            span.textContent = badge;
            el.calcBadges.appendChild(span);
        });
    }

    function applyMeta(definition) {
        if (!definition) return;
        if (el.calcTitle) el.calcTitle.textContent = definition.pageTitle;
        if (el.calcDescription) el.calcDescription.textContent = definition.pageDescription;
        renderBadges(definition.badges);
        if (el.calcular) el.calcular.textContent = definition.calculateLabel || 'Calcular';
        document.title = `${definition.pageTitle} - VL Contabilidade`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) metaDescription.setAttribute('content', definition.pageDescription);
    }

    function buildField(field, value) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';

        if (field.type === 'checkbox') {
            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'checkbox-container';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = field.id;
            input.checked = value !== undefined ? !!value : !!field.checked;
            checkboxLabel.appendChild(input);
            checkboxLabel.appendChild(document.createTextNode(` ${field.label}`));
            wrapper.appendChild(checkboxLabel);
        } else {
            const label = document.createElement('label');
            label.setAttribute('for', field.id);
            label.textContent = field.label;
            wrapper.appendChild(label);

            if (field.type === 'select') {
                const select = document.createElement('select');
                select.id = field.id;
                (field.options || []).forEach((option) => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    select.appendChild(opt);
                });
                if (value !== undefined && value !== null && value !== '') {
                    select.value = String(value);
                } else if ((field.options || [])[0]) {
                    select.value = String(field.options[0].value);
                }
                wrapper.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.id = field.id;
                input.type = field.type === 'range' ? 'range' : 'number';
                if (field.min !== undefined) input.min = String(field.min);
                if (field.max !== undefined) input.max = String(field.max);
                if (field.step !== undefined) input.step = String(field.step);
                if (field.placeholder) input.placeholder = field.placeholder;
                if (value !== undefined && value !== null && value !== '') {
                    input.value = String(value);
                } else if (field.value !== undefined) {
                    input.value = String(field.value);
                }
                wrapper.appendChild(input);

                if (field.type === 'range') {
                    const output = document.createElement('span');
                    output.className = 'suite-range-output';
                    output.id = `${field.id}Output`;
                    output.textContent = `${input.value || field.value || 0}${field.outputSuffix || ''}`;
                    wrapper.appendChild(output);
                    input.addEventListener('input', () => {
                        output.textContent = `${input.value}${field.outputSuffix || ''}`;
                    });
                }
            }
        }

        if (field.help) {
            const help = document.createElement('small');
            help.className = 'suite-field-help';
            help.textContent = field.help;
            wrapper.appendChild(help);
        }

        return wrapper;
    }

    function getSavedValues(definition) {
        try {
            const raw = localStorage.getItem(`${STORAGE_PREFIX}${definition.id}`);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function saveValues(definition, values) {
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${definition.id}`, JSON.stringify(values));
        } catch (error) {
            // noop
        }
    }

    function renderFields(definition) {
        if (!el.dynamicFields) return;
        const saved = getSavedValues(definition);
        el.dynamicFields.innerHTML = '';
        definition.fields.forEach((field) => {
            el.dynamicFields.appendChild(buildField(field, saved[field.id]));
        });
    }

    function collectValues(definition) {
        const values = {};
        definition.fields.forEach((field) => {
            const input = document.getElementById(field.id);
            if (!input) {
                values[field.id] = field.type === 'checkbox' ? false : 0;
                return;
            }
            if (field.type === 'checkbox') {
                values[field.id] = !!input.checked;
                return;
            }
            if (field.type === 'select') {
                values[field.id] = input.value;
                return;
            }
            values[field.id] = H.toNumber(input.value);
        });
        return values;
    }

    function applyExample(definition) {
        const sample = definition.example || {};
        definition.fields.forEach((field) => {
            const input = document.getElementById(field.id);
            if (!input || sample[field.id] === undefined) return;
            if (field.type === 'checkbox') {
                input.checked = !!sample[field.id];
            } else {
                input.value = String(sample[field.id]);
            }
            if (field.type === 'range') {
                const output = document.getElementById(`${field.id}Output`);
                if (output) output.textContent = `${input.value}${field.outputSuffix || ''}`;
            }
        });
    }

    function renderSteps(steps) {
        if (!el.stepsContainer) return;
        const list = Array.isArray(steps) && steps.length > 0 ? steps : ['Coleta de dados.', 'Aplicacao das formulas.', 'Leitura do resultado final.'];
        el.stepsContainer.innerHTML = '';
        list.forEach((stepText, index) => {
            const step = document.createElement('div');
            step.className = 'step';
            step.innerHTML = `
                <div class="step-number">${index + 1}</div>
                <div class="step-content"><p>${stepText}</p></div>
            `;
            el.stepsContainer.appendChild(step);
        });
    }

    function renderNotes(notes) {
        if (!el.notesList) return;
        el.notesList.innerHTML = '';
        (notes || []).forEach((note) => {
            const item = document.createElement('div');
            item.className = 'result-note-item';
            item.innerHTML = `<strong>${note.label}:</strong> <span>${metricToText(note.metric)}</span>`;
            el.notesList.appendChild(item);
        });
    }

    function renderDetails(details) {
        if (!el.detailBlocks) return;
        el.detailBlocks.innerHTML = '';
        (details || []).forEach((detail) => {
            const block = document.createElement('article');
            block.className = 'suite-detail-item';
            block.innerHTML = `<h4>${detail.label}</h4><p>${detail.value}</p>`;
            el.detailBlocks.appendChild(block);
        });
    }

    function renderChart(chart) {
        if (!el.chartWrap || !el.graficoResultados) return;
        if (!chart || !Array.isArray(chart.values) || chart.values.length === 0) {
            el.chartWrap.style.display = 'none';
            if (state.chartRef) {
                state.chartRef.destroy();
                state.chartRef = null;
            }
            return;
        }

        el.chartWrap.style.display = 'block';
        const ctx = el.graficoResultados.getContext('2d');
        if (state.chartRef) state.chartRef.destroy();

        state.chartRef = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chart.labels,
                datasets: [{
                    data: chart.values.map((item) => Math.max(0, H.toNumber(item))),
                    backgroundColor: chart.colors || ['#0a7dd1', '#0f766e', '#d46d13', '#64748b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#334155' }
                    }
                }
            }
        });
    }

    function showResults() {
        if (!el.resultSection) return;
        el.resultSection.classList.remove('suite-hidden');
        el.resultSection.style.display = 'block';
    }

    function focusResults() {
        if (!el.resultSection) return;
        if (calcUI && typeof calcUI.focusResults === 'function') {
            calcUI.focusResults(el.resultSection);
            return;
        }
        el.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderResult(result) {
        showResults();
        if (el.highlightLabel) el.highlightLabel.textContent = result.highlight.label;
        if (el.secondaryLabelA) el.secondaryLabelA.textContent = result.secondaryA.label;
        if (el.secondaryLabelB) el.secondaryLabelB.textContent = result.secondaryB.label;
        renderMetricValue(el.highlightValue, result.highlight);
        renderMetricValue(el.secondaryValueA, result.secondaryA);
        renderMetricValue(el.secondaryValueB, result.secondaryB);
        renderNotes(result.notes);
        renderSteps(result.steps);
        renderDetails(result.details);
        renderChart(result.chart);
        if (el.ctaEspecialista) {
            el.ctaEspecialista.textContent = 'Fale com um especialista e analise seu caso';
            el.ctaEspecialista.href = state.current.ctaHref || 'contatos.html';
        }
    }

    function runCalculation(focus = false) {
        if (!state.current) return;
        const values = collectValues(state.current);
        const errorMessage = state.current.validate ? state.current.validate(values) : '';
        if (errorMessage) {
            alert(errorMessage);
            return;
        }

        setProgress(20);
        const result = state.current.compute(values);
        setProgress(65);
        renderResult(result);
        setProgress(100);
        saveValues(state.current, values);
        if (focus) focusResults();
    }

    function bindEvents() {
        if (el.calcular) {
            el.calcular.addEventListener('click', () => runCalculation(true));
        }
        if (el.exemploValores) {
            el.exemploValores.addEventListener('click', () => {
                if (!state.current) return;
                applyExample(state.current);
                runCalculation(true);
            });
        }
        if (el.verDetalhes && el.tabelaDetalhes) {
            el.verDetalhes.addEventListener('click', () => {
                const isHidden = el.tabelaDetalhes.style.display === 'none';
                el.tabelaDetalhes.style.display = isHidden ? 'block' : 'none';
                const icon = el.verDetalhes.querySelector('i');
                if (icon) icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            });
        }
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            if (!state.current) return;
            if (event.target && event.target.tagName === 'SELECT') return;
            event.preventDefault();
            runCalculation(true);
        });
    }

    function showEmptyState() {
        if (el.emptyState) el.emptyState.style.display = 'block';
        if (el.resultSection) el.resultSection.style.display = 'none';
        if (el.dynamicFields) el.dynamicFields.innerHTML = '';
        if (el.calcular) el.calcular.disabled = true;
        if (el.exemploValores) el.exemploValores.disabled = true;
    }

    function hideEmptyState() {
        if (el.emptyState) el.emptyState.style.display = 'none';
        if (el.calcular) el.calcular.disabled = false;
        if (el.exemploValores) el.exemploValores.disabled = false;
    }

    function boot() {
        mapElements();
        bindEvents();

        const calculatorId = getCalculatorId();
        const definition = suite.definitions ? suite.definitions[calculatorId] : null;

        if (!definition) {
            showEmptyState();
            return;
        }

        hideEmptyState();
        state.current = definition;
        applyMeta(state.current);
        renderFields(state.current);

        if (el.resultSection) {
            el.resultSection.classList.add('suite-hidden');
            el.resultSection.style.display = 'none';
        }
        if (el.tabelaDetalhes) {
            el.tabelaDetalhes.style.display = 'none';
        }
        setProgress(0);
    }

    document.addEventListener('DOMContentLoaded', boot);
})();

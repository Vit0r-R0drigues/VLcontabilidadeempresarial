(function () {
    const suite = window.CalculadoraSuite || {};
    suite.definitions = suite.definitions || {};

    suite.registerDefinition = function registerDefinition(id, definition) {
        if (!id || !definition) return;
        suite.definitions[id] = {
            id,
            ...definition
        };
    };

    const config = {
        descontoSimplificado: 607.20,
        deducaoDependente: 189.59,
        reducaoMaxima: 312.89,
        faixaReducaoAte: 5000.0,
        faixaReducaoFim: 7350.0,
        reducaoCoeficienteA: 978.62,
        reducaoCoeficienteB: 0.133145,
        faixasIRRF: [
            { limite: 2428.80, aliquota: 0.0, deducao: 0.0 },
            { limite: 2826.65, aliquota: 0.075, deducao: 182.16 },
            { limite: 3751.05, aliquota: 0.15, deducao: 394.16 },
            { limite: 4664.68, aliquota: 0.225, deducao: 675.49 },
            { limite: Infinity, aliquota: 0.275, deducao: 908.73 }
        ],
        faixasINSS: [
            { limite: 1621.00, aliquota: 0.075 },
            { limite: 2902.84, aliquota: 0.09 },
            { limite: 4354.27, aliquota: 0.12 },
            { limite: 8475.55, aliquota: 0.14 }
        ],
        simples: {
            I: [
                { limite: 180000, aliquota: 0.04, deducao: 0 },
                { limite: 360000, aliquota: 0.073, deducao: 5940 },
                { limite: 720000, aliquota: 0.095, deducao: 13860 },
                { limite: 1800000, aliquota: 0.107, deducao: 22500 },
                { limite: 3600000, aliquota: 0.143, deducao: 87300 },
                { limite: 4800000, aliquota: 0.19, deducao: 378000 }
            ],
            II: [
                { limite: 180000, aliquota: 0.045, deducao: 0 },
                { limite: 360000, aliquota: 0.078, deducao: 5940 },
                { limite: 720000, aliquota: 0.1, deducao: 13860 },
                { limite: 1800000, aliquota: 0.112, deducao: 22500 },
                { limite: 3600000, aliquota: 0.147, deducao: 85500 },
                { limite: 4800000, aliquota: 0.3, deducao: 720000 }
            ],
            III: [
                { limite: 180000, aliquota: 0.06, deducao: 0 },
                { limite: 360000, aliquota: 0.112, deducao: 9360 },
                { limite: 720000, aliquota: 0.135, deducao: 17640 },
                { limite: 1800000, aliquota: 0.16, deducao: 35640 },
                { limite: 3600000, aliquota: 0.21, deducao: 125640 },
                { limite: 4800000, aliquota: 0.33, deducao: 648000 }
            ],
            IV: [
                { limite: 180000, aliquota: 0.045, deducao: 0 },
                { limite: 360000, aliquota: 0.09, deducao: 8100 },
                { limite: 720000, aliquota: 0.102, deducao: 12420 },
                { limite: 1800000, aliquota: 0.14, deducao: 39780 },
                { limite: 3600000, aliquota: 0.22, deducao: 183780 },
                { limite: 4800000, aliquota: 0.33, deducao: 828000 }
            ],
            V: [
                { limite: 180000, aliquota: 0.155, deducao: 0 },
                { limite: 360000, aliquota: 0.18, deducao: 4500 },
                { limite: 720000, aliquota: 0.195, deducao: 9900 },
                { limite: 1800000, aliquota: 0.205, deducao: 17100 },
                { limite: 3600000, aliquota: 0.23, deducao: 62100 },
                { limite: 4800000, aliquota: 0.305, deducao: 540000 }
            ]
        }
    };

    function round2(value) {
        return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
    }

    function toNumber(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(Number(value || 0), min), max);
    }

    function formatCurrency(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function formatPercent(value) {
        return `${Number(value || 0).toFixed(2).replace('.', ',')}%`;
    }

    function formatNumber(value, decimals = 2) {
        return Number(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function metricCurrency(label, value) {
        return { label, type: 'currency', value: round2(value) };
    }

    function metricPercent(label, value) {
        return { label, type: 'percent', value: round2(value) };
    }

    function metricNumber(label, value, suffix = '') {
        return { label, type: 'number', value: round2(value), suffix };
    }

    function metricText(label, value) {
        return { label, type: 'text', value: String(value || '-') };
    }

    function calcularINSS(base) {
        const salario = Math.max(0, toNumber(base));
        let total = 0;
        let faixaAnterior = 0;

        config.faixasINSS.forEach((faixa) => {
            if (salario <= faixaAnterior) return;
            const baseFaixa = Math.min(salario, faixa.limite) - faixaAnterior;
            total += baseFaixa * faixa.aliquota;
            faixaAnterior = faixa.limite;
        });

        return round2(total);
    }

    function calcularIRRF(baseCalculo, rendimentoBruto) {
        const base = Math.max(0, toNumber(baseCalculo));
        const rendimento = Math.max(0, toNumber(rendimentoBruto));
        const faixa = config.faixasIRRF.find((item) => base <= item.limite) || config.faixasIRRF[0];

        const impostoBruto = Math.max(0, base * faixa.aliquota - faixa.deducao);
        let reducaoTeorica = 0;

        if (rendimento <= config.faixaReducaoAte) {
            reducaoTeorica = config.reducaoMaxima;
        } else if (rendimento <= config.faixaReducaoFim) {
            reducaoTeorica = config.reducaoCoeficienteA - (config.reducaoCoeficienteB * rendimento);
        }

        const reducao = Math.min(impostoBruto, Math.max(0, reducaoTeorica));
        const impostoFinal = Math.max(0, impostoBruto - reducao);

        return {
            impostoBruto: round2(impostoBruto),
            reducao: round2(reducao),
            impostoFinal: round2(impostoFinal)
        };
    }

    function obterFaixaSimples(anexo, rbt12) {
        const tabela = config.simples[anexo] || config.simples.III;
        const receita = Math.max(0, toNumber(rbt12));
        return tabela.find((faixa) => receita <= faixa.limite) || tabela[tabela.length - 1];
    }

    function calcularAliquotaEfetivaSimples(anexo, rbt12) {
        const receita = Math.max(0, toNumber(rbt12));
        const faixa = obterFaixaSimples(anexo, receita);
        if (receita <= 0) {
            return { faixa, aliquotaEfetiva: 0 };
        }
        const aliquotaEfetiva = ((receita * faixa.aliquota) - faixa.deducao) / receita;
        return {
            faixa,
            aliquotaEfetiva: Math.max(0, aliquotaEfetiva)
        };
    }

    function simOuNaoOptions() {
        return [
            { value: 'sim', label: 'Sim' },
            { value: 'nao', label: 'Nao' }
        ];
    }

    function diagnosticoOptions() {
        return [
            { value: '2', label: 'Sempre' },
            { value: '1', label: 'As vezes' },
            { value: '0', label: 'Nunca' }
        ];
    }

    suite.helpers = {
        config,
        round2,
        toNumber,
        clamp,
        formatCurrency,
        formatPercent,
        formatNumber,
        metricCurrency,
        metricPercent,
        metricNumber,
        metricText,
        calcularINSS,
        calcularIRRF,
        obterFaixaSimples,
        calcularAliquotaEfetivaSimples,
        simOuNaoOptions,
        diagnosticoOptions
    };

    window.CalculadoraSuite = suite;
})();

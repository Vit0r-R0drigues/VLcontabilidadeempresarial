(function () {
    const suite = window.CalculadoraSuite || {};
    const H = suite.helpers;
    if (!suite.registerDefinition || !H) return;

    suite.registerDefinition('decimo-terceiro', {
        pageTitle: 'Calculadora de 13o Salario',
        pageDescription: 'Simule 13o salario com meses trabalhados, adiantamento e descontos estimados.',
        badges: ['Trabalhista', '13o', 'Folha'],
        calculateLabel: 'Calcular 13o salario',
        fields: [
            { id: 'salarioBruto', type: 'number', label: 'Salario base mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            {
                id: 'mesesTrabalhados',
                type: 'select',
                label: 'Meses trabalhados no ano',
                options: [
                    { value: '1', label: '1 mes' }, { value: '2', label: '2 meses' }, { value: '3', label: '3 meses' },
                    { value: '4', label: '4 meses' }, { value: '5', label: '5 meses' }, { value: '6', label: '6 meses' },
                    { value: '7', label: '7 meses' }, { value: '8', label: '8 meses' }, { value: '9', label: '9 meses' },
                    { value: '10', label: '10 meses' }, { value: '11', label: '11 meses' }, { value: '12', label: '12 meses' }
                ]
            },
            {
                id: 'percentualAdiantamento',
                type: 'range',
                label: 'Percentual da 1a parcela',
                min: 30,
                max: 50,
                step: 1,
                value: 50,
                outputSuffix: '%'
            },
            { id: 'dependentes', type: 'number', label: 'Dependentes para IRRF', min: 0, step: '1' }
        ],
        example: {
            salarioBruto: 4500,
            mesesTrabalhados: '12',
            percentualAdiantamento: 50,
            dependentes: 1
        },
        validate(values) {
            if (values.salarioBruto <= 0) return 'Informe o salario base para a simulacao do 13o.';
            return '';
        },
        compute(values) {
            const decimo = H.calcularDecimoTerceiroLiquido({
                salarioBase: values.salarioBruto,
                mesesTrabalhados: values.mesesTrabalhados,
                percentualAdiantamento: values.percentualAdiantamento,
                dependentes: values.dependentes
            });

            return {
                highlight: H.metricCurrency('2a parcela liquida estimada', decimo.segundaParcelaLiquida),
                secondaryA: H.metricCurrency('1a parcela', decimo.primeiraParcela),
                secondaryB: H.metricCurrency('13o liquido total', decimo.liquidoTotal),
                notes: [
                    { label: 'INSS no 13o', metric: H.metricCurrency('INSS', decimo.inss) },
                    { label: 'IRRF no 13o', metric: H.metricCurrency('IRRF', decimo.irrf.impostoFinal) },
                    { label: 'Valor bruto do 13o', metric: H.metricCurrency('Bruto', decimo.bruto13) }
                ],
                steps: [
                    'Apuracao do 13o proporcional por avos.',
                    'Calculo da primeira parcela conforme percentual escolhido.',
                    'Descontos na segunda parcela e exibicao do liquido.'
                ],
                details: [
                    { label: 'Avos considerados', value: `${decimo.avos}/12` },
                    { label: 'Valor bruto do 13o', value: H.formatCurrency(decimo.bruto13) },
                    { label: 'Dependentes', value: `${values.dependentes} dependente(s)` },
                    { label: 'Percentual da 1a parcela', value: H.formatPercent(values.percentualAdiantamento) }
                ],
                chart: {
                    labels: ['1a parcela', '2a parcela liquida', 'Descontos'],
                    values: [
                        H.round2(decimo.primeiraParcela),
                        H.round2(decimo.segundaParcelaLiquida),
                        H.round2(decimo.inss + decimo.irrf.impostoFinal)
                    ],
                    colors: ['#0a7dd1', '#0f766e', '#d46d13']
                }
            };
        }
    });

    suite.registerDefinition('custo-funcionario', {
        pageTitle: 'Calculadora de Custo Real do Funcionario',
        pageDescription: 'Calcule custo total mensal de um colaborador com encargos e beneficios.',
        badges: ['DP', 'Encargos', 'Gestao de equipe'],
        calculateLabel: 'Calcular custo real',
        fields: [
            { id: 'salarioBase', type: 'number', label: 'Salario base mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'beneficios', type: 'number', label: 'Beneficios fixos (VR/VA, auxilios)', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'valeTransporte', type: 'number', label: 'Custo mensal de vale transporte', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'planoSaude', type: 'number', label: 'Custo mensal de plano de saude', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'outrosBeneficios', type: 'number', label: 'Outros custos de beneficios', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'incluirProvisoes', type: 'checkbox', label: 'Incluir provisoes de 13o + ferias + 1/3', checked: true }
        ],
        example: {
            salarioBase: 3800,
            beneficios: 680,
            valeTransporte: 240,
            planoSaude: 320,
            outrosBeneficios: 120,
            incluirProvisoes: true
        },
        validate(values) {
            if (values.salarioBase <= 0) return 'Informe o salario base do funcionario.';
            return '';
        },
        compute(values) {
            const fgts = values.salarioBase * 0.08;
            const inssPatronal = values.salarioBase * 0.20;
            const ratTerceiros = values.salarioBase * 0.068;
            const encargos = fgts + inssPatronal + ratTerceiros;

            const beneficiosTotal = values.beneficios + values.valeTransporte + values.planoSaude + values.outrosBeneficios;
            const provisoes = values.incluirProvisoes
                ? ((values.salarioBase / 12) + (values.salarioBase / 12) + (values.salarioBase / 36))
                : 0;

            const custoTotal = values.salarioBase + encargos + beneficiosTotal + provisoes;
            const indiceCusto = values.salarioBase > 0 ? (custoTotal / values.salarioBase) * 100 : 0;
            const custoAnual = custoTotal * 12;
            const blocoFixosEquipe = encargos + provisoes;

            return {
                highlight: H.metricCurrency('Custo total mensal', custoTotal),
                secondaryA: H.metricCurrency('Encargos + provisoes', blocoFixosEquipe),
                secondaryB: H.metricCurrency('Custo anual estimado', custoAnual),
                notes: [
                    { label: 'FGTS estimado', metric: H.metricCurrency('FGTS', fgts) },
                    { label: 'Beneficios totais', metric: H.metricCurrency('Beneficios', beneficiosTotal) },
                    { label: 'Provisoes', metric: H.metricCurrency('Provisoes', provisoes) },
                    { label: 'Indice sobre salario', metric: H.metricPercent('Indice', indiceCusto) }
                ],
                steps: [
                    'Soma do salario base e encargos patronais.',
                    'Adicao dos beneficios recorrentes.',
                    'Inclusao opcional de provisoes anuais mensalizadas.'
                ],
                details: [
                    { label: 'INSS patronal (20%)', value: H.formatCurrency(inssPatronal) },
                    { label: 'RAT + terceiros (6,8%)', value: H.formatCurrency(ratTerceiros) },
                    { label: 'Salario base', value: H.formatCurrency(values.salarioBase) },
                    { label: 'Modelo com provisoes', value: values.incluirProvisoes ? 'Sim' : 'Nao' },
                    { label: 'Custo sobre salario', value: H.formatPercent(indiceCusto) }
                ],
                chart: {
                    labels: ['Salario base', 'Encargos', 'Beneficios', 'Provisoes'],
                    values: [H.round2(values.salarioBase), H.round2(encargos), H.round2(beneficiosTotal), H.round2(provisoes)],
                    colors: ['#0a7dd1', '#d46d13', '#0f766e', '#64748b']
                }
            };
        }
    });
})();

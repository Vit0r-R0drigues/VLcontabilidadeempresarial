(function () {
    const suite = window.CalculadoraSuite || {};
    const H = suite.helpers;
    if (!suite.registerDefinition || !H) return;

    suite.registerDefinition('simples-nacional', {
        pageTitle: 'Simulador de Simples Nacional por Faturamento',
        pageDescription: 'Estime aliquota efetiva e DAS mensal com base no faturamento e anexo do Simples Nacional.',
        badges: ['Tributario', 'DAS mensal', 'Comparativo rapido'],
        calculateLabel: 'Calcular Simples Nacional',
        fields: [
            {
                id: 'rbt12',
                type: 'number',
                label: 'Faturamento acumulado em 12 meses (RBT12)',
                placeholder: 'R$ 0,00',
                min: 0,
                step: '0.01',
                help: 'Use o acumulado real dos ultimos 12 meses.'
            },
            {
                id: 'receitaMes',
                type: 'number',
                label: 'Faturamento do mes atual',
                placeholder: 'R$ 0,00',
                min: 0,
                step: '0.01'
            },
            {
                id: 'anexo',
                type: 'select',
                label: 'Anexo principal',
                options: [
                    { value: 'I', label: 'Anexo I - Comercio' },
                    { value: 'II', label: 'Anexo II - Industria' },
                    { value: 'III', label: 'Anexo III - Servicos' },
                    { value: 'IV', label: 'Anexo IV - Servicos especificos' },
                    { value: 'V', label: 'Anexo V - Servicos intelectuais' }
                ]
            },
            {
                id: 'folha12',
                type: 'number',
                label: 'Folha dos ultimos 12 meses (opcional)',
                placeholder: 'R$ 0,00',
                min: 0,
                step: '0.01',
                help: 'Ajuda na leitura do Fator R para anexos III e V.'
            }
        ],
        example: {
            rbt12: 960000,
            receitaMes: 78000,
            anexo: 'III',
            folha12: 310000
        },
        validate(values) {
            if (values.rbt12 <= 0) return 'Informe o faturamento acumulado de 12 meses.';
            if (values.receitaMes <= 0) return 'Informe o faturamento do mes para estimar o DAS.';
            return '';
        },
        compute(values) {
            const simples = H.calcularAliquotaEfetivaSimples(values.anexo, values.rbt12);
            const dasMes = values.receitaMes * simples.aliquotaEfetiva;
            const cargaAnual = dasMes * 12;
            const receitaPosDAS = Math.max(0, values.receitaMes - dasMes);
            const fatorR = values.folha12 > 0 ? (values.folha12 / values.rbt12) : 0;
            const leituraFatorR = values.folha12 > 0
                ? (fatorR >= 0.28 ? 'Fator R acima de 28%: tende a favorecer anexo III.' : 'Fator R abaixo de 28%: revisar enquadramento de servicos.')
                : 'Informe a folha anual para analisar Fator R.';

            return {
                highlight: H.metricCurrency('DAS estimado no mes', dasMes),
                secondaryA: H.metricPercent('Aliquota efetiva', simples.aliquotaEfetiva * 100),
                secondaryB: H.metricCurrency('Carga anual estimada', cargaAnual),
                notes: [
                    { label: 'Faixa aplicada', metric: H.metricText('Faixa', `Ate ${H.formatCurrency(simples.faixa.limite)} | nominal ${H.formatPercent(simples.faixa.aliquota * 100)}`) },
                    { label: 'Parcela a deduzir', metric: H.metricCurrency('Parcela', simples.faixa.deducao) },
                    { label: 'Fator R', metric: H.metricText('Leitura', leituraFatorR) }
                ],
                steps: [
                    `Classificacao por faixa do anexo ${values.anexo}.`,
                    'Calculo da aliquota efetiva com parcela a deduzir.',
                    'Estimativa do DAS mensal e impacto anual.'
                ],
                details: [
                    { label: 'Receita do mes', value: H.formatCurrency(values.receitaMes) },
                    { label: 'Receita liquida apos DAS', value: H.formatCurrency(receitaPosDAS) },
                    { label: 'Aliquota nominal da faixa', value: H.formatPercent(simples.faixa.aliquota * 100) },
                    { label: 'Aliquota efetiva usada', value: H.formatPercent(simples.aliquotaEfetiva * 100) }
                ],
                chart: {
                    labels: ['DAS estimado', 'Receita apos DAS'],
                    values: [H.round2(dasMes), H.round2(receitaPosDAS)],
                    colors: ['#d46d13', '#0f766e']
                }
            };
        }
    });

    suite.registerDefinition('inss-irrf-estimado', {
        pageTitle: 'Simulador de INSS e IRRF Estimado',
        pageDescription: 'Calcule descontos previdenciarios e imposto de renda retido na fonte com parametros mensais.',
        badges: ['Folha', 'INSS', 'IRRF'],
        calculateLabel: 'Calcular INSS e IRRF',
        fields: [
            { id: 'rendimentoBruto', type: 'number', label: 'Rendimento bruto mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'dependentes', type: 'number', label: 'Dependentes para IRRF', min: 0, step: '1' },
            { id: 'pensao', type: 'number', label: 'Pensao alimenticia dedutivel', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'outrasDeducoes', type: 'number', label: 'Outras deducoes legais', placeholder: 'R$ 0,00', min: 0, step: '0.01' }
        ],
        example: {
            rendimentoBruto: 6200,
            dependentes: 1,
            pensao: 0,
            outrasDeducoes: 200
        },
        validate(values) {
            if (values.rendimentoBruto <= 0) return 'Informe o rendimento bruto para calcular os descontos.';
            return '';
        },
        compute(values) {
            const inss = H.calcularINSS(values.rendimentoBruto);
            const dedDependentes = values.dependentes * H.config.deducaoDependente;
            const deducoesLegais = inss + dedDependentes + values.pensao + values.outrasDeducoes;
            const deducaoAplicada = Math.max(deducoesLegais, H.config.descontoSimplificado);
            const baseIRRF = Math.max(0, values.rendimentoBruto - deducaoAplicada);
            const irrf = H.calcularIRRF(baseIRRF, values.rendimentoBruto);
            const liquido = values.rendimentoBruto - inss - irrf.impostoFinal - values.pensao - values.outrasDeducoes;

            return {
                highlight: H.metricCurrency('Liquido estimado', liquido),
                secondaryA: H.metricCurrency('INSS estimado', inss),
                secondaryB: H.metricCurrency('IRRF estimado', irrf.impostoFinal),
                notes: [
                    { label: 'Base de calculo IRRF', metric: H.metricCurrency('Base', baseIRRF) },
                    { label: 'Reducao legal aplicada', metric: H.metricCurrency('Reducao', irrf.reducao) },
                    { label: 'Deducao considerada', metric: H.metricCurrency('Deducao', deducaoAplicada) }
                ],
                steps: [
                    'Calculo do INSS progressivo por faixas.',
                    'Comparacao entre deducoes legais e desconto simplificado.',
                    'Aplicacao da tabela de IRRF e exibicao do liquido.'
                ],
                details: [
                    { label: 'Rendimento bruto', value: H.formatCurrency(values.rendimentoBruto) },
                    { label: 'Dependentes', value: `${values.dependentes} dependente(s)` },
                    { label: 'Pensao dedutivel', value: H.formatCurrency(values.pensao) },
                    { label: 'Outras deducoes', value: H.formatCurrency(values.outrasDeducoes) }
                ],
                chart: {
                    labels: ['Liquido', 'INSS', 'IRRF', 'Outras deducoes'],
                    values: [
                        H.round2(Math.max(0, liquido)),
                        H.round2(inss),
                        H.round2(irrf.impostoFinal),
                        H.round2(values.pensao + values.outrasDeducoes)
                    ],
                    colors: ['#0f766e', '#0a7dd1', '#d46d13', '#64748b']
                }
            };
        }
    });

    suite.registerDefinition('limite-mei', {
        pageTitle: 'Calculadora de Limite MEI e Projecao',
        pageDescription: 'Projete o faturamento anual do MEI e identifique risco de desenquadramento com antecedencia.',
        badges: ['MEI', 'Limite anual', 'Projecao'],
        calculateLabel: 'Calcular limite MEI',
        fields: [
            { id: 'faturamentoAcumulado', type: 'number', label: 'Faturamento acumulado no ano', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            {
                id: 'mesesDecorridos',
                type: 'select',
                label: 'Meses ja encerrados no ano',
                options: [
                    { value: '1', label: '1 mes' }, { value: '2', label: '2 meses' }, { value: '3', label: '3 meses' },
                    { value: '4', label: '4 meses' }, { value: '5', label: '5 meses' }, { value: '6', label: '6 meses' },
                    { value: '7', label: '7 meses' }, { value: '8', label: '8 meses' }, { value: '9', label: '9 meses' },
                    { value: '10', label: '10 meses' }, { value: '11', label: '11 meses' }, { value: '12', label: '12 meses' }
                ]
            },
            { id: 'mediaMensal', type: 'number', label: 'Projecao de faturamento mensal para os proximos meses', placeholder: 'R$ 0,00', min: 0, step: '0.01' }
        ],
        example: {
            faturamentoAcumulado: 56000,
            mesesDecorridos: '8',
            mediaMensal: 7600
        },
        validate() {
            return '';
        },
        compute(values) {
            const limiteAnual = 81000;
            const mesesDecorridos = H.clamp(values.mesesDecorridos, 1, 12);
            const limiteProporcional = (limiteAnual / 12) * mesesDecorridos;
            const mesesRestantes = 12 - mesesDecorridos;
            const projecaoAnual = values.faturamentoAcumulado + (values.mediaMensal * mesesRestantes);
            const excessoProjetado = Math.max(0, projecaoAnual - limiteAnual);
            const excessoPercentual = limiteAnual > 0 ? (projecaoAnual / limiteAnual - 1) * 100 : 0;

            let status = 'Dentro do limite do MEI.';
            if (projecaoAnual > 97200) {
                status = 'Acima de 20% do limite. Risco alto de desenquadramento retroativo.';
            } else if (projecaoAnual > limiteAnual) {
                status = 'Excesso de ate 20% do limite. Planeje migracao para evitar surpresa.';
            }

            return {
                highlight: H.metricCurrency('Projecao anual', projecaoAnual),
                secondaryA: H.metricCurrency('Limite anual MEI', limiteAnual),
                secondaryB: H.metricCurrency('Excesso projetado', excessoProjetado),
                notes: [
                    { label: 'Status', metric: H.metricText('Status', status) },
                    { label: 'Limite proporcional no ano', metric: H.metricCurrency('Proporcional', limiteProporcional) },
                    { label: 'Excesso percentual', metric: H.metricPercent('Excesso', Math.max(0, excessoPercentual)) }
                ],
                steps: [
                    'Calculo do limite proporcional conforme meses decorridos.',
                    'Projecao do faturamento restante ate dezembro.',
                    'Classificacao de risco de desenquadramento.'
                ],
                details: [
                    { label: 'Faturamento acumulado', value: H.formatCurrency(values.faturamentoAcumulado) },
                    { label: 'Meses restantes', value: `${mesesRestantes} mes(es)` },
                    { label: 'Media mensal projetada', value: H.formatCurrency(values.mediaMensal) },
                    { label: 'Faixa de alerta 20%', value: H.formatCurrency(97200) }
                ],
                chart: {
                    labels: ['Projecao anual', 'Limite MEI'],
                    values: [H.round2(projecaoAnual), limiteAnual],
                    colors: ['#0a7dd1', '#d46d13']
                }
            };
        }
    });

    suite.registerDefinition('mei-vs-simples', {
        pageTitle: 'Comparador MEI x Simples Nacional',
        pageDescription: 'Compare custo tributario estimado entre MEI e Simples Nacional para apoiar seu enquadramento.',
        badges: ['Comparativo', 'MEI', 'Simples'],
        calculateLabel: 'Comparar regimes',
        fields: [
            { id: 'faturamentoMensal', type: 'number', label: 'Faturamento medio mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            {
                id: 'atividade',
                type: 'select',
                label: 'Tipo principal de atividade',
                options: [
                    { value: 'comercio', label: 'Comercio' },
                    { value: 'servico', label: 'Servico' },
                    { value: 'misto', label: 'Comercio + Servico' }
                ]
            },
            {
                id: 'anexoSimples',
                type: 'select',
                label: 'Anexo estimado no Simples',
                options: [
                    { value: 'I', label: 'Anexo I' },
                    { value: 'III', label: 'Anexo III' },
                    { value: 'V', label: 'Anexo V' }
                ]
            }
        ],
        example: {
            faturamentoMensal: 9800,
            atividade: 'servico',
            anexoSimples: 'III'
        },
        validate(values) {
            if (values.faturamentoMensal <= 0) return 'Informe o faturamento mensal para comparar os regimes.';
            return '';
        },
        compute(values) {
            const inssMEI = 81.05;
            const adicionalMEI = values.atividade === 'servico' ? 5 : (values.atividade === 'misto' ? 6 : 1);
            const meiMensal = inssMEI + adicionalMEI;

            const rbt12 = values.faturamentoMensal * 12;
            const simples = H.calcularAliquotaEfetivaSimples(values.anexoSimples, rbt12);
            const simplesMensal = values.faturamentoMensal * simples.aliquotaEfetiva;

            const diferencaMensal = simplesMensal - meiMensal;
            const diferencaAnual = diferencaMensal * 12;
            const economiaAnual = Math.abs(diferencaAnual);
            const ultrapassaMEI = rbt12 > 81000;
            const regimeMaisEconomico = diferencaMensal > 0 ? 'MEI' : 'Simples';
            const mensagem = ultrapassaMEI
                ? 'Com este faturamento anual projetado, o limite do MEI pode ser ultrapassado.'
                : `No comparativo de tributos, ${regimeMaisEconomico} tende a ser mais economico.`;

            return {
                highlight: H.metricCurrency(
                    regimeMaisEconomico === 'MEI' ? 'Economia anual no MEI' : 'Economia anual no Simples',
                    economiaAnual
                ),
                secondaryA: H.metricCurrency('Tributo mensal MEI', meiMensal),
                secondaryB: H.metricCurrency('Tributo mensal Simples', simplesMensal),
                notes: [
                    { label: 'Leitura do enquadramento', metric: H.metricText('Status', mensagem) },
                    { label: 'Aliquota efetiva do Simples', metric: H.metricPercent('Aliquota', simples.aliquotaEfetiva * 100) },
                    { label: 'Faturamento anual projetado', metric: H.metricCurrency('RBT12', rbt12) },
                    { label: 'Parcela INSS do MEI', metric: H.metricCurrency('5% do salario minimo 2026', inssMEI) }
                ],
                steps: [
                    'Estimativa do tributo fixo mensal do MEI.',
                    'Calculo da aliquota efetiva no Simples pelo RBT12.',
                    'Comparacao mensal e anual de custo tributario.'
                ],
                details: [
                    { label: 'Anexo usado no Simples', value: values.anexoSimples },
                    { label: 'Faixa do anexo', value: `Ate ${H.formatCurrency(simples.faixa.limite)}` },
                    { label: 'Diferenca mensal', value: H.formatCurrency(diferencaMensal) },
                    { label: 'Diferenca anual', value: H.formatCurrency(diferencaAnual) }
                ],
                chart: {
                    labels: ['MEI mensal', 'Simples mensal'],
                    values: [H.round2(meiMensal), H.round2(simplesMensal)],
                    colors: ['#0f766e', '#0a7dd1']
                }
            };
        }
    });
})();

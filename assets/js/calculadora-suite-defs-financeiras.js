(function () {
    const suite = window.CalculadoraSuite || {};
    const H = suite.helpers;
    if (!suite.registerDefinition || !H) return;

    suite.registerDefinition('margem-lucro', {
        pageTitle: 'Calculadora de Margem de Lucro',
        pageDescription: 'Meca margem bruta e liquida da operacao para orientar precificacao e corte de custos.',
        badges: ['Financeiro', 'Margem', 'Decisao'],
        calculateLabel: 'Calcular margem',
        fields: [
            { id: 'faturamento', type: 'number', label: 'Faturamento mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'custosVariaveis', type: 'number', label: 'Custos variaveis totais', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'custosFixos', type: 'number', label: 'Custos fixos totais', placeholder: 'R$ 0,00', min: 0, step: '0.01' }
        ],
        example: {
            faturamento: 120000,
            custosVariaveis: 68000,
            custosFixos: 29000
        },
        validate(values) {
            if (values.faturamento <= 0) return 'Informe o faturamento para calcular a margem.';
            return '';
        },
        compute(values) {
            const lucroBruto = values.faturamento - values.custosVariaveis;
            const lucroLiquido = lucroBruto - values.custosFixos;
            const margemBruta = values.faturamento > 0 ? (lucroBruto / values.faturamento) * 100 : 0;
            const margemLiquida = values.faturamento > 0 ? (lucroLiquido / values.faturamento) * 100 : 0;

            let leitura = 'Margem saudavel para consolidacao de caixa.';
            if (margemLiquida < 5) leitura = 'Margem apertada. Revise preco, custos e mix de vendas.';
            if (margemLiquida < 0) leitura = 'Resultado negativo. Acao imediata recomendada.';

            return {
                highlight: H.metricPercent('Margem liquida', margemLiquida),
                secondaryA: H.metricCurrency('Lucro liquido', lucroLiquido),
                secondaryB: H.metricPercent('Margem bruta', margemBruta),
                notes: [
                    { label: 'Leitura estrategica', metric: H.metricText('Diagnostico', leitura) },
                    { label: 'Custos variaveis', metric: H.metricCurrency('Variaveis', values.custosVariaveis) },
                    { label: 'Custos fixos', metric: H.metricCurrency('Fixos', values.custosFixos) }
                ],
                steps: [
                    'Apuracao do lucro bruto pelo faturamento menos custos variaveis.',
                    'Desconto dos custos fixos para obter lucro liquido.',
                    'Transformacao do resultado em margem percentual.'
                ],
                details: [
                    { label: 'Faturamento', value: H.formatCurrency(values.faturamento) },
                    { label: 'Lucro bruto', value: H.formatCurrency(lucroBruto) },
                    { label: 'Lucro liquido', value: H.formatCurrency(lucroLiquido) },
                    { label: 'Margem liquida', value: H.formatPercent(margemLiquida) }
                ],
                chart: {
                    labels: ['Custos variaveis', 'Custos fixos', 'Lucro liquido'],
                    values: [H.round2(values.custosVariaveis), H.round2(values.custosFixos), H.round2(Math.max(0, lucroLiquido))],
                    colors: ['#d46d13', '#64748b', '#0f766e']
                }
            };
        }
    });

    suite.registerDefinition('ponto-equilibrio', {
        pageTitle: 'Calculadora de Ponto de Equilibrio',
        pageDescription: 'Descubra o faturamento minimo para cobrir custos fixos com base na margem de contribuicao.',
        badges: ['Financeiro', 'Break-even', 'Planejamento'],
        calculateLabel: 'Calcular ponto de equilibrio',
        fields: [
            { id: 'custosFixos', type: 'number', label: 'Custos fixos mensais', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'precoMedio', type: 'number', label: 'Preco medio de venda por unidade', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'custoVariavelUnitario', type: 'number', label: 'Custo variavel por unidade', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'faturamentoAtual', type: 'number', label: 'Faturamento atual (opcional)', placeholder: 'R$ 0,00', min: 0, step: '0.01' }
        ],
        example: {
            custosFixos: 45000,
            precoMedio: 280,
            custoVariavelUnitario: 130,
            faturamentoAtual: 98000
        },
        validate(values) {
            if (values.precoMedio <= 0) return 'Informe o preco medio para calcular o ponto de equilibrio.';
            if (values.custoVariavelUnitario >= values.precoMedio) {
                return 'O custo variavel unitario deve ser menor que o preco medio.';
            }
            return '';
        },
        compute(values) {
            const margemContribuicao = values.precoMedio - values.custoVariavelUnitario;
            const pontoUnidades = values.custosFixos / margemContribuicao;
            const pontoFaturamento = pontoUnidades * values.precoMedio;
            const margemSeguranca = values.faturamentoAtual > 0
                ? ((values.faturamentoAtual - pontoFaturamento) / values.faturamentoAtual) * 100
                : 0;

            return {
                highlight: H.metricCurrency('Faturamento de equilibrio', pontoFaturamento),
                secondaryA: H.metricNumber('Unidades para equilibrio', pontoUnidades, ' unid'),
                secondaryB: H.metricPercent('Margem de seguranca', margemSeguranca),
                notes: [
                    { label: 'Margem de contribuicao/unidade', metric: H.metricCurrency('Contribuicao', margemContribuicao) },
                    { label: 'Custos fixos', metric: H.metricCurrency('Custos fixos', values.custosFixos) },
                    { label: 'Faturamento atual', metric: H.metricCurrency('Atual', values.faturamentoAtual) }
                ],
                steps: [
                    'Apuracao da margem de contribuicao por unidade vendida.',
                    'Divisao dos custos fixos pela contribuicao para obter unidades minimas.',
                    'Conversao para faturamento minimo de equilibrio.'
                ],
                details: [
                    { label: 'Preco medio', value: H.formatCurrency(values.precoMedio) },
                    { label: 'Custo variavel unitario', value: H.formatCurrency(values.custoVariavelUnitario) },
                    { label: 'Unidades de equilibrio', value: `${H.formatNumber(pontoUnidades, 2)} unid` },
                    { label: 'Margem de seguranca', value: H.formatPercent(margemSeguranca) }
                ],
                chart: {
                    labels: ['Ponto de equilibrio', 'Faturamento atual'],
                    values: [H.round2(pontoFaturamento), H.round2(values.faturamentoAtual)],
                    colors: ['#d46d13', '#0f766e']
                }
            };
        }
    });

    suite.registerDefinition('fluxo-caixa', {
        pageTitle: 'Simulador de Fluxo de Caixa Mensal',
        pageDescription: 'Projete saldo de caixa do mes e identifique necessidade de capital de giro.',
        badges: ['Financeiro', 'Fluxo de caixa', 'Capital de giro'],
        calculateLabel: 'Projetar fluxo de caixa',
        fields: [
            { id: 'saldoInicial', type: 'number', label: 'Saldo inicial de caixa', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'entradas', type: 'number', label: 'Entradas previstas no mes', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'saidasFixas', type: 'number', label: 'Saidas fixas no mes', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'saidasVariaveis', type: 'number', label: 'Saidas variaveis no mes', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'impostos', type: 'number', label: 'Impostos previstos no mes', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'reservaMinima', type: 'number', label: 'Reserva minima de seguranca', placeholder: 'R$ 0,00', min: 0, step: '0.01' }
        ],
        example: {
            saldoInicial: 32000,
            entradas: 95000,
            saidasFixas: 41000,
            saidasVariaveis: 26000,
            impostos: 12000,
            reservaMinima: 15000
        },
        validate(values) {
            if ((values.saldoInicial + values.entradas + values.saidasFixas + values.saidasVariaveis + values.impostos) === 0) {
                return 'Preencha os valores para projetar o fluxo de caixa.';
            }
            return '';
        },
        compute(values) {
            const saidasTotais = values.saidasFixas + values.saidasVariaveis + values.impostos;
            const saldoFinal = values.saldoInicial + values.entradas - saidasTotais;
            const folgaSobreReserva = saldoFinal - values.reservaMinima;
            const necessidadeGiro = Math.max(0, values.reservaMinima - saldoFinal);
            const leitura = folgaSobreReserva >= 0
                ? 'Caixa projetado acima da reserva de seguranca.'
                : 'Caixa abaixo da reserva. Planeje capital de giro e corte de saidas.';

            return {
                highlight: H.metricCurrency('Saldo final projetado', saldoFinal),
                secondaryA: H.metricCurrency('Saidas totais', saidasTotais),
                secondaryB: H.metricCurrency('Necessidade de giro', necessidadeGiro),
                notes: [
                    { label: 'Leitura de risco', metric: H.metricText('Leitura', leitura) },
                    { label: 'Reserva minima', metric: H.metricCurrency('Reserva', values.reservaMinima) },
                    { label: 'Folga sobre reserva', metric: H.metricCurrency('Folga', folgaSobreReserva) }
                ],
                steps: [
                    'Soma das entradas e saldo inicial para caixa disponivel.',
                    'Desconto das saidas fixas, variaveis e impostos.',
                    'Comparacao do saldo final com reserva minima de seguranca.'
                ],
                details: [
                    { label: 'Saldo inicial', value: H.formatCurrency(values.saldoInicial) },
                    { label: 'Entradas previstas', value: H.formatCurrency(values.entradas) },
                    { label: 'Saidas fixas', value: H.formatCurrency(values.saidasFixas) },
                    { label: 'Saidas variaveis', value: H.formatCurrency(values.saidasVariaveis) }
                ],
                chart: {
                    labels: ['Entradas', 'Saidas totais', 'Saldo final'],
                    values: [H.round2(values.entradas), H.round2(saidasTotais), H.round2(Math.max(0, saldoFinal))],
                    colors: ['#0f766e', '#d46d13', '#0a7dd1']
                }
            };
        }
    });

    suite.registerDefinition('saude-financeira', {
        pageTitle: 'Diagnostico de Saude Financeira Empresarial',
        pageDescription: 'Receba um score rapido de saude financeira com indicadores de liquidez, margem e risco.',
        badges: ['Diagnostico', 'Score', 'Gestao'],
        calculateLabel: 'Gerar diagnostico',
        fields: [
            { id: 'margemLiquida', type: 'number', label: 'Margem liquida (%)', min: -100, step: '0.01' },
            { id: 'caixaMeses', type: 'number', label: 'Reserva de caixa (em meses)', min: 0, step: '0.1' },
            { id: 'endividamento', type: 'number', label: 'Endividamento sobre receita (%)', min: 0, step: '0.1' },
            { id: 'inadimplencia', type: 'number', label: 'Inadimplencia de clientes (%)', min: 0, step: '0.1' },
            { id: 'atrasosFiscais', type: 'select', label: 'Ha atrasos fiscais?', options: H.simOuNaoOptions() },
            { id: 'prolaboreSeparado', type: 'select', label: 'Pro-labore separado da conta da empresa?', options: H.simOuNaoOptions() },
            { id: 'dreAtualizada', type: 'select', label: 'DRE atualizada mensalmente?', options: H.simOuNaoOptions() }
        ],
        example: {
            margemLiquida: 9.2,
            caixaMeses: 1.8,
            endividamento: 47,
            inadimplencia: 4.5,
            atrasosFiscais: 'nao',
            prolaboreSeparado: 'sim',
            dreAtualizada: 'sim'
        },
        validate() {
            return '';
        },
        compute(values) {
            let score = 100;

            if (values.margemLiquida < 0) score -= 30;
            else if (values.margemLiquida < 5) score -= 20;
            else if (values.margemLiquida < 10) score -= 10;

            if (values.caixaMeses < 1) score -= 25;
            else if (values.caixaMeses < 3) score -= 12;

            if (values.endividamento > 80) score -= 20;
            else if (values.endividamento > 50) score -= 12;

            if (values.inadimplencia > 10) score -= 15;
            else if (values.inadimplencia > 5) score -= 8;

            if (values.atrasosFiscais === 'sim') score -= 15;
            if (values.prolaboreSeparado === 'nao') score -= 8;
            if (values.dreAtualizada === 'nao') score -= 8;

            score = H.clamp(score, 0, 100);

            let nivel = 'Saudavel';
            let acao = 'Mantenha disciplina de caixa e acompanhe indicadores mensalmente.';
            if (score < 60) {
                nivel = 'Critico';
                acao = 'Priorize caixa, renegociacao de dividas e regularizacao fiscal imediata.';
            } else if (score < 80) {
                nivel = 'Atencao';
                acao = 'Reforce controles, aumente margem e reduza exposicao de risco.';
            }

            return {
                highlight: H.metricNumber('Score de saude financeira', score, ' / 100'),
                secondaryA: H.metricText('Classificacao', nivel),
                secondaryB: H.metricText('Acao prioritaria', acao),
                notes: [
                    { label: 'Margem liquida', metric: H.metricPercent('Margem', values.margemLiquida) },
                    { label: 'Reserva de caixa', metric: H.metricNumber('Reserva', values.caixaMeses, ' meses') },
                    { label: 'Endividamento', metric: H.metricPercent('Endividamento', values.endividamento) }
                ],
                steps: [
                    'Leitura dos indicadores de margem, caixa, divida e inadimplencia.',
                    'Aplicacao de pesos de risco para compor o score.',
                    'Classificacao automatica com acao recomendada.'
                ],
                details: [
                    { label: 'Atrasos fiscais', value: values.atrasosFiscais === 'sim' ? 'Sim' : 'Nao' },
                    { label: 'Pro-labore separado', value: values.prolaboreSeparado === 'sim' ? 'Sim' : 'Nao' },
                    { label: 'DRE atualizada', value: values.dreAtualizada === 'sim' ? 'Sim' : 'Nao' },
                    { label: 'Inadimplencia', value: H.formatPercent(values.inadimplencia) }
                ],
                chart: {
                    labels: ['Score obtido', 'Faixa de melhoria'],
                    values: [H.round2(score), H.round2(100 - score)],
                    colors: ['#0f766e', '#d46d13']
                }
            };
        }
    });
})();

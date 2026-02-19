(function () {
    const suite = window.CalculadoraSuite || {};
    const H = suite.helpers;
    if (!suite.registerDefinition || !H) return;

    suite.registerDefinition('imposto-a-mais', {
        pageTitle: 'Simulador: voce esta pagando imposto a mais?',
        pageDescription: 'Compare carga tributaria paga com estimativa de referencia para identificar possivel sobrecusto.',
        badges: ['Estrategico', 'Carga tributaria', 'Oportunidade'],
        calculateLabel: 'Analisar carga tributaria',
        fields: [
            { id: 'faturamento12m', type: 'number', label: 'Faturamento dos ultimos 12 meses', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'impostosPagos12m', type: 'number', label: 'Total de impostos pagos em 12 meses', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            {
                id: 'anexoReferencia',
                type: 'select',
                label: 'Anexo de referencia para estimativa',
                options: [
                    { value: 'I', label: 'Anexo I' },
                    { value: 'II', label: 'Anexo II' },
                    { value: 'III', label: 'Anexo III' },
                    { value: 'IV', label: 'Anexo IV' },
                    { value: 'V', label: 'Anexo V' }
                ]
            }
        ],
        example: {
            faturamento12m: 1250000,
            impostosPagos12m: 238000,
            anexoReferencia: 'III'
        },
        validate(values) {
            if (values.faturamento12m <= 0) return 'Informe o faturamento de 12 meses.';
            if (values.impostosPagos12m < 0) return 'Informe um valor valido para impostos pagos.';
            return '';
        },
        compute(values) {
            const cargaPaga = values.faturamento12m > 0 ? (values.impostosPagos12m / values.faturamento12m) * 100 : 0;
            const simples = H.calcularAliquotaEfetivaSimples(values.anexoReferencia, values.faturamento12m);
            const cargaReferencia = simples.aliquotaEfetiva * 100;
            const diferencaPontos = cargaPaga - cargaReferencia;
            const potencialEconomia = diferencaPontos > 0
                ? values.faturamento12m * (diferencaPontos / 100)
                : 0;
            const leitura = diferencaPontos > 0
                ? 'Ha indicio de carga acima da referencia. Vale auditoria tributaria.'
                : 'Carga em linha com a referencia simulada.';

            return {
                highlight: H.metricCurrency('Potencial de economia anual', potencialEconomia),
                secondaryA: H.metricPercent('Carga paga', cargaPaga),
                secondaryB: H.metricPercent('Carga de referencia', cargaReferencia),
                notes: [
                    { label: 'Diferenca em pontos', metric: H.metricPercent('Diferenca', diferencaPontos) },
                    { label: 'Leitura', metric: H.metricText('Diagnostico', leitura) },
                    { label: 'Anexo de referencia', metric: H.metricText('Anexo', values.anexoReferencia) }
                ],
                steps: [
                    'Calculo da carga efetiva paga sobre faturamento anual.',
                    'Estimativa de carga de referencia pelo anexo informado.',
                    'Comparacao para identificar potencial de reducao.'
                ],
                details: [
                    { label: 'Faturamento 12 meses', value: H.formatCurrency(values.faturamento12m) },
                    { label: 'Impostos pagos 12 meses', value: H.formatCurrency(values.impostosPagos12m) },
                    { label: 'Faixa de referencia', value: `Ate ${H.formatCurrency(simples.faixa.limite)}` },
                    { label: 'Aliquota nominal da faixa', value: H.formatPercent(simples.faixa.aliquota * 100) }
                ],
                chart: {
                    labels: ['Carga paga', 'Carga de referencia'],
                    values: [H.round2(Math.max(0, cargaPaga)), H.round2(Math.max(0, cargaReferencia))],
                    colors: ['#d46d13', '#0f766e']
                }
            };
        }
    });

    suite.registerDefinition('diagnostico-organizacao', {
        pageTitle: 'Diagnostico: sua empresa esta organizada financeiramente?',
        pageDescription: 'Questionario interativo para medir nivel de organizacao financeira e orientar proximo passo.',
        badges: ['Estrategico', 'Diagnostico', 'Maturidade'],
        calculateLabel: 'Gerar diagnostico de organizacao',
        fields: [
            { id: 'conciliacao', type: 'select', label: 'Concilia contas bancarias semanalmente?', options: H.diagnosticoOptions() },
            { id: 'contas', type: 'select', label: 'Controla contas a pagar e receber em tempo real?', options: H.diagnosticoOptions() },
            { id: 'separacao', type: 'select', label: 'Separa totalmente financas pessoais e empresariais?', options: H.diagnosticoOptions() },
            { id: 'orcamento', type: 'select', label: 'Opera com orcamento mensal definido?', options: H.diagnosticoOptions() },
            { id: 'indicadores', type: 'select', label: 'Acompanha margem, custos e caixa em painel?', options: H.diagnosticoOptions() },
            { id: 'fiscalDia', type: 'select', label: 'Obrigacoes fiscais e trabalhistas estao em dia?', options: H.diagnosticoOptions() },
            { id: 'projecao', type: 'select', label: 'Projeta fluxo de caixa para pelo menos 3 meses?', options: H.diagnosticoOptions() },
            { id: 'precificacao', type: 'select', label: 'Revisa precificacao periodicamente?', options: H.diagnosticoOptions() }
        ],
        example: {
            conciliacao: '2',
            contas: '2',
            separacao: '1',
            orcamento: '1',
            indicadores: '1',
            fiscalDia: '2',
            projecao: '1',
            precificacao: '1'
        },
        validate() {
            return '';
        },
        compute(values) {
            const total = [
                values.conciliacao,
                values.contas,
                values.separacao,
                values.orcamento,
                values.indicadores,
                values.fiscalDia,
                values.projecao,
                values.precificacao
            ].reduce((acc, item) => acc + H.clamp(item, 0, 2), 0);

            const score = H.round2((total / 16) * 100);
            let nivel = 'Alto';
            let prioridade = 'Manter rotina e automatizar pontos operacionais.';
            if (score < 55) {
                nivel = 'Baixo';
                prioridade = 'Estruturar controles basicos de caixa, fiscal e contas.';
            } else if (score < 80) {
                nivel = 'Medio';
                prioridade = 'Padronizar processos e fortalecer indicadores de decisao.';
            }

            return {
                highlight: H.metricNumber('Score de organizacao', score, ' / 100'),
                secondaryA: H.metricText('Nivel atual', nivel),
                secondaryB: H.metricText('Prioridade', prioridade),
                notes: [
                    { label: 'Pontuacao total', metric: H.metricNumber('Pontos', total, ' de 16') },
                    { label: 'Leitura geral', metric: H.metricText('Diagnostico', `${nivel} maturidade financeira`) },
                    { label: 'Proximo passo', metric: H.metricText('Acao', 'Agendar revisao com especialista para plano de acao.') }
                ],
                steps: [
                    'Coleta de respostas sobre rotina financeira e fiscal.',
                    'Conversao de respostas em score de maturidade.',
                    'Definicao de nivel e prioridade de ajuste.'
                ],
                details: [
                    { label: 'Concilia bancario', value: `${values.conciliacao}/2` },
                    { label: 'Controle de contas', value: `${values.contas}/2` },
                    { label: 'Projecao de caixa', value: `${values.projecao}/2` },
                    { label: 'Revisao de precificacao', value: `${values.precificacao}/2` }
                ],
                chart: {
                    labels: ['Organizacao atual', 'Faixa de evolucao'],
                    values: [score, H.round2(100 - score)],
                    colors: ['#0a7dd1', '#d46d13']
                }
            };
        }
    });
})();

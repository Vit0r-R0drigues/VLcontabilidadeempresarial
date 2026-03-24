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

    suite.registerDefinition('pj-vs-clt', {
        pageTitle: 'Comparador PJ x CLT',
        pageDescription: 'Compare o caixa anual estimado como CLT e como PJ para apoiar negociacao de contrato e retirada.',
        badges: ['Comparativo', 'Contratacao', 'Retirada'],
        calculateLabel: 'Comparar PJ x CLT',
        fields: [
            { id: 'salarioCLTBruto', type: 'number', label: 'Salario CLT bruto mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'beneficiosCLT', type: 'number', label: 'Beneficios CLT mensais', placeholder: 'R$ 0,00', min: 0, step: '0.01', help: 'Use VR, VA, plano de saude, bonus fixos e outros valores recorrentes.' },
            { id: 'dependentes', type: 'number', label: 'Dependentes para IRRF', min: 0, step: '1' },
            {
                id: 'regimePJ',
                type: 'select',
                label: 'Regime da empresa PJ',
                options: [
                    { value: 'simples', label: 'Simples Nacional' },
                    { value: 'presumido', label: 'Lucro Presumido' }
                ]
            },
            { id: 'faturamentoPJMensal', type: 'number', label: 'Receita PJ mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'custosPJMensais', type: 'number', label: 'Custos mensais da PJ', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'prolaboreMensal', type: 'number', label: 'Pro-labore mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'rbt12PJ', type: 'number', label: 'Faturamento PJ em 12 meses (para Simples)', placeholder: 'R$ 0,00', min: 0, step: '0.01', help: 'Se nao informar, a calculadora usa 12x a receita mensal.' },
            {
                id: 'anexoPJ',
                type: 'select',
                label: 'Anexo do Simples (se aplicavel)',
                options: [
                    { value: 'I', label: 'Anexo I - Comercio' },
                    { value: 'II', label: 'Anexo II - Industria' },
                    { value: 'III', label: 'Anexo III - Servicos' },
                    { value: 'IV', label: 'Anexo IV - Servicos especificos' },
                    { value: 'V', label: 'Anexo V - Servicos intelectuais' }
                ]
            },
            { id: 'atividadePJ', type: 'select', label: 'Atividade da PJ (para Presumido)', options: H.atividadePresumidoOptions() },
            { id: 'aliquotaLocalPJ', type: 'number', label: 'ISS ou ICMS adicional no Presumido (%)', min: 0, max: 10, step: '0.1' }
        ],
        example: {
            salarioCLTBruto: 9500,
            beneficiosCLT: 1350,
            dependentes: 1,
            regimePJ: 'simples',
            faturamentoPJMensal: 17500,
            custosPJMensais: 1800,
            prolaboreMensal: 5000,
            rbt12PJ: 210000,
            anexoPJ: 'III',
            atividadePJ: 'servicos',
            aliquotaLocalPJ: 0
        },
        validate(values) {
            if (values.salarioCLTBruto <= 0) return 'Informe o salario CLT bruto mensal.';
            if (values.faturamentoPJMensal <= 0) return 'Informe a receita PJ mensal.';
            if (values.prolaboreMensal < 0) return 'Informe um pro-labore valido.';
            return '';
        },
        compute(values) {
            const cltMensal = H.calcularIRRFMensal(values.salarioCLTBruto, {
                dependentes: values.dependentes
            });
            const feriasCLT = H.calcularFeriasLiquidas({
                salarioBase: values.salarioCLTBruto,
                diasFerias: 30,
                mediaVariavel: 0,
                venderFerias: false,
                diasVendidos: 0
            });
            const decimoCLT = H.calcularDecimoTerceiroLiquido({
                salarioBase: values.salarioCLTBruto,
                mesesTrabalhados: 12,
                percentualAdiantamento: 50,
                dependentes: values.dependentes
            });
            const adicionalFerias = Math.max(0, feriasCLT.liquido - cltMensal.liquido);
            const caixaCLTAnual = (cltMensal.liquido * 12) + (values.beneficiosCLT * 12) + adicionalFerias + decimoCLT.liquidoTotal;
            const fgtsAnual = values.salarioCLTBruto * 0.08 * 13;
            const pacoteCLTComFGTS = caixaCLTAnual + fgtsAnual;

            const receitaPJAnual = values.faturamentoPJMensal * 12;
            const rbt12 = values.rbt12PJ > 0 ? values.rbt12PJ : receitaPJAnual;
            const proLabore = H.calcularProLaboreLiquido(values.prolaboreMensal, {
                dependentes: values.dependentes
            });

            let tributoPJMensal = 0;
            let leituraRegime = '';
            let detalheTributo = '';

            if (values.regimePJ === 'simples') {
                const simples = H.calcularAliquotaEfetivaSimples(values.anexoPJ, rbt12);
                const das = values.faturamentoPJMensal * simples.aliquotaEfetiva;
                const cpp = values.anexoPJ === 'IV'
                    ? H.calcularCPPPatronalProLabore('simples_iv', values.prolaboreMensal)
                    : 0;
                tributoPJMensal = das + cpp;
                leituraRegime = 'PJ no Simples Nacional';
                detalheTributo = `DAS ${H.formatCurrency(das)}${cpp > 0 ? ` + CPP ${H.formatCurrency(cpp)}` : ''}`;
            } else {
                const presumido = H.calcularLucroPresumidoMensal(values.faturamentoPJMensal, values.atividadePJ, values.aliquotaLocalPJ);
                const cpp = H.calcularCPPPatronalProLabore('presumido_real', values.prolaboreMensal);
                tributoPJMensal = presumido.total + cpp;
                leituraRegime = 'PJ no Lucro Presumido';
                detalheTributo = `Presumido ${H.formatCurrency(presumido.total)} + CPP ${H.formatCurrency(cpp)}`;
            }

            const caixaEmpresaAntesDistribuicao = receitaPJAnual - (values.custosPJMensais * 12) - (tributoPJMensal * 12);
            const distribuicaoLucros = Math.max(0, caixaEmpresaAntesDistribuicao - (values.prolaboreMensal * 12));
            const caixaPJAnual = (proLabore.liquido * 12) + distribuicaoLucros;
            const diferencaAnualCaixa = caixaPJAnual - caixaCLTAnual;
            const diferencaAnualPacote = caixaPJAnual - pacoteCLTComFGTS;
            const melhorModelo = diferencaAnualCaixa >= 0 ? 'PJ' : 'CLT';

            return {
                highlight: H.metricCurrency(
                    melhorModelo === 'PJ' ? 'Ganho anual estimado como PJ' : 'Ganho anual estimado como CLT',
                    Math.abs(diferencaAnualCaixa)
                ),
                secondaryA: H.metricCurrency('Caixa anual CLT', caixaCLTAnual),
                secondaryB: H.metricCurrency('Caixa anual PJ', caixaPJAnual),
                notes: [
                    { label: 'Pacote CLT com FGTS', metric: H.metricCurrency('CLT + FGTS', pacoteCLTComFGTS) },
                    { label: 'Diferenca anual considerando FGTS', metric: H.metricCurrency('PJ - CLT + FGTS', diferencaAnualPacote) },
                    { label: 'Leitura do regime PJ', metric: H.metricText('Tributos PJ', `${leituraRegime}: ${detalheTributo}`) }
                ],
                steps: [
                    'Calculo do liquido CLT mensal, 13o e adicional de ferias.',
                    'Apuracao do caixa PJ apos tributos, custos e pro-labore.',
                    'Comparacao anual entre os dois formatos de contratacao.'
                ],
                details: [
                    { label: 'Liquido CLT mensal', value: H.formatCurrency(cltMensal.liquido) },
                    { label: 'Beneficios CLT anuais', value: H.formatCurrency(values.beneficiosCLT * 12) },
                    { label: 'FGTS anual estimado', value: H.formatCurrency(fgtsAnual) },
                    { label: 'Caixa anual distribuivel na PJ', value: H.formatCurrency(distribuicaoLucros) },
                    { label: 'Tributos PJ no ano', value: H.formatCurrency(tributoPJMensal * 12) },
                    { label: 'Custos PJ no ano', value: H.formatCurrency(values.custosPJMensais * 12) }
                ],
                chart: {
                    labels: ['Caixa anual CLT', 'Caixa anual PJ', 'FGTS anual'],
                    values: [H.round2(caixaCLTAnual), H.round2(caixaPJAnual), H.round2(fgtsAnual)],
                    colors: ['#0a7dd1', '#0f766e', '#d46d13']
                }
            };
        }
    });
})();

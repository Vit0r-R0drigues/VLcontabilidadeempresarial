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
            const anexoSugerido = values.folha12 > 0 && (values.anexo === 'III' || values.anexo === 'V')
                ? (fatorR >= 0.28 ? 'III' : 'V')
                : values.anexo;
            const simulacaoSugerida = H.calcularAliquotaEfetivaSimples(anexoSugerido, values.rbt12);
            const diferencaPotencialMes = values.receitaMes * (simples.aliquotaEfetiva - simulacaoSugerida.aliquotaEfetiva);

            return {
                highlight: H.metricCurrency('DAS estimado no mes', dasMes),
                secondaryA: H.metricPercent('Aliquota efetiva', simples.aliquotaEfetiva * 100),
                secondaryB: H.metricCurrency('Carga anual estimada', cargaAnual),
                notes: [
                    { label: 'Faixa aplicada', metric: H.metricText('Faixa', `Ate ${H.formatCurrency(simples.faixa.limite)} | nominal ${H.formatPercent(simples.faixa.aliquota * 100)}`) },
                    { label: 'Parcela a deduzir', metric: H.metricCurrency('Parcela', simples.faixa.deducao) },
                    { label: 'Fator R', metric: H.metricText('Leitura', leituraFatorR) },
                    { label: 'Potencial mensal com anexo sugerido', metric: H.metricCurrency('Diferenca', diferencaPotencialMes) }
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
                    { label: 'Aliquota efetiva usada', value: H.formatPercent(simples.aliquotaEfetiva * 100) },
                    { label: 'Anexo sugerido pelo Fator R', value: anexoSugerido }
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
            const mensal = H.calcularIRRFMensal(values.rendimentoBruto, {
                dependentes: values.dependentes,
                pensao: values.pensao,
                outrasDeducoes: values.outrasDeducoes
            });

            return {
                highlight: H.metricCurrency('Liquido estimado', mensal.liquido),
                secondaryA: H.metricCurrency('INSS estimado', mensal.inss),
                secondaryB: H.metricCurrency('IRRF estimado', mensal.irrf.impostoFinal),
                notes: [
                    { label: 'Base de calculo IRRF', metric: H.metricCurrency('Base', mensal.baseIRRF) },
                    { label: 'Reducao legal aplicada', metric: H.metricCurrency('Reducao', mensal.irrf.reducao) },
                    { label: 'Deducao considerada', metric: H.metricCurrency('Deducao', mensal.deducaoAplicada) }
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
                        H.round2(Math.max(0, mensal.liquido)),
                        H.round2(mensal.inss),
                        H.round2(mensal.irrf.impostoFinal),
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

    suite.registerDefinition('simples-vs-lucro-presumido', {
        pageTitle: 'Comparador Simples Nacional x Lucro Presumido',
        pageDescription: 'Compare os principais tributos mensais entre Simples e Lucro Presumido para apoiar o enquadramento.',
        badges: ['Comparativo', 'Tributario', 'Planejamento'],
        calculateLabel: 'Comparar regimes',
        fields: [
            { id: 'faturamentoMensal', type: 'number', label: 'Faturamento medio mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'rbt12', type: 'number', label: 'Faturamento acumulado de 12 meses', placeholder: 'R$ 0,00', min: 0, step: '0.01', help: 'Se nao tiver, use 12x o faturamento medio.' },
            { id: 'atividade', type: 'select', label: 'Atividade predominante', options: H.atividadePresumidoOptions() },
            {
                id: 'anexoSimples',
                type: 'select',
                label: 'Anexo estimado no Simples',
                options: [
                    { value: 'I', label: 'Anexo I - Comercio' },
                    { value: 'II', label: 'Anexo II - Industria' },
                    { value: 'III', label: 'Anexo III - Servicos' },
                    { value: 'IV', label: 'Anexo IV - Servicos especificos' },
                    { value: 'V', label: 'Anexo V - Servicos intelectuais' }
                ]
            },
            { id: 'folhaMensal', type: 'number', label: 'Folha mensal estimada', placeholder: 'R$ 0,00', min: 0, step: '0.01', help: 'Usada para estimar CPP fora do DAS no Anexo IV e no Presumido.' },
            { id: 'aliquotaLocal', type: 'number', label: 'ISS ou ICMS adicional no Presumido (%)', min: 0, max: 10, step: '0.1', help: 'Opcional. Use apenas se quiser incluir tributo local na simulacao do Presumido.' }
        ],
        example: {
            faturamentoMensal: 85000,
            rbt12: 1020000,
            atividade: 'servicos',
            anexoSimples: 'III',
            folhaMensal: 18000,
            aliquotaLocal: 2
        },
        validate(values) {
            if (values.faturamentoMensal <= 0) return 'Informe o faturamento medio mensal.';
            if (values.rbt12 <= 0) return 'Informe o faturamento acumulado de 12 meses.';
            return '';
        },
        compute(values) {
            const simples = H.calcularAliquotaEfetivaSimples(values.anexoSimples, values.rbt12);
            const dasMensal = values.faturamentoMensal * simples.aliquotaEfetiva;
            const cppSimples = values.anexoSimples === 'IV' ? (values.folhaMensal * 0.20) : 0;
            const totalSimples = dasMensal + cppSimples;

            const presumido = H.calcularLucroPresumidoMensal(values.faturamentoMensal, values.atividade, values.aliquotaLocal);
            const cppPresumido = values.folhaMensal * 0.20;
            const totalPresumido = presumido.total + cppPresumido;

            const economiaMensal = Math.abs(totalSimples - totalPresumido);
            const economiaAnual = economiaMensal * 12;
            const regimeMaisLeve = totalSimples <= totalPresumido ? 'Simples Nacional' : 'Lucro Presumido';
            const diferencaPontos = values.faturamentoMensal > 0
                ? ((totalPresumido - totalSimples) / values.faturamentoMensal) * 100
                : 0;

            return {
                highlight: H.metricCurrency(`Economia anual estimada no ${regimeMaisLeve}`, economiaAnual),
                secondaryA: H.metricCurrency('Custo mensal no Simples', totalSimples),
                secondaryB: H.metricCurrency('Custo mensal no Presumido', totalPresumido),
                notes: [
                    { label: 'Aliquota efetiva do Simples', metric: H.metricPercent('Aliquota', simples.aliquotaEfetiva * 100) },
                    { label: 'Diferenca em pontos sobre a receita', metric: H.metricPercent('Diferenca', diferencaPontos) },
                    { label: 'Leitura', metric: H.metricText('Regime mais leve', `${regimeMaisLeve} tende a gerar menor carga principal nesta simulacao.`) }
                ],
                steps: [
                    'Estimativa do DAS pelo RBT12 e anexo informado.',
                    'Apuracao do Lucro Presumido com IRPJ, CSLL, PIS/Cofins e tributo local.',
                    'Comparacao mensal e anual entre os dois regimes.'
                ],
                details: [
                    { label: 'DAS mensal no Simples', value: H.formatCurrency(dasMensal) },
                    { label: 'CPP fora do DAS (Simples)', value: H.formatCurrency(cppSimples) },
                    { label: 'Tributos principais no Presumido', value: H.formatCurrency(presumido.total) },
                    { label: 'CPP sobre folha no Presumido', value: H.formatCurrency(cppPresumido) },
                    { label: 'PIS/Cofins no Presumido', value: H.formatCurrency(presumido.pisCofins) },
                    { label: 'IRPJ + adicional no Presumido', value: H.formatCurrency(presumido.irpj) }
                ],
                chart: {
                    labels: ['Simples', 'Lucro Presumido'],
                    values: [H.round2(totalSimples), H.round2(totalPresumido)],
                    colors: ['#0f766e', '#d46d13']
                }
            };
        }
    });

    suite.registerDefinition('pro-labore-liquido', {
        pageTitle: 'Calculadora de Pro-labore Liquido',
        pageDescription: 'Estime o liquido do pro-labore do socio, o INSS retido, o IRRF e o custo total para a empresa.',
        badges: ['Socios', 'Pro-labore', 'Retirada'],
        calculateLabel: 'Calcular pro-labore',
        fields: [
            { id: 'proLaboreBruto', type: 'number', label: 'Pro-labore bruto mensal', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'regimeEmpresa', type: 'select', label: 'Regime da empresa para CPP patronal', options: H.regimeProLaboreOptions() },
            { id: 'dependentes', type: 'number', label: 'Dependentes para IRRF', min: 0, step: '1' },
            { id: 'pensao', type: 'number', label: 'Pensao alimenticia dedutivel', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'outrasDeducoes', type: 'number', label: 'Outras deducoes mensais', placeholder: 'R$ 0,00', min: 0, step: '0.01' }
        ],
        example: {
            proLaboreBruto: 8000,
            regimeEmpresa: 'presumido_real',
            dependentes: 1,
            pensao: 0,
            outrasDeducoes: 0
        },
        validate(values) {
            if (values.proLaboreBruto <= 0) return 'Informe o pro-labore bruto mensal.';
            return '';
        },
        compute(values) {
            const proLabore = H.calcularProLaboreLiquido(values.proLaboreBruto, {
                dependentes: values.dependentes,
                pensao: values.pensao,
                outrasDeducoes: values.outrasDeducoes
            });
            const cppPatronal = H.calcularCPPPatronalProLabore(values.regimeEmpresa, values.proLaboreBruto);
            const custoEmpresa = values.proLaboreBruto + cppPatronal;
            const cargaTotal = proLabore.inssSocio + proLabore.irrf.impostoFinal + cppPatronal;

            return {
                highlight: H.metricCurrency('Pro-labore liquido mensal', proLabore.liquido),
                secondaryA: H.metricCurrency('Custo total da empresa', custoEmpresa),
                secondaryB: H.metricCurrency('Retirada liquida anual', proLabore.liquido * 12),
                notes: [
                    { label: 'INSS do socio', metric: H.metricCurrency('11% sobre o pro-labore ate o teto', proLabore.inssSocio) },
                    { label: 'IRRF estimado', metric: H.metricCurrency('IRRF', proLabore.irrf.impostoFinal) },
                    { label: 'Carga total mensal', metric: H.metricCurrency('Carga total', cargaTotal) }
                ],
                steps: [
                    'Retencao previdenciaria do socio sobre o pro-labore.',
                    'Calculo da base mensal de IRRF com dependentes e deducoes.',
                    'Soma do custo patronal quando o regime exige CPP fora do DAS.'
                ],
                details: [
                    { label: 'Base mensal de IRRF', value: H.formatCurrency(proLabore.baseIRRF) },
                    { label: 'CPP patronal estimada', value: H.formatCurrency(cppPatronal) },
                    { label: 'Deducao aplicada no IRRF', value: H.formatCurrency(proLabore.deducaoAplicada) },
                    { label: 'Liquido anual estimado', value: H.formatCurrency(proLabore.liquido * 12) }
                ],
                chart: {
                    labels: ['Liquido do socio', 'INSS socio', 'IRRF', 'CPP patronal'],
                    values: [
                        H.round2(proLabore.liquido),
                        H.round2(proLabore.inssSocio),
                        H.round2(proLabore.irrf.impostoFinal),
                        H.round2(cppPatronal)
                    ],
                    colors: ['#0f766e', '#0a7dd1', '#d46d13', '#64748b']
                }
            };
        }
    });

    suite.registerDefinition('distribuicao-lucros', {
        pageTitle: 'Calculadora de Distribuicao de Lucros Disponivel',
        pageDescription: 'Projete o lucro distribuivel do mes e a parcela estimada do socio conforme a participacao informada.',
        badges: ['Socios', 'Lucros', 'Caixa'],
        calculateLabel: 'Calcular distribuicao',
        fields: [
            { id: 'faturamentoMensal', type: 'number', label: 'Faturamento do mes', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'custosMensais', type: 'number', label: 'Custos operacionais + pro-labore', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'tributosMensais', type: 'number', label: 'Tributos do mes', placeholder: 'R$ 0,00', min: 0, step: '0.01' },
            { id: 'reservaPercentual', type: 'range', label: 'Percentual para reserva de caixa', min: 0, max: 40, step: 1, value: 15, outputSuffix: '%' },
            { id: 'participacaoSocio', type: 'range', label: 'Participacao do socio nos lucros', min: 1, max: 100, step: 1, value: 100, outputSuffix: '%' }
        ],
        example: {
            faturamentoMensal: 120000,
            custosMensais: 63000,
            tributosMensais: 9800,
            reservaPercentual: 15,
            participacaoSocio: 50
        },
        validate(values) {
            if (values.faturamentoMensal <= 0) return 'Informe o faturamento do mes.';
            return '';
        },
        compute(values) {
            const lucroAntesReserva = values.faturamentoMensal - values.custosMensais - values.tributosMensais;
            const reserva = lucroAntesReserva > 0 ? (lucroAntesReserva * (H.clamp(values.reservaPercentual, 0, 40) / 100)) : 0;
            const lucroDistribuivel = Math.max(0, lucroAntesReserva - reserva);
            const parcelaSocio = lucroDistribuivel * (H.clamp(values.participacaoSocio, 1, 100) / 100);
            const margemLiquida = values.faturamentoMensal > 0 ? (lucroAntesReserva / values.faturamentoMensal) * 100 : 0;

            return {
                highlight: H.metricCurrency('Parcela mensal estimada do socio', parcelaSocio),
                secondaryA: H.metricCurrency('Lucro distribuivel total', lucroDistribuivel),
                secondaryB: H.metricCurrency('Reserva mensal sugerida', reserva),
                notes: [
                    { label: 'Lucro antes da reserva', metric: H.metricCurrency('Lucro', lucroAntesReserva) },
                    { label: 'Margem liquida apos tributos', metric: H.metricPercent('Margem', margemLiquida) },
                    { label: 'Leitura', metric: H.metricText('Leitura', lucroAntesReserva > 0 ? 'Ha espaco para distribuir lucros sem consumir toda a folga do caixa.' : 'Nao ha lucro mensal para distribuicao neste cenario.') }
                ],
                steps: [
                    'Subtracao de custos e tributos sobre a receita do mes.',
                    'Separacao de uma reserva minima para capital de giro.',
                    'Rateio da parcela distribuivel conforme a participacao do socio.'
                ],
                details: [
                    { label: 'Receita anualizada', value: H.formatCurrency(values.faturamentoMensal * 12) },
                    { label: 'Lucro distribuivel anual', value: H.formatCurrency(lucroDistribuivel * 12) },
                    { label: 'Participacao do socio', value: H.formatPercent(values.participacaoSocio) },
                    { label: 'Parcela anual do socio', value: H.formatCurrency(parcelaSocio * 12) }
                ],
                chart: {
                    labels: ['Custos + pro-labore', 'Tributos', 'Reserva', 'Lucro distribuivel'],
                    values: [
                        H.round2(values.custosMensais),
                        H.round2(values.tributosMensais),
                        H.round2(reserva),
                        H.round2(lucroDistribuivel)
                    ],
                    colors: ['#64748b', '#d46d13', '#0a7dd1', '#0f766e']
                }
            };
        }
    });
})();

// Variáveis globais para elementos do DOM
let tipoRescisao, salarioBruto, tempoServico, mesesAnoAtual, diasTrabalhados, avisoPrevio;
let btnCalcular, btnExemplo, btnDetalhes;
let tabelaDetalhes, progressBar;
let resultados = {}; // Adicionando variável global para resultados

// Constantes para o cálculo do INSS 2025
const FAIXAS_INSS = [
    { limite: 1412.00, aliquota: 0.075 },
    { limite: 2666.68, aliquota: 0.09 },
    { limite: 4000.03, aliquota: 0.12 },
    { limite: 7786.02, aliquota: 0.14 }
];

// Constantes para o cálculo do IRRF 2025
const FAIXAS_IRRF = [
    { limite: 2259.20, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
    { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
    { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
    { limite: Infinity, aliquota: 0.275, deducao: 896.00 }
];

let graficoResultados = null;

// Função para validar se todos os elementos foram inicializados
function validarInicializacao() {
    const elementos = {
        tipoRescisao,
        salarioBruto,
        tempoServico,
        mesesAnoAtual,
        diasTrabalhados,
        btnCalcular,
        btnExemplo,
        btnDetalhes,
        tabelaDetalhes,
        progressBar
    };

    for (const [nome, elemento] of Object.entries(elementos)) {
        if (!elemento) {
            console.error(`Elemento ${nome} não foi inicializado corretamente`);
            return false;
        }
    }
    return true;
}

// Função para formatar valores monetários
function formatMoney(value) {
    if (typeof value !== 'number') {
        console.error('Valor inválido para formatação monetária:', value);
        return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para mostrar/ocultar campos baseado no tipo de rescisão
document.getElementById('tipoRescisao').addEventListener('change', function() {
    const tipo = this.value;
    const diasTrabalhadosGroup = document.getElementById('diasTrabalhadosGroup');
    const avisoPrevioGroup = document.getElementById('avisoPrevioGroup');
    const motivoRescisaoGroup = document.getElementById('motivoRescisaoGroup');

    // Reset display
    diasTrabalhadosGroup.classList.remove('hidden');
    avisoPrevioGroup.classList.add('hidden');
    motivoRescisaoGroup.classList.add('hidden');

    // Show relevant fields based on type
    if (tipo === 'pedido') {
        avisoPrevioGroup.classList.remove('hidden');
    } else if (tipo === 'prazo_determinado') {
        motivoRescisaoGroup.classList.remove('hidden');
    }
});

// Função para validar campos com mensagens mais específicas
function validarCampos() {
    const campos = [
        { 
            elem: tipoRescisao, 
            msg: 'Selecione o tipo de rescisão',
            validacao: (valor) => valor !== ''
        },
        { 
            elem: salarioBruto, 
            msg: 'Informe um salário válido (maior que zero)',
            validacao: (valor) => !isNaN(valor) && parseFloat(valor) > 0
        },
        { 
            elem: tempoServico, 
            msg: 'Informe o tempo de serviço (mínimo 0)',
            validacao: (valor) => !isNaN(valor) && parseInt(valor) >= 0
        },
        { 
            elem: mesesAnoAtual, 
            msg: 'Informe os meses do ano atual (entre 1 e 12)',
            validacao: (valor) => !isNaN(valor) && parseInt(valor) >= 1 && parseInt(valor) <= 12
        },
        { 
            elem: diasTrabalhados, 
            msg: 'Informe os dias trabalhados (entre 0 e 31)',
            validacao: (valor) => !isNaN(valor) && parseInt(valor) >= 0 && parseInt(valor) <= 31
        }
    ];

    for (const campo of campos) {
        const valor = campo.elem.value;
        campo.elem.classList.remove('error');

        if (!campo.validacao(valor)) {
            campo.elem.classList.add('error');
            alert(campo.msg);
            campo.elem.focus();
            return false;
        }
    }

    return true;
}

// Função para calcular férias proporcionais
function calcularFerias(salario, mesesAnoAtual, diasTrabalhados) {
    const mesesAjustados = mesesAnoAtual + (diasTrabalhados >= 15 ? 1 : 0);
    const base = (salario / 12) * mesesAjustados;
    const terco = base / 3;
    const total = base + terco;

    return {
        base: base,
        terco: terco,
        total: total,
        mesesAjustados: mesesAjustados
    };
}

// Função para calcular décimo terceiro
function calcularDecimoTerceiro(salario, mesesAnoAtual, diasTrabalhados, tipoRescisao) {
    const mesesAjustados = mesesAnoAtual + (diasTrabalhados >= 15 ? 1 : 0);
    
    // Verificar regra especial para justa causa
    if (tipoRescisao === 'justa_causa' && mesesAjustados < 3) {
        return {
            valor: 0,
            mensagem: 'Não há direito ao 13º salário (menos de 3 meses trabalhados)'
        };
    }

    return {
        valor: (salario / 12) * mesesAjustados,
        mensagem: null
    };
}

// Função para atualizar detalhes do cálculo
function atualizarDetalhesCalculo(ferias, decimoTerceiro) {
    const detalhesFerias = document.getElementById('detalhesFerias');
    const detalhesDecimoTerceiro = document.getElementById('detalhesDecimoTerceiro');

    if (!detalhesFerias || !detalhesDecimoTerceiro) return;

    // Atualizar detalhes das férias
    detalhesFerias.innerHTML = `
        <div class="detalhe-linha">
            <span>Base (${ferias.mesesAjustados} meses):</span>
            <span>${formatMoney(ferias.base)}</span>
        </div>
        <div class="detalhe-linha">
            <span>1/3 Constitucional:</span>
            <span>${formatMoney(ferias.terco)}</span>
        </div>
        <div class="detalhe-linha">
            <span>Total:</span>
            <span>${formatMoney(ferias.total)}</span>
        </div>
    `;

    // Atualizar detalhes do décimo terceiro
    detalhesDecimoTerceiro.innerHTML = decimoTerceiro.mensagem 
        ? `<div class="detalhe-linha">${decimoTerceiro.mensagem}</div>`
        : `<div class="detalhe-linha">
            <span>Valor Proporcional:</span>
            <span>${formatMoney(decimoTerceiro.valor)}</span>
           </div>`;
}

// Função para calcular INSS (tabela 2025)
function calcularINSS(salarioBruto) {
    let inss = 0;
    let salarioRestante = salarioBruto;
    let faixaAnterior = 0;

    for (let faixa of FAIXAS_INSS) {
        if (salarioBruto > faixaAnterior) {
            let baseCalculo = Math.min(salarioBruto, faixa.limite) - faixaAnterior;
            inss += baseCalculo * faixa.aliquota;
            faixaAnterior = faixa.limite;
        }
    }

    return Math.min(inss, 876.97); // Teto do INSS 2025
}

// Função para calcular IRRF (tabela 2025)
function calcularIRRF(baseCalculo) {
    for (let faixa of FAIXAS_IRRF) {
        if (baseCalculo <= faixa.limite) {
            return Math.max(0, (baseCalculo * faixa.aliquota) - faixa.deducao);
        }
    }
    return 0;
}

// Função para atualizar campos visíveis baseado no tipo de rescisão
function atualizarCamposVisiveis() {
    const tipo = tipoRescisao.value;
    const diasTrabalhadosGroup = document.getElementById('diasTrabalhadosGroup');
    const avisoPrevioGroup = document.getElementById('avisoPrevioGroup');
    const motivoRescisaoGroup = document.getElementById('motivoRescisaoGroup');

    if (!diasTrabalhadosGroup || !avisoPrevioGroup || !motivoRescisaoGroup) return;

    // Reset display
    diasTrabalhadosGroup.classList.remove('hidden');
    avisoPrevioGroup.classList.add('hidden');
    motivoRescisaoGroup.classList.add('hidden');

    // Show relevant fields based on type
    if (tipo === 'pedido') {
        avisoPrevioGroup.classList.remove('hidden');
    } else if (tipo === 'prazo_determinado') {
        motivoRescisaoGroup.classList.remove('hidden');
    }
}

// Função para preencher valores de exemplo
function preencherExemplo() {
    tipoRescisao.value = 'sem_justa_causa';
    salarioBruto.value = '3000';
    tempoServico.value = '24';
    mesesAnoAtual.value = '6';
    diasTrabalhados.value = '15';
    if (avisoPrevio) {
        avisoPrevio.checked = false;
    }
    calcular();
}

// Função para alternar visibilidade dos detalhes
function toggleDetalhes() {
    if (!tabelaDetalhes || !btnDetalhes) return;
    
    const isHidden = tabelaDetalhes.style.display === 'none';
    tabelaDetalhes.style.display = isHidden ? 'block' : 'none';
    btnDetalhes.classList.toggle('active', isHidden);
    
    const icon = btnDetalhes.querySelector('i');
    if (icon) {
        icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
}

// Função para atualizar o gráfico
function atualizarGrafico(proventos, descontos, fgts, outrosValores) {
    const ctx = document.getElementById('graficoResultados').getContext('2d');
    
    if (graficoResultados) {
        graficoResultados.destroy();
    }

    graficoResultados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Proventos', 'Descontos', 'FGTS', 'Outros Valores'],
            datasets: [{
                data: [proventos, descontos, fgts, outrosValores],
                backgroundColor: [
                    '#4CAF50',
                    '#F44336',
                    '#2196F3',
                    '#FFC107'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff'
                    }
                }
            }
        }
    });
}

// Função para animar a barra de progresso
function animarProgresso(progresso) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progresso}%`;
}

// Função principal de cálculo
function calcular() {
    if (!validarCampos()) {
        return;
    }

    try {
        // Obter valores dos campos
        const tipo = tipoRescisao.value;
        const salarioBase = parseFloat(salarioBruto.value);
        const mesesTotal = parseInt(tempoServico.value);
        const mesesAno = parseInt(mesesAnoAtual.value);
        const dias = parseInt(diasTrabalhados.value);
        const avisoPrevioCumprido = avisoPrevio?.checked || false;
        
        // Validação de tempo de serviço
        if (mesesTotal > 120) {
            if (!confirm('Atenção: O tempo de serviço informado é superior a 120 meses. Deseja continuar?')) {
                return;
            }
        }

        animarProgresso(25);

        // Limpar resultados anteriores
        resultados = {};

        // Calcular férias e décimo terceiro
        const ferias = calcularFerias(salarioBase, mesesAno, dias);
        const decimoTerceiro = calcularDecimoTerceiro(salarioBase, mesesAno, dias, tipo);

        animarProgresso(50);

        // Adicionar resultados ao objeto de resultados
        resultados['Saldo de Salário'] = (salarioBase / 30) * dias;
        resultados['Férias Proporcionais'] = ferias.base;
        resultados['1/3 Férias Proporcionais'] = ferias.terco;
        
        if (decimoTerceiro.valor > 0) {
            resultados['13º Proporcional'] = decimoTerceiro.valor;
        }

        // FGTS
        const fgtsAcumulado = salarioBase * 0.08 * mesesTotal;
        resultados['FGTS Acumulado'] = fgtsAcumulado;

        animarProgresso(75);

        // Cálculos específicos por tipo
        switch(tipo) {
            case 'sem_justa_causa':
                resultados['Multa FGTS (40%)'] = fgtsAcumulado * 0.4;
                resultados['Aviso Prévio Indenizado'] = salarioBase;
                break;
                
            case 'pedido':
                if (!avisoPrevioCumprido) {
                    resultados['Desconto Aviso Prévio'] = -salarioBase;
                }
                break;
                
            case 'justa_causa':
                // Apenas direitos básicos
                break;
                
            case 'prazo_determinado':
                // Sem multa FGTS ou aviso prévio
                break;
        }

        // Cálculo de descontos
        let totalBruto = Object.values(resultados).reduce((a, b) => a + (b > 0 ? b : 0), 0);
        
        // INSS
        const inss = calcularINSS(totalBruto);
        resultados['Desconto INSS'] = -inss;

        // IRRF
        const baseIRRF = totalBruto - inss;
        if (baseIRRF > 2259.20) {
            const irrf = calcularIRRF(baseIRRF);
            resultados['Desconto IRRF'] = -irrf;
        }

        // Calcular totais
        const totalDescontos = Object.values(resultados).reduce((a, b) => a + (b < 0 ? Math.abs(b) : 0), 0);
        const totalProventos = Object.values(resultados).reduce((a, b) => a + (b > 0 ? b : 0), 0);
        const totalFGTS = fgtsAcumulado + (tipo === 'sem_justa_causa' ? fgtsAcumulado * 0.4 : 0);
        const totalLiquido = totalProventos - totalDescontos;

        // Atualizar interface
        document.getElementById('valorProventos').textContent = formatMoney(totalProventos);
        document.getElementById('valorDescontos').textContent = formatMoney(totalDescontos);
        document.getElementById('valorFGTS').textContent = formatMoney(totalFGTS);
        document.getElementById('valorLiquido').textContent = formatMoney(totalLiquido);

        // Atualizar tabela de detalhes
        const tbody = document.getElementById('resultadoTabela');
        tbody.innerHTML = '';
        
        for (const [descricao, valor] of Object.entries(resultados)) {
            const tr = document.createElement('tr');
            const valorClass = valor >= 0 ? 'valor-positivo' : 'valor-negativo';
            tr.innerHTML = `
                <td>${descricao}</td>
                <td class="${valorClass}">${formatMoney(valor)}</td>
            `;
            tbody.appendChild(tr);
        }

        // Adicionar linha do total
        const trTotal = document.createElement('tr');
        trTotal.className = 'total-row';
        const totalClass = totalLiquido >= 0 ? 'valor-positivo' : 'valor-negativo';
        trTotal.innerHTML = `
            <td>Total Líquido</td>
            <td class="${totalClass}">${formatMoney(totalLiquido)}</td>
        `;
        tbody.appendChild(trTotal);

        // Mostrar resultados
        document.getElementById('resultado').style.display = 'block';
        
        // Atualizar gráfico
        atualizarGrafico(totalProventos, totalDescontos, totalFGTS, 0);

        animarProgresso(100);

    } catch (erro) {
        console.error('Erro ao calcular rescisão:', erro);
        alert('Ocorreu um erro ao calcular a rescisão. Por favor, verifique os valores informados.');
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Inicializar elementos do DOM
        tipoRescisao = document.getElementById('tipoRescisao');
        salarioBruto = document.getElementById('salarioBruto');
        tempoServico = document.getElementById('tempoServico');
        mesesAnoAtual = document.getElementById('mesesAnoAtual');
        diasTrabalhados = document.getElementById('diasTrabalhados');
        avisoPrevio = document.getElementById('avisoPrevio');
        btnCalcular = document.getElementById('calcular');
        btnExemplo = document.getElementById('exemploValores');
        btnDetalhes = document.getElementById('verDetalhes');
        tabelaDetalhes = document.getElementById('tabelaDetalhes');
        progressBar = document.getElementById('progressBar');

        // Event Listeners
        btnCalcular.addEventListener('click', calcular);
        btnExemplo.addEventListener('click', preencherExemplo);
        btnDetalhes.addEventListener('click', toggleDetalhes);
        tipoRescisao.addEventListener('change', atualizarCamposVisiveis);

        console.log('Inicialização concluída com sucesso');
    } catch (erro) {
        console.error('Erro na inicialização:', erro);
    }
}); 
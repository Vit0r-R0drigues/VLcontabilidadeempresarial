// Constantes para o cálculo do IRRF 2025
const VALOR_DEPENDENTE = 189.59;
const DESCONTO_SIMPLIFICADO = 564.80;
const LIMITE_DESCONTO_SIMPLIFICADO = 2824.00;

// Tabela progressiva IRRF 2025
const FAIXAS_IRRF = [
    { limite: 2259.20, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
    { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
    { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
    { limite: Infinity, aliquota: 0.275, deducao: 896.00 }
];

// Tabela INSS 2024 (atualizar quando disponível a tabela 2025)
const FAIXAS_INSS = [
    { limite: 1412.00, aliquota: 0.075 },
    { limite: 2666.68, aliquota: 0.09 },
    { limite: 4000.03, aliquota: 0.12 },
    { limite: 7786.02, aliquota: 0.14 }
];

let graficoResultados = null;

// Função para calcular o INSS
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

    return Math.min(inss, 876.97); // Teto do INSS
}

// Função para calcular o IRRF
function calcularIRRF(baseCalculo) {
    for (let faixa of FAIXAS_IRRF) {
        if (baseCalculo <= faixa.limite) {
            return Math.max(0, (baseCalculo * faixa.aliquota) - faixa.deducao);
        }
    }
    return 0;
}

// Função para formatar valores monetários
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    });
}

// Função para atualizar o gráfico
function atualizarGrafico(salarioBruto, inss, deducoes, irrf) {
    const ctx = document.getElementById('graficoResultados').getContext('2d');
    
    if (graficoResultados) {
        graficoResultados.destroy();
    }

    graficoResultados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Salário Líquido', 'INSS', 'Deduções', 'IRRF'],
            datasets: [{
                data: [
                    salarioBruto - inss - deducoes - irrf,
                    inss,
                    deducoes,
                    irrf
                ],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#F44336'
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
    // Obtém os valores dos inputs
    const salarioBruto = parseFloat(document.getElementById('salarioBruto').value) || 0;
    const numDependentes = parseInt(document.getElementById('dependentes').value) || 0;
    const pensaoAlimenticia = parseFloat(document.getElementById('pensaoAlimenticia').value) || 0;
    const outrasDeducoes = parseFloat(document.getElementById('outrasDeducoes').value) || 0;

    // Inicia animação
    animarProgresso(25);

    // Calcula o INSS
    const inss = calcularINSS(salarioBruto);
    animarProgresso(50);

    // Calcula deduções totais
    const deducaoDependentes = numDependentes * VALOR_DEPENDENTE;
    const deducoesTotais = inss + deducaoDependentes + pensaoAlimenticia + outrasDeducoes;
    animarProgresso(75);

    // Calcula base de cálculo
    let baseCalculo = salarioBruto - deducoesTotais;

    // Aplica desconto simplificado se aplicável
    if (baseCalculo <= LIMITE_DESCONTO_SIMPLIFICADO) {
        baseCalculo = Math.max(0, baseCalculo - DESCONTO_SIMPLIFICADO);
    }

    // Calcula IRRF
    const irrf = calcularIRRF(baseCalculo);

    // Calcula alíquota efetiva
    const aliquotaEfetiva = baseCalculo > 0 ? (irrf / baseCalculo) * 100 : 0;

    // Atualiza os resultados na tela
    document.getElementById('baseCalculo').textContent = formatarMoeda(baseCalculo);
    document.getElementById('aliquota').textContent = `${aliquotaEfetiva.toFixed(2)}%`;
    document.getElementById('irrfFinal').textContent = formatarMoeda(irrf);

    // Atualiza o gráfico
    atualizarGrafico(salarioBruto, inss, deducoesTotais - inss, irrf);
    animarProgresso(100);
}

// Função para preencher valores de exemplo
function preencherExemplo() {
    document.getElementById('salarioBruto').value = '5000.00';
    document.getElementById('dependentes').value = '1';
    document.getElementById('pensaoAlimenticia').value = '0.00';
    document.getElementById('outrasDeducoes').value = '0.00';
    calcular();
}

// Função para mostrar/ocultar detalhes
function toggleDetalhes() {
    const detalhes = document.getElementById('tabelaDetalhes');
    const btnDetalhes = document.getElementById('verDetalhes');
    const icone = btnDetalhes.querySelector('i');
    
    if (detalhes.style.display === 'none') {
        detalhes.style.display = 'block';
        icone.className = 'fas fa-chevron-up';
    } else {
        detalhes.style.display = 'none';
        icone.className = 'fas fa-chevron-down';
    }
}

// Adiciona eventos aos inputs e botões
document.addEventListener('DOMContentLoaded', function() {
    const inputs = [
        'salarioBruto',
        'dependentes',
        'pensaoAlimenticia',
        'outrasDeducoes'
    ];

    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', calcular);
    });

    document.getElementById('calcular').addEventListener('click', calcular);
    document.getElementById('exemploValores').addEventListener('click', preencherExemplo);
    document.getElementById('verDetalhes').addEventListener('click', toggleDetalhes);

    // Inicializa a calculadora
    calcular();
}); 
// Constantes para cálculos
const INSS_FAIXAS = [
    { limite: 1412.00, aliquota: 0.075 },
    { limite: 2666.68, aliquota: 0.09 },
    { limite: 5400.00, aliquota: 0.12 },
    { limite: Infinity, aliquota: 0.14 }
];

const IRRF_FAIXAS = [
    { limite: 1903.98, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 142.80 },
    { limite: 3751.05, aliquota: 0.15, deducao: 354.80 },
    { limite: 4664.68, aliquota: 0.225, deducao: 636.13 },
    { limite: Infinity, aliquota: 0.275, deducao: 869.36 }
];

// Elementos do DOM
const elementos = {
    salarioBase: document.getElementById('salarioBase'),
    diasFerias: document.getElementById('diasFerias'),
    horasExtras: document.getElementById('horasExtras'),
    venderFerias: document.getElementById('venderFerias'),
    diasVendidos: document.getElementById('diasVendidos'),
    diasVendidosContainer: document.getElementById('diasVendidosContainer'),
    diasVendidosValue: document.getElementById('diasVendidosValue'),
    calcular: document.getElementById('calcular'),
    exemploValores: document.getElementById('exemploValores'),
    valorBruto: document.getElementById('valorBruto'),
    valorDescontos: document.getElementById('valorDescontos'),
    valorLiquido: document.getElementById('valorLiquido'),
    progressBar: document.getElementById('progressBar'),
    stepsContainer: document.getElementById('stepsContainer'),
    verDetalhes: document.getElementById('verDetalhes'),
    tabelaDetalhes: document.getElementById('tabelaDetalhes'),
    graficoResultados: document.getElementById('graficoResultados')
};

// Variáveis globais
let grafico = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    elementos.venderFerias.addEventListener('change', toggleDiasVendidos);
    elementos.diasVendidos.addEventListener('input', atualizarDiasVendidosValue);
    elementos.calcular.addEventListener('click', calcularFerias);
    elementos.exemploValores.addEventListener('click', preencherExemplo);
    elementos.verDetalhes.addEventListener('click', toggleDetalhes);

    // Inicialização
    criarGrafico([0, 0, 0]);
});

// Funções de UI
function toggleDiasVendidos() {
    elementos.diasVendidosContainer.style.display = 
        elementos.venderFerias.checked ? 'block' : 'none';
}

function atualizarDiasVendidosValue() {
    elementos.diasVendidosValue.textContent = `${elementos.diasVendidos.value} dias`;
}

function toggleDetalhes() {
    const estaVisivel = elementos.tabelaDetalhes.style.display !== 'none';
    elementos.tabelaDetalhes.style.display = estaVisivel ? 'none' : 'block';
    elementos.verDetalhes.querySelector('i').className = 
        `fas fa-chevron-${estaVisivel ? 'down' : 'up'}`;
}

function preencherExemplo() {
    elementos.salarioBase.value = '3000';
    elementos.diasFerias.value = '20';
    elementos.horasExtras.value = '250';
    elementos.venderFerias.checked = true;
    toggleDiasVendidos();
    elementos.diasVendidos.value = '10';
    atualizarDiasVendidosValue();
}

// Implementar memoização para cálculos repetitivos
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Aplicar memoização nos cálculos
const calcularINSS = memoize((salario) => {
    let inss = 0;
    let baseCalculo = salario;
    
    for (let faixa of INSS_FAIXAS) {
        if (baseCalculo > 0) {
            const baseParaFaixa = Math.min(baseCalculo, faixa.limite);
            inss += baseParaFaixa * faixa.aliquota;
            baseCalculo -= baseParaFaixa;
        }
    }
    
    return Math.min(inss, 5400.00 * 0.14); // Teto do INSS
});

function calcularIRRF(valor) {
    const faixa = IRRF_FAIXAS.find(f => valor <= f.limite);
    return Math.max(0, (valor * faixa.aliquota) - faixa.deducao);
}

function calcularFerias() {
    // Validação dos inputs
    if (!validarInputs()) return;

    // Valores base
    const salarioBase = parseFloat(elementos.salarioBase.value);
    const diasFerias = parseInt(elementos.diasFerias.value);
    const horasExtras = parseFloat(elementos.horasExtras.value) || 0;
    const vendeuFerias = elementos.venderFerias.checked;
    const diasVendidos = vendeuFerias ? parseInt(elementos.diasVendidos.value) : 0;

    // Cálculos
    const valorDiario = (salarioBase + horasExtras) / 30;
    const valorFerias = valorDiario * diasFerias;
    const adicionalUmTerco = valorFerias / 3;
    const valorAbono = vendeuFerias ? (valorDiario * diasVendidos) + (valorDiario * diasVendidos / 3) : 0;
    
    const valorBrutoTotal = valorFerias + adicionalUmTerco + valorAbono;
    const inss = calcularINSS(valorBrutoTotal);
    const baseIRRF = valorBrutoTotal - inss;
    const irrf = calcularIRRF(baseIRRF);
    
    const descontos = inss + irrf;
    const valorLiquido = valorBrutoTotal - descontos;

    // Atualizar UI
    atualizarUI(valorBrutoTotal, descontos, valorLiquido);
    atualizarPassos({
        salarioBase,
        diasFerias,
        horasExtras,
        valorDiario,
        valorFerias,
        adicionalUmTerco,
        valorAbono,
        valorBrutoTotal,
        inss,
        irrf,
        valorLiquido
    });
}

function validarInputs() {
    if (!elementos.salarioBase.value) {
        alert('Por favor, informe o salário base.');
        return false;
    }
    
    const diasFerias = parseInt(elementos.diasFerias.value);
    if (diasFerias < 10 || diasFerias > 30) {
        alert('Os dias de férias devem estar entre 10 e 30.');
        return false;
    }
    
    return true;
}

function atualizarUI(bruto, descontos, liquido) {
    elementos.valorBruto.textContent = formatarMoeda(bruto);
    elementos.valorDescontos.textContent = formatarMoeda(descontos);
    elementos.valorLiquido.textContent = formatarMoeda(liquido);
    
    atualizarGrafico([bruto, descontos, liquido]);
}

function atualizarPassos(dados) {
    const passos = [
        {
            titulo: 'Valor Base Diário',
            descricao: `(${formatarMoeda(dados.salarioBase)} + ${formatarMoeda(dados.horasExtras)}) ÷ 30 = ${formatarMoeda(dados.valorDiario)}`
        },
        {
            titulo: 'Valor das Férias',
            descricao: `${formatarMoeda(dados.valorDiario)} × ${dados.diasFerias} = ${formatarMoeda(dados.valorFerias)}`
        },
        {
            titulo: 'Adicional de 1/3',
            descricao: `${formatarMoeda(dados.valorFerias)} ÷ 3 = ${formatarMoeda(dados.adicionalUmTerco)}`
        }
    ];

    if (dados.valorAbono > 0) {
        passos.push({
            titulo: 'Abono Pecuniário',
            descricao: `${formatarMoeda(dados.valorAbono)}`
        });
    }

    passos.push(
        {
            titulo: 'Desconto INSS',
            descricao: `${formatarMoeda(dados.inss)}`
        },
        {
            titulo: 'Desconto IRRF',
            descricao: `${formatarMoeda(dados.irrf)}`
        },
        {
            titulo: 'Valor Líquido Final',
            descricao: `${formatarMoeda(dados.valorLiquido)}`
        }
    );

    // Atualizar container de passos
    elementos.stepsContainer.innerHTML = '';
    passos.forEach((passo, index) => {
        const step = document.createElement('div');
        step.className = 'step';
        step.innerHTML = `
            <div class="step-number">${index + 1}</div>
            <div class="step-content">
                <h4>${passo.titulo}</h4>
                <p>${passo.descricao}</p>
            </div>
        `;
        elementos.stepsContainer.appendChild(step);
    });

    // Atualizar barra de progresso
    elementos.progressBar.style.width = '100%';
}

// Funções do Gráfico
function criarGrafico(dados) {
    if (grafico) {
        grafico.destroy();
    }

    const ctx = elementos.graficoResultados.getContext('2d');
    grafico = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Valor Bruto', 'Descontos', 'Valor Líquido'],
            datasets: [{
                data: dados,
                backgroundColor: [
                    '#4CAF50',
                    '#F44336',
                    '#2196F3'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function atualizarGrafico(dados) {
    if (grafico) {
        grafico.data.datasets[0].data = dados;
        grafico.update();
    } else {
        criarGrafico(dados);
    }
}

// Funções Utilitárias
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
} 
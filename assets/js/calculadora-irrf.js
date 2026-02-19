const IRRF_CONFIG_2026 = {
    deducaoDependente: 189.59,
    descontoSimplificado: 607.20,
    reducaoMaxima: 312.89,
    faixaReducaoAte: 5000.0,
    faixaReducaoFim: 7350.0,
    reducaoCoeficienteA: 978.62,
    reducaoCoeficienteB: 0.133145,
    faixasIRRF: [
        { limite: 2428.80, aliquota: 0, deducao: 0 },
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
    ]
};

const STORAGE_KEY = 'vl_irrf_2026_form_v1';

let graficoResultados = null;
const calcUI = window.CalculadoraUI || null;

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function atualizarTextoMoeda(elemento, valor) {
    if (!elemento) return;
    if (calcUI && typeof calcUI.animateCurrency === 'function') {
        calcUI.animateCurrency(elemento, valor);
        return;
    }
    elemento.textContent = formatarMoeda(valor);
}

function atualizarTextoPercentual(elemento, valor) {
    if (!elemento) return;
    if (calcUI && typeof calcUI.animatePercent === 'function') {
        calcUI.animatePercent(elemento, valor);
        return;
    }
    elemento.textContent = `${Number(valor || 0).toFixed(2).replace('.', ',')}%`;
}

function marcarAtualizacao(elemento) {
    if (!elemento || !calcUI || typeof calcUI.pulseElement !== 'function') return;
    calcUI.pulseElement(elemento);
}

function arredondar(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function calcularINSSProgressivo(rendimento) {
    const salario = Math.max(0, Number(rendimento) || 0);
    let total = 0;
    let faixaAnterior = 0;

    IRRF_CONFIG_2026.faixasINSS.forEach((faixa) => {
        if (salario <= faixaAnterior) return;
        const baseFaixa = Math.min(salario, faixa.limite) - faixaAnterior;
        total += baseFaixa * faixa.aliquota;
        faixaAnterior = faixa.limite;
    });

    return arredondar(total);
}

function calcularIRRFBruto(baseCalculo) {
    const base = Math.max(0, Number(baseCalculo) || 0);
    const faixa = IRRF_CONFIG_2026.faixasIRRF.find((item) => base <= item.limite) || IRRF_CONFIG_2026.faixasIRRF[0];
    const imposto = Math.max(0, base * faixa.aliquota - faixa.deducao);

    return {
        faixa,
        imposto: arredondar(imposto)
    };
}

function calcularReducaoLei15270(rendimentoBruto, impostoBruto) {
    const rendimento = Math.max(0, Number(rendimentoBruto) || 0);
    const imposto = Math.max(0, Number(impostoBruto) || 0);
    let reducaoTeorica = 0;

    if (rendimento <= IRRF_CONFIG_2026.faixaReducaoAte) {
        reducaoTeorica = IRRF_CONFIG_2026.reducaoMaxima;
    } else if (rendimento <= IRRF_CONFIG_2026.faixaReducaoFim) {
        reducaoTeorica =
            IRRF_CONFIG_2026.reducaoCoeficienteA - (IRRF_CONFIG_2026.reducaoCoeficienteB * rendimento);
    }

    const reducaoAplicada = Math.min(imposto, Math.max(0, reducaoTeorica));
    return arredondar(reducaoAplicada);
}

function preencherTabelaReferencia() {
    const tbody = document.getElementById('tabelaIRRFTbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    IRRF_CONFIG_2026.faixasIRRF.forEach((faixa, index) => {
        const faixaAnterior = index === 0 ? 0 : IRRF_CONFIG_2026.faixasIRRF[index - 1].limite + 0.01;
        const limiteTexto = faixa.limite === Infinity
            ? `Acima de ${formatarMoeda(faixaAnterior)}`
            : `${index === 0 ? 'Até' : 'De'} ${formatarMoeda(index === 0 ? faixa.limite : faixaAnterior)} ${index === 0 ? '' : `até ${formatarMoeda(faixa.limite)}`}`;

        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td data-label="Faixa de Base Mensal">${limiteTexto.trim()}</td>
            <td data-label="Alíquota">${(faixa.aliquota * 100).toFixed(1).replace('.', ',')}%</td>
            <td data-label="Parcela a Deduzir">${formatarMoeda(faixa.deducao)}</td>
        `;
        tbody.appendChild(linha);
    });
}

function atualizarGrafico(rendimentoBruto, inss, irrf, outrasDeducoes) {
    const canvas = document.getElementById('graficoResultados');
    if (!canvas) return;

    const liquido = Math.max(0, rendimentoBruto - inss - irrf - outrasDeducoes);
    const ctx = canvas.getContext('2d');

    if (graficoResultados) {
        graficoResultados.destroy();
    }

    graficoResultados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Líquido estimado', 'INSS', 'IRRF', 'Outras deduções'],
            datasets: [{
                data: [liquido, inss, irrf, outrasDeducoes],
                backgroundColor: ['#0f766e', '#0a7dd1', '#d46d13', '#64748b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#334155' }
                }
            }
        }
    });
}

function salvarUltimaSimulacao() {
    const dados = {
        salarioBruto: document.getElementById('salarioBruto')?.value || '',
        dependentes: document.getElementById('dependentes')?.value || '',
        pensaoAlimenticia: document.getElementById('pensaoAlimenticia')?.value || '',
        outrasDeducoes: document.getElementById('outrasDeducoes')?.value || ''
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function restaurarUltimaSimulacao() {
    let dados;
    try {
        dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (error) {
        dados = {};
    }

    ['salarioBruto', 'dependentes', 'pensaoAlimenticia', 'outrasDeducoes'].forEach((id) => {
        if (dados[id] !== undefined && document.getElementById(id)) {
            document.getElementById(id).value = dados[id];
        }
    });
}

function atualizarProgresso(percentual) {
    const barra = document.getElementById('progressBar');
    if (barra) {
        if (calcUI && typeof calcUI.updateProgress === 'function') {
            calcUI.updateProgress(barra, percentual);
            return;
        }
        barra.style.width = `${percentual}%`;
    }
}

function focarResultadoComDestaque() {
    const secao = document.querySelector('.resultados');
    if (!secao) return;
    if (calcUI && typeof calcUI.focusResults === 'function') {
        calcUI.focusResults(secao);
        return;
    }
    secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function calcular() {
    const salarioBruto = Math.max(0, parseFloat(document.getElementById('salarioBruto')?.value) || 0);
    const dependentes = Math.max(0, parseInt(document.getElementById('dependentes')?.value, 10) || 0);
    const pensaoAlimenticia = Math.max(0, parseFloat(document.getElementById('pensaoAlimenticia')?.value) || 0);
    const outrasDeducoes = Math.max(0, parseFloat(document.getElementById('outrasDeducoes')?.value) || 0);

    atualizarProgresso(15);

    const inss = calcularINSSProgressivo(salarioBruto);
    const deducaoDependentes = dependentes * IRRF_CONFIG_2026.deducaoDependente;
    const deducoesLegais = inss + deducaoDependentes + pensaoAlimenticia + outrasDeducoes;

    atualizarProgresso(40);

    const deducaoAplicadaValor = Math.max(deducoesLegais, IRRF_CONFIG_2026.descontoSimplificado);
    const tipoDeducao = deducoesLegais >= IRRF_CONFIG_2026.descontoSimplificado
        ? 'Deduções legais'
        : 'Desconto simplificado mensal';

    const baseCalculo = Math.max(0, salarioBruto - deducaoAplicadaValor);

    atualizarProgresso(65);

    const irrfBruto = calcularIRRFBruto(baseCalculo).imposto;
    const reducaoLei = calcularReducaoLei15270(salarioBruto, irrfBruto);
    const irrfFinal = Math.max(0, irrfBruto - reducaoLei);
    const aliquotaEfetiva = salarioBruto > 0 ? (irrfFinal / salarioBruto) * 100 : 0;

    atualizarProgresso(85);

    const baseCalculoElem = document.getElementById('baseCalculo');
    const aliquotaElem = document.getElementById('aliquota');
    const irrfFinalElem = document.getElementById('irrfFinal');
    const inssElem = document.getElementById('inssCalculado');
    const deducaoElem = document.getElementById('deducaoAplicada');
    const reducaoElem = document.getElementById('reducaoAplicada');

    atualizarTextoMoeda(baseCalculoElem, baseCalculo);
    atualizarTextoPercentual(aliquotaElem, aliquotaEfetiva);
    atualizarTextoMoeda(irrfFinalElem, irrfFinal);
    atualizarTextoMoeda(inssElem, inss);
    if (deducaoElem) {
        deducaoElem.textContent = `${tipoDeducao} (${formatarMoeda(deducaoAplicadaValor)})`;
        marcarAtualizacao(deducaoElem);
    }
    atualizarTextoMoeda(reducaoElem, reducaoLei);

    atualizarGrafico(salarioBruto, inss, irrfFinal, pensaoAlimenticia + outrasDeducoes + deducaoDependentes);
    salvarUltimaSimulacao();
    atualizarProgresso(100);
}

function preencherExemplo() {
    const campos = {
        salarioBruto: '6200',
        dependentes: '1',
        pensaoAlimenticia: '0',
        outrasDeducoes: '200'
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = valor;
    });

    calcular();
}

function toggleDetalhes() {
    const detalhes = document.getElementById('tabelaDetalhes');
    const botao = document.getElementById('verDetalhes');
    const icone = botao?.querySelector('i');
    if (!detalhes || !botao || !icone) return;

    const abriu = detalhes.style.display === 'none';
    detalhes.style.display = abriu ? 'block' : 'none';
    icone.className = abriu ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

function registrarEventos() {
    const entradas = ['salarioBruto', 'dependentes', 'pensaoAlimenticia', 'outrasDeducoes'];
    entradas.forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', calcular);
            campo.addEventListener('change', salvarUltimaSimulacao);
        }
    });

    document.getElementById('calcular')?.addEventListener('click', () => {
        calcular();
        focarResultadoComDestaque();
    });
    document.getElementById('exemploValores')?.addEventListener('click', () => {
        preencherExemplo();
        focarResultadoComDestaque();
    });
    document.getElementById('verDetalhes')?.addEventListener('click', toggleDetalhes);
}

document.addEventListener('DOMContentLoaded', () => {
    preencherTabelaReferencia();
    restaurarUltimaSimulacao();
    registrarEventos();
    calcular();
});

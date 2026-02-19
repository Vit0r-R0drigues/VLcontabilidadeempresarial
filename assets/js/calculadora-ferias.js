const FERIAS_CONFIG_2026 = {
    descontoSimplificado: 607.20,
    faixasINSS: [
        { limite: 1621.00, aliquota: 0.075 },
        { limite: 2902.84, aliquota: 0.09 },
        { limite: 4354.27, aliquota: 0.12 },
        { limite: 8475.55, aliquota: 0.14 }
    ],
    faixasIRRF: [
        { limite: 2428.80, aliquota: 0, deducao: 0 },
        { limite: 2826.65, aliquota: 0.075, deducao: 182.16 },
        { limite: 3751.05, aliquota: 0.15, deducao: 394.16 },
        { limite: 4664.68, aliquota: 0.225, deducao: 675.49 },
        { limite: Infinity, aliquota: 0.275, deducao: 908.73 }
    ],
    reducaoMaxima: 312.89,
    faixaReducaoAte: 5000,
    faixaReducaoFim: 7350,
    reducaoCoeficienteA: 978.62,
    reducaoCoeficienteB: 0.133145
};

const STORAGE_KEY = 'vl_ferias_2026_form_v1';

let chartFerias = null;

const elementos = {};

function obterElemento(id) {
    return document.getElementById(id);
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function arredondar(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function calcularINSS(valor) {
    const base = Math.max(0, Number(valor) || 0);
    let total = 0;
    let anterior = 0;

    FERIAS_CONFIG_2026.faixasINSS.forEach((faixa) => {
        if (base <= anterior) return;
        const baseFaixa = Math.min(base, faixa.limite) - anterior;
        total += baseFaixa * faixa.aliquota;
        anterior = faixa.limite;
    });

    return arredondar(total);
}

function calcularIRRFBruto(base) {
    const faixa = FERIAS_CONFIG_2026.faixasIRRF.find((item) => base <= item.limite) || FERIAS_CONFIG_2026.faixasIRRF[0];
    return arredondar(Math.max(0, base * faixa.aliquota - faixa.deducao));
}

function calcularReducaoLei15270(rendimento, impostoBruto) {
    const bruto = Math.max(0, Number(rendimento) || 0);
    const imposto = Math.max(0, Number(impostoBruto) || 0);
    let reducaoTeorica = 0;

    if (bruto <= FERIAS_CONFIG_2026.faixaReducaoAte) {
        reducaoTeorica = FERIAS_CONFIG_2026.reducaoMaxima;
    } else if (bruto <= FERIAS_CONFIG_2026.faixaReducaoFim) {
        reducaoTeorica = FERIAS_CONFIG_2026.reducaoCoeficienteA - (FERIAS_CONFIG_2026.reducaoCoeficienteB * bruto);
    }

    return arredondar(Math.min(imposto, Math.max(0, reducaoTeorica)));
}

function toggleDiasVendidos() {
    if (!elementos.diasVendidosContainer || !elementos.venderFerias) return;
    elementos.diasVendidosContainer.style.display = elementos.venderFerias.checked ? 'block' : 'none';
}

function atualizarFaixaAbono() {
    if (!elementos.diasFerias || !elementos.diasVendidos || !elementos.maxDiasVendidos) return;

    const diasFerias = Math.max(10, Math.min(30, parseInt(elementos.diasFerias.value, 10) || 30));
    const maximoAbono = Math.floor(diasFerias / 3);
    elementos.diasVendidos.max = String(maximoAbono);
    elementos.maxDiasVendidos.textContent = String(maximoAbono);

    if ((parseInt(elementos.diasVendidos.value, 10) || 0) > maximoAbono) {
        elementos.diasVendidos.value = String(maximoAbono);
    }
    atualizarDiasVendidosValue();
}

function atualizarDiasVendidosValue() {
    if (!elementos.diasVendidosValue || !elementos.diasVendidos) return;
    const dias = parseInt(elementos.diasVendidos.value, 10) || 0;
    elementos.diasVendidosValue.textContent = `${dias} dias`;
}

function atualizarProgresso(percentual) {
    if (elementos.progressBar) {
        elementos.progressBar.style.width = `${percentual}%`;
    }
}

function salvarUltimosDados() {
    const dados = {
        salarioBase: elementos.salarioBase?.value || '',
        diasFerias: elementos.diasFerias?.value || '',
        horasExtras: elementos.horasExtras?.value || '',
        venderFerias: elementos.venderFerias?.checked || false,
        diasVendidos: elementos.diasVendidos?.value || '0'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function restaurarUltimosDados() {
    let dados;
    try {
        dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (error) {
        dados = {};
    }

    if (elementos.salarioBase && dados.salarioBase !== undefined) elementos.salarioBase.value = dados.salarioBase;
    if (elementos.diasFerias && dados.diasFerias !== undefined) elementos.diasFerias.value = dados.diasFerias;
    if (elementos.horasExtras && dados.horasExtras !== undefined) elementos.horasExtras.value = dados.horasExtras;
    if (elementos.venderFerias && dados.venderFerias !== undefined) elementos.venderFerias.checked = !!dados.venderFerias;
    if (elementos.diasVendidos && dados.diasVendidos !== undefined) elementos.diasVendidos.value = dados.diasVendidos;
}

function atualizarGrafico(dados) {
    if (!elementos.graficoResultados) return;
    const ctx = elementos.graficoResultados.getContext('2d');

    if (chartFerias) {
        chartFerias.destroy();
    }

    chartFerias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Férias + 1/3', 'Abono', 'Descontos', 'Líquido'],
            datasets: [{
                data: [dados.feriasComTerco, dados.abonoTotal, dados.descontos, dados.liquido],
                backgroundColor: ['#0a7dd1', '#d46d13', '#c2410c', '#0f766e']
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

function atualizarPassos(dados) {
    if (!elementos.stepsContainer) return;

    const passos = [
        `Valor diário: (${formatarMoeda(dados.salarioBase)} + ${formatarMoeda(dados.mediaVariavel)}) ÷ 30 = ${formatarMoeda(dados.valorDiario)}`,
        `Férias do período: ${formatarMoeda(dados.valorFerias)} + 1/3 (${formatarMoeda(dados.tercoFerias)})`,
        `Abono pecuniário: ${formatarMoeda(dados.abono)} + 1/3 (${formatarMoeda(dados.tercoAbono)})`,
        `Descontos estimados: INSS ${formatarMoeda(dados.inss)} + IRRF ${formatarMoeda(dados.irrf)}`
    ];

    elementos.stepsContainer.innerHTML = '';
    passos.forEach((texto, indice) => {
        const step = document.createElement('div');
        step.className = 'step';
        step.innerHTML = `
            <div class="step-number">${indice + 1}</div>
            <div class="step-content"><p>${texto}</p></div>
        `;
        elementos.stepsContainer.appendChild(step);
    });
}

function atualizarDetalhes(dados) {
    if (!elementos.detalhesContainer) return;
    elementos.detalhesContainer.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Férias proporcionais no período</td><td>${formatarMoeda(dados.valorFerias)}</td></tr>
                    <tr><td>Adicional de 1/3 sobre férias</td><td>${formatarMoeda(dados.tercoFerias)}</td></tr>
                    <tr><td>Abono pecuniário</td><td>${formatarMoeda(dados.abono)}</td></tr>
                    <tr><td>1/3 do abono</td><td>${formatarMoeda(dados.tercoAbono)}</td></tr>
                    <tr><td>INSS estimado</td><td class="valor-negativo">-${formatarMoeda(dados.inss)}</td></tr>
                    <tr><td>IRRF estimado</td><td class="valor-negativo">-${formatarMoeda(dados.irrf)}</td></tr>
                    <tr><td><strong>Total líquido estimado</strong></td><td><strong>${formatarMoeda(dados.liquido)}</strong></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function validarDados(exibirAlerta = false) {
    const salarioBase = parseFloat(elementos.salarioBase?.value) || 0;
    const diasFerias = parseInt(elementos.diasFerias?.value, 10) || 0;

    if (salarioBase <= 0) {
        if (exibirAlerta) {
            alert('Informe um salário base válido.');
        }
        return false;
    }
    if (diasFerias < 10 || diasFerias > 30) {
        if (exibirAlerta) {
            alert('Dias de férias devem estar entre 10 e 30.');
        }
        return false;
    }
    return true;
}

function calcularFerias(exibirAlerta = false) {
    if (!validarDados(exibirAlerta)) return;

    atualizarProgresso(20);

    const salarioBase = parseFloat(elementos.salarioBase.value) || 0;
    const diasFerias = parseInt(elementos.diasFerias.value, 10) || 30;
    const mediaVariavel = parseFloat(elementos.horasExtras.value) || 0;
    const vendeAbono = !!elementos.venderFerias.checked;
    const diasVendidos = vendeAbono ? (parseInt(elementos.diasVendidos.value, 10) || 0) : 0;

    const valorDiario = (salarioBase + mediaVariavel) / 30;
    const valorFerias = valorDiario * diasFerias;
    const tercoFerias = valorFerias / 3;
    const feriasComTerco = valorFerias + tercoFerias;

    atualizarProgresso(45);

    const abono = vendeAbono ? valorDiario * diasVendidos : 0;
    const tercoAbono = abono / 3;
    const abonoTotal = abono + tercoAbono;

    const baseTributavel = feriasComTerco;
    const inss = calcularINSS(baseTributavel);
    const deducaoAplicada = Math.max(inss, FERIAS_CONFIG_2026.descontoSimplificado);
    const baseIRRF = Math.max(0, baseTributavel - deducaoAplicada);
    const irrfBruto = calcularIRRFBruto(baseIRRF);
    const reducao = calcularReducaoLei15270(baseTributavel, irrfBruto);
    const irrf = Math.max(0, irrfBruto - reducao);

    atualizarProgresso(70);

    const descontos = inss + irrf;
    const brutoTotal = feriasComTerco + abonoTotal;
    const liquido = brutoTotal - descontos;

    const dados = {
        salarioBase,
        mediaVariavel,
        valorDiario: arredondar(valorDiario),
        valorFerias: arredondar(valorFerias),
        tercoFerias: arredondar(tercoFerias),
        feriasComTerco: arredondar(feriasComTerco),
        abono: arredondar(abono),
        tercoAbono: arredondar(tercoAbono),
        abonoTotal: arredondar(abonoTotal),
        inss,
        irrf: arredondar(irrf),
        descontos: arredondar(descontos),
        liquido: arredondar(liquido)
    };

    if (elementos.valorBruto) elementos.valorBruto.textContent = formatarMoeda(brutoTotal);
    if (elementos.valorDescontos) elementos.valorDescontos.textContent = formatarMoeda(dados.descontos);
    if (elementos.valorLiquido) elementos.valorLiquido.textContent = formatarMoeda(dados.liquido);
    if (elementos.inssResultado) elementos.inssResultado.textContent = formatarMoeda(dados.inss);
    if (elementos.irrfResultado) elementos.irrfResultado.textContent = formatarMoeda(dados.irrf);
    if (elementos.abonoResultado) elementos.abonoResultado.textContent = formatarMoeda(dados.abonoTotal);

    atualizarPassos(dados);
    atualizarDetalhes(dados);
    atualizarGrafico(dados);

    salvarUltimosDados();
    atualizarProgresso(100);
}

function preencherExemplo() {
    if (elementos.salarioBase) elementos.salarioBase.value = '4200';
    if (elementos.diasFerias) elementos.diasFerias.value = '20';
    if (elementos.horasExtras) elementos.horasExtras.value = '300';
    if (elementos.venderFerias) elementos.venderFerias.checked = true;
    toggleDiasVendidos();
    atualizarFaixaAbono();
    if (elementos.diasVendidos) elementos.diasVendidos.value = String(Math.min(6, parseInt(elementos.diasVendidos.max, 10) || 6));
    atualizarDiasVendidosValue();
    calcularFerias(false);
}

function toggleDetalhes() {
    if (!elementos.tabelaDetalhes || !elementos.verDetalhes) return;
    const abriu = elementos.tabelaDetalhes.style.display === 'none';
    elementos.tabelaDetalhes.style.display = abriu ? 'block' : 'none';

    const icone = elementos.verDetalhes.querySelector('i');
    if (icone) icone.className = abriu ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

function registrarEventos() {
    elementos.venderFerias?.addEventListener('change', () => {
        toggleDiasVendidos();
        atualizarFaixaAbono();
        calcularFerias(false);
    });
    elementos.diasFerias?.addEventListener('input', () => {
        atualizarFaixaAbono();
        calcularFerias(false);
    });
    elementos.diasVendidos?.addEventListener('input', () => {
        atualizarDiasVendidosValue();
        calcularFerias(false);
    });
    elementos.salarioBase?.addEventListener('input', () => calcularFerias(false));
    elementos.horasExtras?.addEventListener('input', () => calcularFerias(false));
    elementos.calcular?.addEventListener('click', () => calcularFerias(true));
    elementos.exemploValores?.addEventListener('click', preencherExemplo);
    elementos.verDetalhes?.addEventListener('click', toggleDetalhes);
}

function mapearElementos() {
    [
        'salarioBase',
        'diasFerias',
        'horasExtras',
        'venderFerias',
        'diasVendidos',
        'diasVendidosContainer',
        'diasVendidosValue',
        'maxDiasVendidos',
        'calcular',
        'exemploValores',
        'valorBruto',
        'valorDescontos',
        'valorLiquido',
        'inssResultado',
        'irrfResultado',
        'abonoResultado',
        'progressBar',
        'stepsContainer',
        'verDetalhes',
        'tabelaDetalhes',
        'detalhesContainer',
        'graficoResultados'
    ].forEach((id) => {
        elementos[id] = obterElemento(id);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    mapearElementos();
    restaurarUltimosDados();
    toggleDiasVendidos();
    atualizarFaixaAbono();
    registrarEventos();
    calcularFerias(false);
});

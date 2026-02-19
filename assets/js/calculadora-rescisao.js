const RESCISAO_CONFIG = {
    storageKey: 'vl_rescisao_2026_form_v1'
};

let graficoRescisao = null;
const calcUI = window.CalculadoraUI || null;

const refs = {};

function getEl(id) {
    return document.getElementById(id);
}

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

function marcarAtualizacao(elemento) {
    if (!elemento || !calcUI || typeof calcUI.pulseElement !== 'function') return;
    calcUI.pulseElement(elemento);
}

function round2(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function mapearElementos() {
    [
        'tipoRescisao',
        'salarioBruto',
        'tempoServico',
        'mesesAnoAtual',
        'diasTrabalhados',
        'avisoPrevio',
        'motivoRescisao',
        'feriasVencidas',
        'saldoFGTS',
        'descontosExtras',
        'calcular',
        'exemploValores',
        'verDetalhes',
        'tabelaDetalhes',
        'resultado',
        'resultadoTabela',
        'progressBar',
        'valorProventos',
        'valorDescontos',
        'valorFGTS',
        'valorLiquido',
        'graficoResultados',
        'diasTrabalhadosGroup',
        'avisoPrevioGroup',
        'motivoRescisaoGroup',
        'stepsContainer'
    ].forEach((id) => {
        refs[id] = getEl(id);
    });
}

function salvarDados() {
    const payload = {
        tipoRescisao: refs.tipoRescisao?.value || '',
        salarioBruto: refs.salarioBruto?.value || '',
        tempoServico: refs.tempoServico?.value || '',
        mesesAnoAtual: refs.mesesAnoAtual?.value || '',
        diasTrabalhados: refs.diasTrabalhados?.value || '',
        avisoPrevio: refs.avisoPrevio?.checked || false,
        motivoRescisao: refs.motivoRescisao?.value || '',
        feriasVencidas: refs.feriasVencidas?.value || '0',
        saldoFGTS: refs.saldoFGTS?.value || '',
        descontosExtras: refs.descontosExtras?.value || ''
    };

    localStorage.setItem(RESCISAO_CONFIG.storageKey, JSON.stringify(payload));
}

function restaurarDados() {
    let payload;
    try {
        payload = JSON.parse(localStorage.getItem(RESCISAO_CONFIG.storageKey) || '{}');
    } catch (error) {
        payload = {};
    }

    Object.entries(payload).forEach(([chave, valor]) => {
        if (!refs[chave]) return;
        if (refs[chave].type === 'checkbox') {
            refs[chave].checked = !!valor;
        } else {
            refs[chave].value = valor;
        }
    });
}

function atualizarProgresso(valor) {
    if (!refs.progressBar) return;
    if (calcUI && typeof calcUI.updateProgress === 'function') {
        calcUI.updateProgress(refs.progressBar, valor);
        return;
    }
    refs.progressBar.style.width = `${valor}%`;
}

function calcularAvisoProporcionalDias(mesesContrato) {
    const meses = Math.max(0, Number(mesesContrato) || 0);
    const anosCompletos = Math.floor(meses / 12);
    let dias = 30;
    if (anosCompletos > 1) dias += (anosCompletos - 1) * 3;
    return Math.min(90, dias);
}

function atualizarCamposVisiveis() {
    const tipo = refs.tipoRescisao?.value || '';

    if (refs.avisoPrevioGroup) {
        refs.avisoPrevioGroup.style.display = tipo === 'pedido' ? 'block' : 'none';
    }
    if (refs.motivoRescisaoGroup) {
        refs.motivoRescisaoGroup.style.display = tipo === 'prazo_determinado' ? 'block' : 'none';
    }
}

function validarFormulario() {
    if (!refs.tipoRescisao?.value) {
        alert('Selecione o tipo de rescisão.');
        return false;
    }

    const salario = parseFloat(refs.salarioBruto?.value) || 0;
    if (salario <= 0) {
        alert('Informe um salário base válido.');
        return false;
    }

    const mesesAno = parseInt(refs.mesesAnoAtual?.value, 10);
    if (Number.isNaN(mesesAno) || mesesAno < 0 || mesesAno > 12) {
        alert('Meses trabalhados no ano devem estar entre 0 e 12.');
        return false;
    }

    const dias = parseInt(refs.diasTrabalhados?.value, 10);
    if (Number.isNaN(dias) || dias < 0 || dias > 31) {
        alert('Dias trabalhados no mês devem estar entre 0 e 31.');
        return false;
    }

    return true;
}

function atualizarGrafico(proventos, descontos, fgtsTotal) {
    if (!refs.graficoResultados) return;
    const liquido = Math.max(0, proventos - descontos);
    const ctx = refs.graficoResultados.getContext('2d');

    if (graficoRescisao) {
        graficoRescisao.destroy();
    }

    graficoRescisao = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Proventos', 'Descontos', 'FGTS + multa', 'Líquido'],
            datasets: [{
                data: [proventos, descontos, fgtsTotal, liquido],
                backgroundColor: ['#0a7dd1', '#c2410c', '#d46d13', '#0f766e']
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
    if (!refs.stepsContainer) return;

    const etapas = [
        `Saldo de salário: ${formatarMoeda(dados.saldoSalario)} (${dados.diasTrabalhados} dias trabalhados)`,
        `13º proporcional: ${formatarMoeda(dados.decimoTerceiro)} (${dados.mesesConsiderados} avos)`,
        `Férias proporcionais + 1/3: ${formatarMoeda(dados.feriasProp + dados.tercoFeriasProp)}`,
        `FGTS + multa aplicável: ${formatarMoeda(dados.fgtsTotal)}`
    ];

    refs.stepsContainer.innerHTML = '';
    etapas.forEach((etapa, indice) => {
        const step = document.createElement('div');
        step.className = 'step';
        step.innerHTML = `
            <div class="step-number">${indice + 1}</div>
            <div class="step-content"><p>${etapa}</p></div>
        `;
        refs.stepsContainer.appendChild(step);
    });
}

function montarLinhasResultado(partes) {
    if (!refs.resultadoTabela) return;
    refs.resultadoTabela.innerHTML = '';

    partes.forEach((parte) => {
        const tr = document.createElement('tr');
        const classeValor = parte.valor < 0 ? 'valor-negativo' : 'valor-positivo';
        tr.innerHTML = `
            <td>${parte.label}</td>
            <td class="${classeValor}">${formatarMoeda(parte.valor)}</td>
        `;
        refs.resultadoTabela.appendChild(tr);
    });
}

function calcularRescisao() {
    if (!validarFormulario()) return;

    atualizarProgresso(18);

    const tipo = refs.tipoRescisao.value;
    const salario = parseFloat(refs.salarioBruto.value) || 0;
    const mesesContrato = parseInt(refs.tempoServico.value, 10) || 0;
    const mesesAnoAtual = parseInt(refs.mesesAnoAtual.value, 10) || 0;
    const diasTrabalhados = parseInt(refs.diasTrabalhados.value, 10) || 0;
    const avisoCumprido = !!refs.avisoPrevio.checked;
    const feriasVencidasQtd = parseInt(refs.feriasVencidas.value, 10) || 0;
    const saldoFGTSInformado = parseFloat(refs.saldoFGTS.value) || 0;
    const descontosExtras = parseFloat(refs.descontosExtras.value) || 0;

    const mesesConsiderados = Math.min(12, Math.max(0, mesesAnoAtual + (diasTrabalhados >= 15 ? 1 : 0)));
    const saldoSalario = (salario / 30) * diasTrabalhados;
    const decimoTerceiro = tipo === 'justa_causa' ? 0 : (salario / 12) * mesesConsiderados;
    const feriasProp = tipo === 'justa_causa' ? 0 : (salario / 12) * mesesConsiderados;
    const tercoFeriasProp = feriasProp / 3;

    const feriasVencidas = feriasVencidasQtd * salario;
    const tercoFeriasVencidas = feriasVencidas / 3;

    atualizarProgresso(45);

    let avisoIndenizado = 0;
    let descontoAviso = 0;

    if (tipo === 'sem_justa_causa') {
        const diasAviso = calcularAvisoProporcionalDias(mesesContrato);
        avisoIndenizado = (salario / 30) * diasAviso;
    }

    if (tipo === 'pedido' && !avisoCumprido) {
        descontoAviso = salario;
    }

    const fgtsEstimado = salario * 0.08 * mesesContrato;
    const fgtsBase = saldoFGTSInformado > 0 ? saldoFGTSInformado : fgtsEstimado;
    const multaFGTS = tipo === 'sem_justa_causa' ? fgtsBase * 0.4 : 0;
    const fgtsTotal = fgtsBase + multaFGTS;

    const motivoPrazo = refs.motivoRescisao?.value || 'termino_normal';
    let indenizacaoPrazo = 0;
    if (tipo === 'prazo_determinado' && motivoPrazo === 'antecipado_empregador') {
        indenizacaoPrazo = salario / 2;
    }

    atualizarProgresso(72);

    const partes = [
        { label: 'Saldo de salário', valor: round2(saldoSalario) },
        { label: '13º proporcional', valor: round2(decimoTerceiro) },
        { label: 'Férias proporcionais', valor: round2(feriasProp) },
        { label: '1/3 sobre férias proporcionais', valor: round2(tercoFeriasProp) },
        { label: 'Férias vencidas indenizadas', valor: round2(feriasVencidas) },
        { label: '1/3 sobre férias vencidas', valor: round2(tercoFeriasVencidas) },
        { label: 'Aviso prévio indenizado', valor: round2(avisoIndenizado) },
        { label: 'Indenização prazo determinado', valor: round2(indenizacaoPrazo) },
        { label: 'Desconto aviso prévio', valor: round2(-descontoAviso) },
        { label: 'Outros descontos', valor: round2(-descontosExtras) }
    ];

    const proventos = partes
        .filter((item) => item.valor > 0)
        .reduce((total, item) => total + item.valor, 0);

    const descontos = Math.abs(partes
        .filter((item) => item.valor < 0)
        .reduce((total, item) => total + item.valor, 0));

    const liquido = proventos - descontos;

    atualizarTextoMoeda(refs.valorProventos, proventos);
    atualizarTextoMoeda(refs.valorDescontos, descontos);
    atualizarTextoMoeda(refs.valorFGTS, fgtsTotal);
    atualizarTextoMoeda(refs.valorLiquido, liquido);

    montarLinhasResultado([
        ...partes.filter((item) => item.valor !== 0),
        { label: 'Total líquido estimado', valor: round2(liquido) }
    ]);
    marcarAtualizacao(refs.resultadoTabela);

    if (refs.resultado) refs.resultado.style.display = 'block';

    atualizarPassos({
        saldoSalario: round2(saldoSalario),
        diasTrabalhados,
        decimoTerceiro: round2(decimoTerceiro),
        mesesConsiderados,
        feriasProp: round2(feriasProp),
        tercoFeriasProp: round2(tercoFeriasProp),
        fgtsTotal: round2(fgtsTotal)
    });

    atualizarGrafico(round2(proventos), round2(descontos), round2(fgtsTotal));
    salvarDados();
    atualizarProgresso(100);
}

function preencherExemplo() {
    if (refs.tipoRescisao) refs.tipoRescisao.value = 'sem_justa_causa';
    if (refs.salarioBruto) refs.salarioBruto.value = '4200';
    if (refs.tempoServico) refs.tempoServico.value = '36';
    if (refs.mesesAnoAtual) refs.mesesAnoAtual.value = '5';
    if (refs.diasTrabalhados) refs.diasTrabalhados.value = '18';
    if (refs.avisoPrevio) refs.avisoPrevio.checked = true;
    if (refs.feriasVencidas) refs.feriasVencidas.value = '0';
    if (refs.saldoFGTS) refs.saldoFGTS.value = '';
    if (refs.descontosExtras) refs.descontosExtras.value = '150';

    atualizarCamposVisiveis();
    calcularRescisao();
}

function toggleDetalhes() {
    if (!refs.tabelaDetalhes || !refs.verDetalhes) return;
    const abriu = refs.tabelaDetalhes.style.display === 'none';
    refs.tabelaDetalhes.style.display = abriu ? 'block' : 'none';

    const icone = refs.verDetalhes.querySelector('i');
    if (icone) {
        icone.className = abriu ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
}

function registrarEventos() {
    refs.tipoRescisao?.addEventListener('change', () => {
        atualizarCamposVisiveis();
        salvarDados();
    });
    refs.calcular?.addEventListener('click', calcularRescisao);
    refs.exemploValores?.addEventListener('click', preencherExemplo);
    refs.verDetalhes?.addEventListener('click', toggleDetalhes);

    [
        refs.salarioBruto,
        refs.tempoServico,
        refs.mesesAnoAtual,
        refs.diasTrabalhados,
        refs.feriasVencidas,
        refs.saldoFGTS,
        refs.descontosExtras
    ].forEach((input) => {
        input?.addEventListener('input', salvarDados);
    });

    refs.avisoPrevio?.addEventListener('change', salvarDados);
    refs.motivoRescisao?.addEventListener('change', salvarDados);
}

document.addEventListener('DOMContentLoaded', () => {
    mapearElementos();
    restaurarDados();
    atualizarCamposVisiveis();
    registrarEventos();
});

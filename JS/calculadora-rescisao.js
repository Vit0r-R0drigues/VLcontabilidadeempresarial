// Função para formatar valores monetários
function formatMoney(value) {
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

// Função para validar campos
function validarCampos() {
    let isValid = true;
    const mesesAnoAtual = parseInt(document.getElementById('mesesAnoAtual').value);
    const diasTrabalhados = parseInt(document.getElementById('diasTrabalhados').value);
    
    // Validar meses no ano
    if (mesesAnoAtual > 12) {
        alert('O número de meses não pode ultrapassar 12.');
        document.getElementById('mesesAnoAtual').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('mesesAnoAtual').classList.remove('error');
    }

    // Validar dias trabalhados
    if (diasTrabalhados < 0 || diasTrabalhados > 31) {
        alert('O número de dias deve estar entre 0 e 31.');
        document.getElementById('diasTrabalhados').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('diasTrabalhados').classList.remove('error');
    }

    return isValid;
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

// Função para calcular INSS (tabela 2024)
function calcularINSS(salario) {
    const faixas = [
        { limite: 1412.00, aliquota: 0.075 },
        { limite: 2666.68, aliquota: 0.09 },
        { limite: 4000.03, aliquota: 0.12 },
        { limite: 7786.02, aliquota: 0.14 }
    ];

    let inss = 0;
    let salarioRestante = salario;
    let faixaAnterior = 0;

    for (let faixa of faixas) {
        if (salario > faixaAnterior) {
            const baseCalculo = Math.min(salario, faixa.limite) - faixaAnterior;
            inss += baseCalculo * faixa.aliquota;
            faixaAnterior = faixa.limite;
        }
    }

    // Limite do INSS
    return Math.min(inss, 876.97);
}

// Função para calcular IRRF (tabela 2024)
function calcularIRRF(baseCalculo) {
    const faixas = [
        { limite: 2112.00, aliquota: 0, deducao: 0 },
        { limite: 2826.65, aliquota: 0.075, deducao: 158.40 },
        { limite: 3751.05, aliquota: 0.15, deducao: 370.40 },
        { limite: 4664.68, aliquota: 0.225, deducao: 651.73 },
        { limite: Infinity, aliquota: 0.275, deducao: 884.96 }
    ];

    let faixa = faixas.find(f => baseCalculo <= f.limite);
    return Math.max((baseCalculo * faixa.aliquota) - faixa.deducao, 0);
}

// Atualizar o evento submit do formulário
document.getElementById('formRescisao').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validarCampos()) {
        return;
    }

    const tipo = document.getElementById('tipoRescisao').value;
    const salario = parseFloat(document.getElementById('salario').value);
    const mesesTotal = parseInt(document.getElementById('tempoServico').value);
    const mesesAnoAtual = parseInt(document.getElementById('mesesAnoAtual').value);
    const diasTrabalhados = parseInt(document.getElementById('diasTrabalhados').value);
    
    // Validação de tempo de serviço
    if (mesesTotal > 120) {
        alert('Atenção: O tempo de serviço informado é superior a 120 meses. Por favor, verifique se está correto.');
    }

    let resultados = {};

    // Calcular férias e décimo terceiro
    const ferias = calcularFerias(salario, mesesAnoAtual, diasTrabalhados);
    const decimoTerceiro = calcularDecimoTerceiro(salario, mesesAnoAtual, diasTrabalhados, tipo);

    // Atualizar detalhes do cálculo
    atualizarDetalhesCalculo(ferias, decimoTerceiro);

    // Adicionar resultados ao objeto de resultados
    resultados['Saldo de Salário'] = (salario / 30) * diasTrabalhados;
    resultados['Férias Proporcionais'] = ferias.base;
    resultados['1/3 Férias Proporcionais'] = ferias.terco;
    
    if (decimoTerceiro.valor > 0) {
        resultados['13º Proporcional'] = decimoTerceiro.valor;
    }

    // FGTS
    const fgtsAcumulado = salario * 0.08 * mesesTotal;
    resultados['FGTS Acumulado'] = fgtsAcumulado;

    // Cálculos específicos por tipo
    switch(tipo) {
        case 'sem_justa_causa':
            resultados['Multa FGTS (40%)'] = fgtsAcumulado * 0.4;
            resultados['Aviso Prévio Indenizado'] = salario;
            break;
            
        case 'pedido':
            const avisoPrevioCumprido = document.getElementById('avisoPrevio').checked;
            if (!avisoPrevioCumprido) {
                resultados['Desconto Aviso Prévio'] = -salario;
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
    if (baseIRRF > 2112.00) {
        const irrf = calcularIRRF(baseIRRF);
        resultados['Desconto IRRF'] = -irrf;
    }

    // Exibir resultados
    const tbody = document.getElementById('resultadoTabela');
    tbody.innerHTML = '';
    let totalLiquido = 0;

    for (let [descricao, valor] of Object.entries(resultados)) {
        totalLiquido += valor;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${descricao}</td>
            <td>${formatMoney(valor)}</td>
        `;
        tbody.appendChild(tr);
    }

    // Adicionar total
    const trTotal = document.createElement('tr');
    trTotal.className = 'total';
    trTotal.innerHTML = `
        <td>Total Líquido</td>
        <td>${formatMoney(totalLiquido)}</td>
    `;
    tbody.appendChild(trTotal);

    document.getElementById('resultado').style.display = 'block';
});

// Limpar resultados ao resetar o formulário
document.querySelector('button[type="reset"]').addEventListener('click', function() {
    document.getElementById('resultado').style.display = 'none';
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}); 
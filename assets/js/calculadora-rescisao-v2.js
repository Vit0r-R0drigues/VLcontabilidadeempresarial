/**
 * Calculadora de Rescisão Trabalhista v2
 * VL Contabilidade Empresarial
 *
 * Lógica jurídica/fiscal:
 *  - 7 cenários CLT (sem justa causa, pedido, justa causa, acordo 484-A,
 *    término a termo, rescisão antecipada pelo empregador/empregado)
 *  - Aviso prévio proporcional (Lei 12.506/2011)
 *  - INSS progressivo 2026
 *  - IRRF 2026 (deduções legais vs. simplificado)
 *  - Avos automáticos ou manuais
 *  - Multa FGTS 40%/20% quando base informada
 *  - Base jurídica por rubrica
 *  - Relatório para impressão/PDF
 *
 * Este arquivo não inventa dados históricos.
 * Campos sem informação manual ficam em aberto no relatório.
 */

'use strict';

/* ================================================================
   1. TABELAS FISCAIS 2026
   ================================================================ */

const INSS_2026 = [
  { limite: 1621.00,  aliquota: 0.075 },
  { limite: 2902.84,  aliquota: 0.09  },
  { limite: 4354.27,  aliquota: 0.12  },
  { limite: 8475.55,  aliquota: 0.14  }
];

const IRRF_2026 = {
  tabela: [
    { limite: 2428.80,    aliquota: 0,      deducao: 0       },
    { limite: 2826.65,    aliquota: 0.075,  deducao: 182.16  },
    { limite: 3751.05,    aliquota: 0.15,   deducao: 394.16  },
    { limite: 4664.68,    aliquota: 0.225,  deducao: 675.49  },
    { limite: Infinity,   aliquota: 0.275,  deducao: 908.73  }
  ],
  deducaoDependente: 189.59,
  descontoSimplificado: 607.20,
  reducao(base) {
    if (base <= 5000)  return 312.89;
    if (base <= 7350)  return Math.max(0, 978.62 - (0.133145 * base));
    return 0;
  }
};

/* ================================================================
   2. CENÁRIOS E TEXTOS JURÍDICOS
   ================================================================ */

const CENARIOS = {
  sem_justa_causa: {
    titulo: 'Dispensa sem justa causa',
    direitos: 'Gera saldo de salário, 13º proporcional, férias vencidas e proporcionais + 1/3, aviso prévio indenizado (quando aplicável), multa de 40% do FGTS, saque do FGTS e seguro-desemprego. Observar regras do saque-aniversário.',
    multa_fgts: 0.40,
    gera_13_prop: true,
    gera_ferias_prop: true,
    gera_aviso: true
  },
  pedido_demissao: {
    titulo: 'Pedido de demissão',
    direitos: 'Gera saldo de salário, 13º proporcional e férias vencidas/proporcionais + 1/3. Não gera multa do FGTS, saque-rescisão nem seguro-desemprego. Se o aviso não for cumprido, pode haver desconto nos limites legais.',
    multa_fgts: 0,
    gera_13_prop: true,
    gera_ferias_prop: true,
    gera_aviso: true
  },
  justa_causa: {
    titulo: 'Dispensa com justa causa',
    direitos: 'Limita-se a saldo de salário e férias vencidas + 1/3. Não há 13º proporcional, férias proporcionais, aviso, multa de FGTS, saque nem seguro-desemprego.',
    multa_fgts: 0,
    gera_13_prop: false,
    gera_ferias_prop: false,
    gera_aviso: false
  },
  acordo_484a: {
    titulo: 'Extinção por acordo (art. 484-A)',
    direitos: 'Gera saldo de salário, 13º proporcional, férias vencidas e proporcionais + 1/3, metade da multa do FGTS e saque de até 80% do saldo. Aviso indenizado, quando adotado, é pago pela metade. Não gera seguro-desemprego.',
    multa_fgts: 0.20,
    gera_13_prop: true,
    gera_ferias_prop: true,
    gera_aviso: true
  },
  termino_prazo: {
    titulo: 'Término normal de contrato a termo',
    direitos: 'Gera saldo de salário, 13º proporcional e férias vencidas/proporcionais + 1/3. Não há multa de 40% por simples término do prazo. Possibilidade de saque do FGTS conforme o motivo e o registro.',
    multa_fgts: 0,
    gera_13_prop: true,
    gera_ferias_prop: true,
    gera_aviso: false
  },
  antecipada_empregador: {
    titulo: 'Rescisão antecipada pelo empregador',
    direitos: 'Sem cláusula assecuratória: indenização do art. 479 (metade da remuneração restante) + verbas rescisórias usuais. Com cláusula assecuratória: regime aproximado ao do prazo indeterminado.',
    multa_fgts: 0.40,
    gera_13_prop: true,
    gera_ferias_prop: true,
    gera_aviso: true
  },
  antecipada_empregado: {
    titulo: 'Rescisão antecipada pelo empregado',
    direitos: 'Sem cláusula assecuratória: pode haver indenização ao empregador pelos prejuízos (limitada ao teto do art. 479). Com cláusula: regime aproximado ao pedido de demissão.',
    multa_fgts: 0,
    gera_13_prop: true,
    gera_ferias_prop: true,
    gera_aviso: true
  }
};

const BASE_LEGAL_GERAL = [
  ['Prazo de pagamento',     'Art. 477, § 6º, CLT — pagamento em até 10 dias contados do término do contrato.'],
  ['Aviso prévio',           'Art. 487 da CLT e Lei 12.506/2011 — mínimo de 30 dias, acrescido de 3 dias por ano de serviço ao empregador, até 90 dias.'],
  ['13º proporcional',       'Lei 4.090/1962, art. 1º, § 2º — fração igual ou superior a 15 dias conta como mês integral.'],
  ['Férias na rescisão',     'CLT, arts. 146 e 147 — férias proporcionais, vencidas e projeção do aviso indenizado.'],
  ['FGTS rescisório',        'Lei 8.036/1990, art. 18, § 1º — multa de 40% nos casos de dispensa sem justa causa; art. 484-A para acordo com metade da multa.']
];

/* ================================================================
   3. FUNÇÕES UTILITÁRIAS
   ================================================================ */

function toNum(v)   { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
function r2(v)      { return Math.round((Number(v) + Number.EPSILON) * 100) / 100; }
function clamp(n, a, b) { return Math.min(Math.max(n, a), b); }

function fmtMoeda(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtData(d) {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}
function parseData(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}
function addDias(d, n) { return d ? new Date(d.getTime() + n * 86400000) : null; }
function diasNoMes(d)  { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
function inicioMes(d)  { return new Date(d.getFullYear(), d.getMonth(), 1, 12); }
function fimMes(d)     { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12); }
function inicioAno(d)  { return new Date(d.getFullYear(), 0, 1, 12); }
function maxD(a, b)    { return a > b ? a : b; }
function minD(a, b)    { return a < b ? a : b; }

function anosCompletos(inicio, fim) {
  let anos = fim.getFullYear() - inicio.getFullYear();
  const aniv = new Date(fim.getFullYear(), inicio.getMonth(), inicio.getDate(), 12);
  if (fim < aniv) anos--;
  return Math.max(0, anos);
}

function contarMesesCom15Dias(inicio, fim) {
  if (!inicio || !fim || fim < inicio) return 0;
  let count = 0;
  let cur = new Date(inicio.getFullYear(), inicio.getMonth(), 1, 12);
  const limite = new Date(fim.getFullYear(), fim.getMonth(), 1, 12);
  while (cur <= limite) {
    const ms = inicioMes(cur);
    const mf = fimMes(cur);
    const as = maxD(inicio, ms);
    const af = minD(fim, mf);
    const dias = Math.floor((af - as) / 86400000) + 1;
    if (dias >= 15) count++;
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1, 12);
  }
  return clamp(count, 0, 12);
}

function inicioCicloFerias(admissao, fimEfetivo) {
  if (!admissao || !fimEfetivo) return admissao;
  let cs = new Date(admissao.getFullYear(), admissao.getMonth(), admissao.getDate(), 12);
  while (true) {
    const prox = new Date(cs.getFullYear() + 1, cs.getMonth(), cs.getDate(), 12);
    if (prox <= fimEfetivo) cs = prox;
    else break;
  }
  return cs;
}

/* ================================================================
   4. CÁLCULOS FISCAIS
   ================================================================ */

function calcINSS(base) {
  let restante = base;
  let prevLimite = 0;
  let total = 0;
  for (const f of INSS_2026) {
    const faixa = Math.min(Math.max(f.limite - prevLimite, 0), Math.max(restante, 0));
    total += faixa * f.aliquota;
    restante -= faixa;
    prevLimite = f.limite;
    if (restante <= 0) break;
  }
  return Math.max(0, total);
}

function calcIRRFpelBase(base) {
  const b = Math.max(0, base);
  const row = IRRF_2026.tabela.find(r => b <= r.limite) || IRRF_2026.tabela[IRRF_2026.tabela.length - 1];
  const bruto = Math.max(0, b * row.aliquota - row.deducao);
  return Math.max(0, bruto - IRRF_2026.reducao(b));
}

function calcIRRFmensal(bruto, inss, dependentes, usarMelhor) {
  const baseLegal = Math.max(0, bruto - inss - dependentes * IRRF_2026.deducaoDependente);
  const taxaLegal = calcIRRFpelBase(baseLegal);
  if (!usarMelhor) return { imposto: taxaLegal, base: baseLegal, modo: 'deduções legais' };
  const baseSimpli = Math.max(0, bruto - inss - IRRF_2026.descontoSimplificado);
  const taxaSimpli = calcIRRFpelBase(baseSimpli);
  if (taxaSimpli < taxaLegal) return { imposto: taxaSimpli, base: baseSimpli, modo: 'desconto simplificado' };
  return { imposto: taxaLegal, base: baseLegal, modo: 'deduções legais' };
}

function calcIRRF13(bruto13, inss13, dependentes) {
  const base = Math.max(0, bruto13 - inss13 - dependentes * IRRF_2026.deducaoDependente);
  return { imposto: calcIRRFpelBase(base), base, modo: 'tributação exclusiva do 13º' };
}

function diasAvisoProporcional(admissao, fim, motivo) {
  if (!admissao || !fim) return 0;
  const cenario = CENARIOS[motivo];
  if (!cenario || !cenario.gera_aviso) return 0;
  if (motivo === 'pedido_demissao') return 30;
  const anos = anosCompletos(admissao, fim);
  return Math.min(90, 30 + anos * 3);
}

/* ================================================================
   5. MOTOR DE CÁLCULO
   ================================================================ */

function executarCalculo(dados) {
  const {
    empresa, empregado, salarioBase, mediaVariavel, dependentes,
    admissao, ultimoDia, motivo, tipoAviso, diasAviso,
    diasMesManual, fimContrato, clausula,
    feriasSimples, feriasDobro, adiantamento13,
    fgtsBase, multa477,
    faltas, adiantamentos, pensao,
    usarAvosManual, avos13Manual, avosFeriasManual,
    irrfModo
  } = dados;

  if (!admissao || !ultimoDia)    throw new Error('Informe a data de admissão e o último dia trabalhado.');
  if (salarioBase + mediaVariavel <= 0) throw new Error('Informe um salário-base válido.');
  if (ultimoDia < admissao)       throw new Error('O último dia não pode ser anterior à admissão.');

  const remuneracao = salarioBase + mediaVariavel;
  const cenario = CENARIOS[motivo];

  /* Fim efetivo considerado para avos (com projeção se aviso indenizado) */
  let fimEfetivo = ultimoDia;
  if (tipoAviso === 'indenizado' && diasAviso > 0) {
    fimEfetivo = addDias(ultimoDia, diasAviso);
  }

  /* Dias trabalhados no mês */
  const diasMes = clamp(diasMesManual || ultimoDia.getDate(), 0, diasNoMes(ultimoDia));

  /* Avos */
  let avos13, avosFerias;
  if (usarAvosManual) {
    avos13    = clamp(avos13Manual,    0, 12);
    avosFerias = clamp(avosFeriasManual, 0, 12);
  } else {
    const inicio13 = maxD(admissao, inicioAno(fimEfetivo));
    avos13      = contarMesesCom15Dias(inicio13, fimEfetivo);
    const ciclo = inicioCicloFerias(admissao, fimEfetivo);
    avosFerias  = contarMesesCom15Dias(ciclo, fimEfetivo);
  }

  /* Cenário de justa causa zeroa avos */
  if (motivo === 'justa_causa') { avos13 = 0; avosFerias = 0; }

  const itens   = [];
  const premissas = [];
  const legal   = [...BASE_LEGAL_GERAL];

  const add = (item) => itens.push(item);

  /* --- SALDO DE SALÁRIO --- */
  const saldoSalario = r2((remuneracao / diasNoMes(ultimoDia)) * diasMes);
  add({
    nome: 'Saldo de salário',
    natureza: 'Verba remuneratória',
    valor: saldoSalario,
    formula: `${fmtMoeda(remuneracao)} ÷ ${diasNoMes(ultimoDia)} × ${diasMes} dias`,
    legal: 'Dias efetivamente trabalhados no mês da rescisão.',
    tipo: 'credito'
  });

  /* --- AVISO PRÉVIO INDENIZADO --- */
  if (tipoAviso === 'indenizado' && diasAviso > 0) {
    const vAviso = r2(remuneracao * (diasAviso / 30));
    add({
      nome: 'Aviso prévio indenizado',
      natureza: 'Verba indenizatória',
      valor: vAviso,
      formula: `${fmtMoeda(remuneracao)} × (${diasAviso} ÷ 30)`,
      legal: motivo === 'acordo_484a'
        ? 'Art. 484-A — aviso indenizado pela metade (já reduza os dias no campo).'
        : 'Art. 487 da CLT e Lei 12.506/2011.',
      tipo: 'credito'
    });
    if (motivo !== 'acordo_484a') {
      premissas.push('A projeção do aviso indenizado foi considerada na apuração dos avos de 13º e férias proporcionais.');
    }
  }

  /* --- DESCONTO DE AVISO --- */
  if (tipoAviso === 'desconto' && diasAviso > 0) {
    const vDesc = r2(remuneracao * (diasAviso / 30));
    add({
      nome: 'Desconto de aviso prévio',
      natureza: 'Desconto rescisório',
      valor: -vDesc,
      formula: `${fmtMoeda(remuneracao)} × (${diasAviso} ÷ 30)`,
      legal: 'Art. 487, § 2º, da CLT. Em pedido de demissão, usualmente limitado a 30 dias.',
      tipo: 'debito'
    });
  }

  /* --- 13º PROPORCIONAL --- */
  let v13 = 0;
  if (cenario.gera_13_prop) {
    v13 = r2(remuneracao * (avos13 / 12));
    add({
      nome: '13º salário proporcional',
      natureza: 'Verba remuneratória (13º)',
      valor: v13,
      formula: `${fmtMoeda(remuneracao)} × (${avos13} ÷ 12)`,
      legal: 'Lei 4.090/1962, art. 1º, § 2º — fração ≥ 15 dias conta como mês.',
      tipo: 'credito'
    });
  }

  /* --- DESCONTO ADIANTAMENTO 13º --- */
  if (adiantamento13 > 0) {
    add({
      nome: 'Desconto adiantamento de 13º',
      natureza: 'Desconto rescisório',
      valor: -adiantamento13,
      formula: 'Valor informado manualmente',
      legal: 'Adiantamentos podem ser compensados; verifique os recibos.',
      tipo: 'debito'
    });
  }

  /* --- FÉRIAS INTEGRAIS/VENCIDAS SIMPLES --- */
  if (feriasSimples > 0) {
    const vFerSimples = r2((remuneracao * feriasSimples) * (4 / 3));
    add({
      nome: 'Férias vencidas integrais + 1/3',
      natureza: 'Verba indenizatória',
      valor: vFerSimples,
      formula: `${fmtMoeda(remuneracao)} × ${feriasSimples} + 1/3 constitucional`,
      legal: 'CLT, arts. 146 e 147.',
      tipo: 'credito'
    });
  }

  /* --- FÉRIAS EM DOBRO --- */
  if (feriasDobro > 0) {
    const vFerDobro = r2((remuneracao * 2 * feriasDobro) * (4 / 3));
    add({
      nome: 'Férias em dobro + 1/3',
      natureza: 'Verba indenizatória',
      valor: vFerDobro,
      formula: `${fmtMoeda(remuneracao)} × 2 × ${feriasDobro} + 1/3`,
      legal: 'Pagamento em dobro quando ultrapassado o prazo concessivo (CLT).',
      tipo: 'credito'
    });
  }

  /* --- FÉRIAS PROPORCIONAIS + 1/3 --- */
  if (cenario.gera_ferias_prop) {
    const vFerProp = r2((remuneracao * (avosFerias / 12)) * (4 / 3));
    add({
      nome: 'Férias proporcionais + 1/3',
      natureza: 'Verba indenizatória',
      valor: vFerProp,
      formula: `${fmtMoeda(remuneracao)} × (${avosFerias} ÷ 12) + 1/3`,
      legal: 'CLT, arts. 146 e 147; 1/12 por mês ou fração ≥ 15 dias.',
      tipo: 'credito'
    });
  }

  /* --- INDENIZAÇÕES DE CONTRATO A TERMO --- */
  const diasRestantes = (fimContrato && fimContrato > ultimoDia)
    ? Math.floor((fimContrato - ultimoDia) / 86400000) : 0;

  if (motivo === 'antecipada_empregador' && clausula !== 'sim' && diasRestantes > 0) {
    const v479 = r2((remuneracao / 30) * diasRestantes * 0.5);
    add({
      nome: 'Indenização art. 479 da CLT',
      natureza: 'Verba indenizatória',
      valor: v479,
      formula: `(${fmtMoeda(remuneracao)} ÷ 30) × ${diasRestantes} dias × 50%`,
      legal: 'Rescisão antecipada de contrato a termo pelo empregador sem cláusula assecuratória.',
      tipo: 'credito'
    });
    legal.push(['Art. 479 da CLT', 'Metade da remuneração devida até o termo final do contrato.']);
  }

  if (motivo === 'antecipada_empregado' && clausula !== 'sim' && diasRestantes > 0) {
    const v480 = r2((remuneracao / 30) * diasRestantes * 0.5);
    add({
      nome: 'Teto estimado — indenização art. 480 da CLT',
      natureza: 'Desconto potencial',
      valor: -v480,
      formula: `(${fmtMoeda(remuneracao)} ÷ 30) × ${diasRestantes} dias × 50% (teto)`,
      legal: 'Art. 480 depende da apuração dos prejuízos do empregador; valor exibido é o teto de referência.',
      tipo: 'debito'
    });
    premissas.push('No art. 480, a calculadora exibiu o teto de referência, não o valor dos prejuízos efetivamente apurados.');
    legal.push(['Art. 480 da CLT', 'Indenização ao empregador limitada ao parâmetro máximo do art. 479.']);
  }

  /* --- MULTA FGTS --- */
  if (cenario.multa_fgts > 0) {
    if (fgtsBase > 0) {
      const vMultaFGTS = r2(fgtsBase * cenario.multa_fgts);
      add({
        nome: `Multa do FGTS (${(cenario.multa_fgts * 100).toFixed(0)}%)`,
        natureza: 'Depósito em conta vinculada',
        valor: vMultaFGTS,
        formula: `${fmtMoeda(fgtsBase)} × ${(cenario.multa_fgts * 100).toFixed(0)}%`,
        legal: motivo === 'acordo_484a'
          ? 'Art. 484-A da CLT — metade da multa rescisória usual.'
          : 'Lei 8.036/1990, art. 18, § 1º.',
        tipo: 'credito'
      });
    } else {
      premissas.push('⚠ A multa do FGTS não foi calculada: informe a base/saldo rescisório no campo correspondente.');
    }
  }

  /* --- MULTA ART. 477 (manual) --- */
  if (multa477 > 0) {
    add({
      nome: 'Multa art. 477 da CLT (informada manualmente)',
      natureza: 'Parcela acessória',
      valor: multa477,
      formula: 'Valor informado manualmente',
      legal: 'Use apenas quando o atraso no pagamento estiver confirmado.',
      tipo: 'credito'
    });
  }

  /* --- DESCONTOS INFORMADOS --- */
  if (faltas > 0) {
    add({
      nome: 'Faltas / DSR / descontos salariais',
      natureza: 'Desconto rescisório',
      valor: -faltas,
      formula: 'Valor informado manualmente',
      legal: 'Informe somente descontos apurados e juridicamente sustentáveis.',
      tipo: 'debito'
    });
  }
  if (adiantamentos > 0) {
    add({
      nome: 'Adiantamentos / empréstimos',
      natureza: 'Desconto rescisório',
      valor: -adiantamentos,
      formula: 'Valor informado manualmente',
      legal: 'Descontos devem respeitar recibos, autorização e limites legais.',
      tipo: 'debito'
    });
  }
  if (pensao > 0) {
    add({
      nome: 'Pensão alimentícia / desconto judicial',
      natureza: 'Desconto judicial',
      valor: -pensao,
      formula: 'Valor informado manualmente',
      legal: 'Conforme ordem judicial ou parâmetros da obrigação fixada.',
      tipo: 'debito'
    });
  }

  /* ================================================================
     INSS E IRRF
     Base para INSS/IRRF mensal = saldo de salário (verba remuneratória)
     Base para INSS/IRRF do 13º = 13º proporcional
     Verbas indenizatórias tipicamente isentas não entram na base.
  ================================================================ */

  const usarMelhor = irrfModo === 'melhor';

  const baseINSSmensal  = saldoSalario;
  const inssM           = r2(calcINSS(baseINSSmensal));
  const irM             = calcIRRFmensal(baseINSSmensal, inssM, dependentes, usarMelhor);

  const baseINSS13      = v13;
  const inss13          = r2(calcINSS(baseINSS13));
  const ir13            = calcIRRF13(baseINSS13, inss13, dependentes);

  if (inssM > 0) {
    add({
      nome: 'INSS sobre verba salarial mensal',
      natureza: 'Desconto legal',
      valor: -inssM,
      formula: `Base ${fmtMoeda(baseINSSmensal)} — tabela progressiva 2026`,
      legal: 'Estimativa técnica de INSS sobre verbas remuneratórias mensais.',
      tipo: 'debito'
    });
  }
  if (inss13 > 0) {
    add({
      nome: 'INSS sobre 13º rescisório',
      natureza: 'Desconto legal',
      valor: -inss13,
      formula: `Base ${fmtMoeda(baseINSS13)} — tabela progressiva 2026`,
      legal: 'Estimativa técnica de INSS sobre o 13º rescisório.',
      tipo: 'debito'
    });
  }
  if (irM.imposto > 0) {
    add({
      nome: 'IRRF sobre verbas salariais mensais',
      natureza: 'Desconto legal',
      valor: -r2(irM.imposto),
      formula: `Base ${fmtMoeda(irM.base)} — modo: ${irM.modo}`,
      legal: 'Estimativa do IRRF mensal conforme tabela 2026 e redução vigente.',
      tipo: 'debito'
    });
  }
  if (ir13.imposto > 0) {
    add({
      nome: 'IRRF sobre 13º (tributação exclusiva)',
      natureza: 'Desconto legal',
      valor: -r2(ir13.imposto),
      formula: `Base ${fmtMoeda(ir13.base)} — ${ir13.modo}`,
      legal: 'Estimativa do IRRF do 13º em separado dos demais rendimentos.',
      tipo: 'debito'
    });
  }

  /* ================================================================
     TOTAIS
  ================================================================ */

  const creditos  = r2(itens.filter(i => i.valor > 0).reduce((s, i) => s + i.valor, 0));
  const debitos   = r2(Math.abs(itens.filter(i => i.valor < 0).reduce((s, i) => s + i.valor, 0)));
  const liquido   = r2(creditos - debitos);

  /* --- Premissas automáticas --- */
  premissas.push(`Remuneração-base utilizada: ${fmtMoeda(remuneracao)} (${fmtMoeda(salarioBase)} salário-base + ${fmtMoeda(mediaVariavel)} médias/adicionais).`);
  premissas.push(`Data-base da rescisão: ${fmtData(ultimoDia)}. Término efetivo considerado para avos: ${fmtData(fimEfetivo)}.`);
  premissas.push(`Dias trabalhados no mês da rescisão: ${diasMes}.`);
  premissas.push(`Avos de 13º: ${avos13}. Avos de férias proporcionais: ${avosFerias}.${usarAvosManual ? ' (informados manualmente)' : ''}`);
  if (motivo === 'acordo_484a') {
    premissas.push('No acordo do art. 484-A, informe os dias de aviso já reduzidos à metade para refletir o valor efetivamente pago.');
  }
  if ((motivo === 'antecipada_empregador' || motivo === 'antecipada_empregado') && !fimContrato) {
    premissas.push('A data de término do contrato a termo não foi informada — as indenizações dos arts. 479/480 não foram calculadas.');
  }
  if (clausula === 'sim' && (motivo === 'antecipada_empregador' || motivo === 'antecipada_empregado')) {
    premissas.push('Cláusula assecuratória marcada — o tratamento se aproxima do prazo indeterminado e pode exigir revisão manual.');
  }

  /* Textos tributários */
  const textoTrib = [
    `INSS mensal estimado: ${fmtMoeda(inssM)} sobre ${fmtMoeda(baseINSSmensal)}.`,
    `INSS do 13º estimado: ${fmtMoeda(inss13)} sobre ${fmtMoeda(baseINSS13)}.`,
    `IRRF mensal estimado: ${fmtMoeda(r2(irM.imposto))} — base ${fmtMoeda(irM.base)}, modo: ${irM.modo}.`,
    `IRRF do 13º estimado: ${fmtMoeda(r2(ir13.imposto))} — base ${fmtMoeda(ir13.base)}, tributação exclusiva.`,
    'As verbas indenizatórias tipicamente isentas/não incidentes não foram levadas à base de INSS/IRRF. Situações específicas podem exigir conferência profissional.'
  ];

  return {
    empresa, empregado,
    motivo, tituloCenario: cenario.titulo, direitosNaoMon: cenario.direitos,
    itens, creditos, debitos, liquido,
    inssTotal: r2(inssM + inss13),
    irrfTotal: r2(irM.imposto + ir13.imposto),
    fgtsBaseInformada: fgtsBase > 0,
    fgtsFine: fgtsBase > 0 ? r2(fgtsBase * cenario.multa_fgts) : null,
    fimEfetivo, premissas, legal, textoTrib,
    diasAvisoSugerido: diasAvisoProporcional(admissao, ultimoDia, motivo)
  };
}

/* ================================================================
   6. RENDERIZAÇÃO
   ================================================================ */

function renderizar(res) {
  const shell = document.getElementById('rescResultShell');
  if (!shell) return;
  shell.classList.add('resc-visible');

  /* Sumário */
  const resumoEl = document.getElementById('rescResumo');
  if (resumoEl) {
    resumoEl.innerHTML = `<strong>${esc(res.empregado)}</strong> — ${esc(res.tituloCenario)}. Empresa: <strong>${esc(res.empresa)}</strong>. Término efetivo: <strong>${fmtData(res.fimEfetivo)}</strong>.`;
  }

  /* Data no relatório PDF */
  const printDate = document.getElementById('rescPrintDate');
  if (printDate) printDate.textContent = `Emitido em: ${new Date().toLocaleDateString('pt-BR')}`;

  /* Stats */
  const statsGrid = document.getElementById('rescStatGrid');
  if (statsGrid) {
    const stats = [
      { k: 'Créditos brutos',   v: fmtMoeda(res.creditos),  s: 'Soma das parcelas positivas.', destaque: false },
      { k: 'Descontos totais',  v: fmtMoeda(res.debitos),   s: 'Inclui descontos + INSS/IRRF estimados.', destaque: false },
      { k: 'Líquido estimado',  v: fmtMoeda(res.liquido),   s: 'Valor líquido indicativo.', destaque: true },
      { k: 'Multa FGTS',        v: res.fgtsBaseInformada ? fmtMoeda(res.fgtsFine) : 'Não calculada', s: res.fgtsBaseInformada ? 'Com base informada pelo usuário.' : 'Informe o saldo rescisório do FGTS.', destaque: false }
    ];
    statsGrid.innerHTML = stats.map((s, i) => `
      <div class="resc-stat ${s.destaque ? 'resc-stat-highlight' : ''}" style="animation-delay:${i * 80}ms">
        <span class="resc-stat-key">${esc(s.k)}</span>
        <span class="resc-stat-val">${esc(s.v)}</span>
        <div class="resc-stat-note">${esc(s.s)}</div>
      </div>
    `).join('');
  }

  /* Tabela */
  const tbody = document.getElementById('rescTbody');
  if (tbody) {
    tbody.innerHTML = res.itens.map(item => {
      const cls   = item.valor > 0 ? 'resc-money-pos' : item.valor < 0 ? 'resc-money-neg' : 'resc-money-zero';
      const pCls  = item.tipo === 'credito' ? '' : item.tipo === 'debito' ? 'resc-pill-debit' : 'resc-pill-neutral';
      const pTxt  = item.valor > 0 ? 'Crédito' : item.valor < 0 ? 'Desconto' : 'Informativo';
      return `
        <tr>
          <td><strong>${esc(item.nome)}</strong></td>
          <td><span class="resc-pill ${pCls}">${esc(item.natureza)}</span></td>
          <td class="${cls}" style="white-space:nowrap">${fmtMoeda(item.valor)}<span class="resc-formula">${esc(pTxt)}</span></td>
          <td><span style="font-size:0.87rem;color:#4a6783;">${esc(item.formula)}</span></td>
          <td style="font-size:0.86rem;color:#254b6e;">${esc(item.legal)}</td>
        </tr>`;
    }).join('');
  }

  /* Premissas */
  const premEl = document.getElementById('rescPremissas');
  if (premEl) {
    premEl.innerHTML = res.premissas.map(p => `<div class="resc-premissa-item">${esc(p)}</div>`).join('');
  }

  /* Base legal */
  const legalEl = document.getElementById('rescLegal');
  if (legalEl) {
    legalEl.innerHTML = res.legal.map(([t, d]) => `
      <div class="resc-legal-item"><strong>${esc(t)}</strong>${esc(d)}</div>
    `).join('');
  }

  /* Tributos */
  const tribEl = document.getElementById('rescTributos');
  if (tribEl) {
    tribEl.innerHTML = res.textoTrib.map(t => `<div style="margin-bottom:7px;">${esc(t)}</div>`).join('');
  }

  /* Direitos não monetários */
  const dirEl = document.getElementById('rescDireitosNaoMon');
  if (dirEl) dirEl.textContent = res.direitosNaoMon;

  /* Scroll suave */
  shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Escape básico de HTML */
function esc(s) {
  if (typeof s !== 'string') s = String(s ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ================================================================
   7. LEITURA DO FORMULÁRIO
   ================================================================ */

function lerFormulario() {
  const g = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const gN = (id) => toNum(g(id));
  const gB = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

  return {
    empresa:         g('r_empresa'),
    empregado:       g('r_empregado'),
    salarioBase:     gN('r_salario'),
    mediaVariavel:   gN('r_variavel'),
    dependentes:     gN('r_dependentes'),
    irrfModo:        g('r_irrf_modo'),
    admissao:        parseData(g('r_admissao')),
    ultimoDia:       parseData(g('r_ultimo_dia')),
    motivo:          g('r_motivo'),
    tipoAviso:       g('r_aviso_tipo'),
    diasAviso:       gN('r_aviso_dias'),
    diasMesManual:   gN('r_dias_mes') || null,
    fimContrato:     parseData(g('r_fim_contrato')) || null,
    clausula:        g('r_clausula'),
    feriasSimples:   gN('r_ferias_simples'),
    feriasDobro:     gN('r_ferias_dobro'),
    adiantamento13:  gN('r_adiantamento13'),
    fgtsBase:        gN('r_fgts_base'),
    multa477:        gN('r_multa477'),
    faltas:          gN('r_faltas'),
    adiantamentos:   gN('r_adiantamentos'),
    pensao:          gN('r_pensao'),
    usarAvosManual:  gB('r_avos_manual'),
    avos13Manual:    gN('r_avos13'),
    avosFeriasManual: gN('r_avos_ferias')
  };
}

/* ================================================================
   8. EXEMPLO PRÉ-PREENCHIDO
   ================================================================ */

function preencherExemplo() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

  set('r_empresa',     'Exemplo Ltda.');
  set('r_empregado',   'Maria da Silva');
  set('r_salario',     '3800');
  set('r_variavel',    '0');
  set('r_dependentes', '1');
  set('r_irrf_modo',   'melhor');

  /* Admissão = 3 anos atrás; último dia = hoje */
  const hoje = new Date();
  const admEx = new Date(hoje.getFullYear() - 3, hoje.getMonth(), 1);
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  set('r_admissao',    toISO(admEx));
  set('r_ultimo_dia',  toISO(hoje));
  set('r_motivo',      'sem_justa_causa');
  set('r_aviso_tipo',  'indenizado');
  set('r_aviso_dias',  '39');   /* 30 + 3*3 anos */
  set('r_dias_mes',    String(hoje.getDate()));
  set('r_ferias_simples', '0');
  set('r_ferias_dobro',   '0');
  set('r_adiantamento13', '0');
  set('r_fgts_base',   '4500');
  set('r_multa477',    '0');
  set('r_faltas',      '0');
  set('r_adiantamentos','150');
  set('r_pensao',      '0');

  /* Atualizar painel cenário */
  atualizarPainelCenario('sem_justa_causa');
  esconderBlocoPrazo('sem_justa_causa');

  calcular();
}

/* ================================================================
   9. LIMPAR FORMULÁRIO
   ================================================================ */

function limpar() {
  const ids = [
    'r_empresa','r_empregado','r_salario','r_variavel','r_dependentes',
    'r_admissao','r_ultimo_dia','r_dias_mes','r_fim_contrato',
    'r_ferias_simples','r_ferias_dobro','r_adiantamento13',
    'r_fgts_base','r_multa477','r_faltas','r_adiantamentos','r_pensao',
    'r_avos13','r_avos_ferias','r_avos_obs'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'date' || el.placeholder === 'Auto') el.value = '';
    else if (el.tagName === 'INPUT') el.value = el.dataset.default || '0';
  });

  const defaults = {
    r_empresa: 'VL Contabilidade Empresarial',
    r_variavel: '0', r_dependentes: '0',
    r_irrf_modo: 'melhor', r_motivo: 'sem_justa_causa',
    r_aviso_tipo: 'nenhum', r_aviso_dias: '0',
    r_clausula: 'nao',
    r_ferias_simples: '0', r_ferias_dobro: '0', r_adiantamento13: '0',
    r_fgts_base: '0', r_multa477: '0',
    r_faltas: '0', r_adiantamentos: '0', r_pensao: '0',
    r_avos13: '0', r_avos_ferias: '0'
  };
  Object.entries(defaults).forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  });

  const avosManual = document.getElementById('r_avos_manual');
  if (avosManual) {
    avosManual.checked = false;
    const bloco = document.getElementById('r_bloco_avos');
    if (bloco) bloco.style.display = 'none';
  }

  const shell = document.getElementById('rescResultShell');
  if (shell) shell.classList.remove('resc-visible');

  atualizarPainelCenario('sem_justa_causa');
  esconderBlocoPrazo('sem_justa_causa');
}

/* ================================================================
   10. TOOLTIP
   ================================================================ */

function initTooltips() {
  const tip = document.getElementById('rescTooltip');
  if (!tip) return;

  const btns = document.querySelectorAll('.resc-help-btn[data-tip]');
  btns.forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
      tip.textContent = btn.dataset.tip;
      tip.setAttribute('aria-hidden', 'false');
      posicionarTooltip(e, tip);
      tip.classList.add('resc-tooltip-visible');
    });
    btn.addEventListener('mouseleave', () => {
      tip.classList.remove('resc-tooltip-visible');
      tip.setAttribute('aria-hidden', 'true');
    });
    btn.addEventListener('focus', (e) => {
      tip.textContent = btn.dataset.tip;
      posicionarTooltip(e, tip);
      tip.classList.add('resc-tooltip-visible');
    });
    btn.addEventListener('blur', () => {
      tip.classList.remove('resc-tooltip-visible');
    });
  });
}

function posicionarTooltip(e, tip) {
  const r = e.target.getBoundingClientRect();
  const top = r.bottom + window.scrollY + 6;
  const left = Math.min(r.left + window.scrollX, window.innerWidth - 280);
  tip.style.top  = top + 'px';
  tip.style.left = Math.max(8, left) + 'px';
}

/* ================================================================
   11. PAINEL LATERAL DE CENÁRIO
   ================================================================ */

function atualizarPainelCenario(motivo) {
  const nameEl   = document.getElementById('sideScenarioName');
  const rightsEl = document.getElementById('sideScenarioRights');
  if (!nameEl || !rightsEl) return;
  const c = CENARIOS[motivo];
  if (!c) return;
  nameEl.textContent   = c.titulo;
  rightsEl.textContent = c.direitos;
}

function esconderBlocoPrazo(motivo) {
  const bloco = document.getElementById('r_bloco_prazo');
  if (!bloco) return;
  const prazo = ['antecipada_empregador', 'antecipada_empregado', 'termino_prazo'];
  bloco.style.display = prazo.includes(motivo) ? '' : 'none';
}

/* ================================================================
   12. CALCULAR
   ================================================================ */

function calcular() {
  try {
    const dados = lerFormulario();
    const res   = executarCalculo(dados);
    renderizar(res);
  } catch (err) {
    alert(err.message || 'Não foi possível calcular. Verifique os dados preenchidos.');
  }
}

/* ================================================================
   13. INICIALIZAÇÃO
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* Painel inicial */
  atualizarPainelCenario('sem_justa_causa');
  esconderBlocoPrazo('sem_justa_causa');

  /* Tooltips */
  initTooltips();

  /* Avos manual toggle */
  const avosChk = document.getElementById('r_avos_manual');
  const avosBloco = document.getElementById('r_bloco_avos');
  if (avosChk && avosBloco) {
    avosChk.addEventListener('change', () => {
      avosBloco.style.display = avosChk.checked ? 'grid' : 'none';
    });
  }

  /* Motivo: atualizar painel e visibilidade do bloco a-termo */
  const motivoSel = document.getElementById('r_motivo');
  if (motivoSel) {
    motivoSel.addEventListener('change', () => {
      atualizarPainelCenario(motivoSel.value);
      esconderBlocoPrazo(motivoSel.value);
      /* Sugerir aviso automaticamente ao trocar motivo */
      const adm = parseData(document.getElementById('r_admissao')?.value || '');
      const fim = parseData(document.getElementById('r_ultimo_dia')?.value || '');
      if (adm && fim) {
        const el = document.getElementById('r_aviso_dias');
        if (el) el.value = String(diasAvisoProporcional(adm, fim, motivoSel.value));
      }
    });
  }

  /* Sugerir aviso */
  const btnSugerir = document.getElementById('btnSugerirAviso');
  if (btnSugerir) {
    btnSugerir.addEventListener('click', () => {
      const adm = parseData(document.getElementById('r_admissao')?.value || '');
      const fim = parseData(document.getElementById('r_ultimo_dia')?.value || '');
      const motivo = document.getElementById('r_motivo')?.value || 'sem_justa_causa';
      if (!adm || !fim) { alert('Preencha as datas de admissão e do último dia trabalhado.'); return; }
      const el = document.getElementById('r_aviso_dias');
      if (el) el.value = String(diasAvisoProporcional(adm, fim, motivo));
    });
  }

  /* Botões principais */
  document.getElementById('btnCalcular')?.addEventListener('click', calcular);
  document.getElementById('btnExemplo')?.addEventListener('click', preencherExemplo);
  document.getElementById('btnLimpar')?.addEventListener('click', limpar);
  document.getElementById('btnTopo')?.addEventListener('click', () => {
    document.getElementById('topo')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('btnPdf')?.addEventListener('click', () => {
    window.print();
  });

  /* Acessibilidade: Enter nos botões */
  document.querySelectorAll('.resc-btn-primary, .resc-btn-secondary, .resc-btn-ghost').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });
});

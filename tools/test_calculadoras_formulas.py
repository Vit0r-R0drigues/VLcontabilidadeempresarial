#!/usr/bin/env python3
"""Regression tests for calculator formulas used in VL Contabilidade pages."""

from __future__ import annotations

import unittest


IRRF_FAIXAS = (
    {"limite": 2428.80, "aliquota": 0.0, "deducao": 0.0},
    {"limite": 2826.65, "aliquota": 0.075, "deducao": 182.16},
    {"limite": 3751.05, "aliquota": 0.15, "deducao": 394.16},
    {"limite": 4664.68, "aliquota": 0.225, "deducao": 675.49},
    {"limite": float("inf"), "aliquota": 0.275, "deducao": 908.73},
)

INSS_FAIXAS = (
    {"limite": 1621.00, "aliquota": 0.075},
    {"limite": 2902.84, "aliquota": 0.09},
    {"limite": 4354.27, "aliquota": 0.12},
    {"limite": 8475.55, "aliquota": 0.14},
)

SIMPLES_TABELAS = {
    "I": (
        {"limite": 180000, "aliquota": 0.04, "deducao": 0},
        {"limite": 360000, "aliquota": 0.073, "deducao": 5940},
        {"limite": 720000, "aliquota": 0.095, "deducao": 13860},
        {"limite": 1800000, "aliquota": 0.107, "deducao": 22500},
        {"limite": 3600000, "aliquota": 0.143, "deducao": 87300},
        {"limite": 4800000, "aliquota": 0.19, "deducao": 378000},
    ),
    "II": (
        {"limite": 180000, "aliquota": 0.045, "deducao": 0},
        {"limite": 360000, "aliquota": 0.078, "deducao": 5940},
        {"limite": 720000, "aliquota": 0.1, "deducao": 13860},
        {"limite": 1800000, "aliquota": 0.112, "deducao": 22500},
        {"limite": 3600000, "aliquota": 0.147, "deducao": 85500},
        {"limite": 4800000, "aliquota": 0.3, "deducao": 720000},
    ),
    "III": (
        {"limite": 180000, "aliquota": 0.06, "deducao": 0},
        {"limite": 360000, "aliquota": 0.112, "deducao": 9360},
        {"limite": 720000, "aliquota": 0.135, "deducao": 17640},
        {"limite": 1800000, "aliquota": 0.16, "deducao": 35640},
        {"limite": 3600000, "aliquota": 0.21, "deducao": 125640},
        {"limite": 4800000, "aliquota": 0.33, "deducao": 648000},
    ),
    "IV": (
        {"limite": 180000, "aliquota": 0.045, "deducao": 0},
        {"limite": 360000, "aliquota": 0.09, "deducao": 8100},
        {"limite": 720000, "aliquota": 0.102, "deducao": 12420},
        {"limite": 1800000, "aliquota": 0.14, "deducao": 39780},
        {"limite": 3600000, "aliquota": 0.22, "deducao": 183780},
        {"limite": 4800000, "aliquota": 0.33, "deducao": 828000},
    ),
    "V": (
        {"limite": 180000, "aliquota": 0.155, "deducao": 0},
        {"limite": 360000, "aliquota": 0.18, "deducao": 4500},
        {"limite": 720000, "aliquota": 0.195, "deducao": 9900},
        {"limite": 1800000, "aliquota": 0.205, "deducao": 17100},
        {"limite": 3600000, "aliquota": 0.23, "deducao": 62100},
        {"limite": 4800000, "aliquota": 0.305, "deducao": 540000},
    ),
}

DESCONTO_SIMPLIFICADO = 607.20
DEDUCAO_DEPENDENTE = 189.59
REDUCAO_MAXIMA = 312.89
FAIXA_REDUCAO_ATE = 5000.0
FAIXA_REDUCAO_FIM = 7350.0
REDUCAO_COEF_A = 978.62
REDUCAO_COEF_B = 0.133145


def round2(valor: float) -> float:
    return round(float(valor) + 1e-12, 2)


def calcular_inss_progressivo(base: float) -> float:
    salario = max(0.0, float(base or 0))
    total = 0.0
    faixa_anterior = 0.0

    for faixa in INSS_FAIXAS:
        if salario <= faixa_anterior:
            continue
        base_faixa = min(salario, faixa["limite"]) - faixa_anterior
        total += base_faixa * faixa["aliquota"]
        faixa_anterior = faixa["limite"]

    return round2(total)


def calcular_irrf_bruto(base_calculo: float) -> float:
    base = max(0.0, float(base_calculo or 0))
    faixa = next((item for item in IRRF_FAIXAS if base <= item["limite"]), IRRF_FAIXAS[0])
    imposto = max(0.0, base * faixa["aliquota"] - faixa["deducao"])
    return round2(imposto)


def calcular_reducao_lei_15270(rendimento_bruto: float, imposto_bruto: float) -> float:
    rendimento = max(0.0, float(rendimento_bruto or 0))
    imposto = max(0.0, float(imposto_bruto or 0))
    reducao_teorica = 0.0

    if rendimento <= FAIXA_REDUCAO_ATE:
        reducao_teorica = REDUCAO_MAXIMA
    elif rendimento <= FAIXA_REDUCAO_FIM:
        reducao_teorica = REDUCAO_COEF_A - (REDUCAO_COEF_B * rendimento)

    return round2(min(imposto, max(0.0, reducao_teorica)))


def calcular_irrf_mensal(
    salario_bruto: float,
    dependentes: int = 0,
    pensao_alimenticia: float = 0.0,
    outras_deducoes: float = 0.0,
) -> dict:
    salario = max(0.0, float(salario_bruto or 0))
    deps = max(0, int(dependentes or 0))
    pensao = max(0.0, float(pensao_alimenticia or 0))
    outras = max(0.0, float(outras_deducoes or 0))

    inss = calcular_inss_progressivo(salario)
    deducao_dependentes = deps * DEDUCAO_DEPENDENTE
    deducoes_legais = inss + deducao_dependentes + pensao + outras
    deducao_aplicada = max(deducoes_legais, DESCONTO_SIMPLIFICADO)
    base_calculo = max(0.0, salario - deducao_aplicada)
    irrf_bruto = calcular_irrf_bruto(base_calculo)
    reducao = calcular_reducao_lei_15270(salario, irrf_bruto)
    irrf_final = max(0.0, irrf_bruto - reducao)
    aliquota_efetiva = (irrf_final / salario) * 100 if salario > 0 else 0.0

    return {
        "inss": inss,
        "deducao_aplicada": round2(deducao_aplicada),
        "base_calculo": round2(base_calculo),
        "irrf_bruto": irrf_bruto,
        "reducao": reducao,
        "irrf_final": round2(irrf_final),
        "aliquota_efetiva": round2(aliquota_efetiva),
    }


def calcular_ferias(
    salario_base: float,
    dias_ferias: int,
    media_variavel: float = 0.0,
    vender_ferias: bool = False,
    dias_vendidos: int = 0,
) -> dict:
    salario = max(0.0, float(salario_base or 0))
    dias = int(dias_ferias or 0)
    media = max(0.0, float(media_variavel or 0))
    dias_abono = int(dias_vendidos or 0) if vender_ferias else 0

    valor_diario = (salario + media) / 30.0
    valor_ferias = valor_diario * dias
    terco_ferias = valor_ferias / 3.0
    ferias_com_terco = valor_ferias + terco_ferias

    abono = valor_diario * dias_abono
    terco_abono = abono / 3.0
    abono_total = abono + terco_abono

    base_tributavel = ferias_com_terco
    inss = calcular_inss_progressivo(base_tributavel)
    deducao_aplicada = max(inss, DESCONTO_SIMPLIFICADO)
    base_irrf = max(0.0, base_tributavel - deducao_aplicada)
    irrf_bruto = calcular_irrf_bruto(base_irrf)
    reducao = calcular_reducao_lei_15270(base_tributavel, irrf_bruto)
    irrf = max(0.0, irrf_bruto - reducao)

    descontos = inss + irrf
    bruto_total = ferias_com_terco + abono_total
    liquido = bruto_total - descontos

    return {
        "valor_diario": round2(valor_diario),
        "valor_ferias": round2(valor_ferias),
        "terco_ferias": round2(terco_ferias),
        "abono_total": round2(abono_total),
        "inss": round2(inss),
        "irrf": round2(irrf),
        "descontos": round2(descontos),
        "bruto_total": round2(bruto_total),
        "liquido": round2(liquido),
    }


def calcular_aviso_proporcional_dias(meses_contrato: int) -> int:
    meses = max(0, int(meses_contrato or 0))
    anos_completos = meses // 12
    dias = 30
    if anos_completos > 1:
        dias += (anos_completos - 1) * 3
    return min(90, dias)


def calcular_rescisao(
    tipo_rescisao: str,
    salario: float,
    meses_contrato: int,
    meses_ano_atual: int,
    dias_trabalhados: int,
    aviso_cumprido: bool,
    ferias_vencidas_qtd: int,
    saldo_fgts_informado: float,
    descontos_extras: float,
    motivo_prazo: str = "termino_normal",
) -> dict:
    salario_base = max(0.0, float(salario or 0))
    meses_total = max(0, int(meses_contrato or 0))
    meses_no_ano = max(0, int(meses_ano_atual or 0))
    dias_mes = max(0, int(dias_trabalhados or 0))
    vencidas = max(0, int(ferias_vencidas_qtd or 0))
    saldo_fgts = max(0.0, float(saldo_fgts_informado or 0))
    descontos = max(0.0, float(descontos_extras or 0))

    meses_considerados = min(12, max(0, meses_no_ano + (1 if dias_mes >= 15 else 0)))
    saldo_salario = (salario_base / 30.0) * dias_mes
    decimo_terceiro = 0.0 if tipo_rescisao == "justa_causa" else (salario_base / 12.0) * meses_considerados
    ferias_prop = 0.0 if tipo_rescisao == "justa_causa" else (salario_base / 12.0) * meses_considerados
    terco_ferias_prop = ferias_prop / 3.0

    ferias_vencidas = vencidas * salario_base
    terco_ferias_vencidas = ferias_vencidas / 3.0

    aviso_indenizado = 0.0
    desconto_aviso = 0.0
    if tipo_rescisao == "sem_justa_causa":
        dias_aviso = calcular_aviso_proporcional_dias(meses_total)
        aviso_indenizado = (salario_base / 30.0) * dias_aviso
    if tipo_rescisao == "pedido" and not aviso_cumprido:
        desconto_aviso = salario_base

    fgts_estimado = salario_base * 0.08 * meses_total
    fgts_base = saldo_fgts if saldo_fgts > 0 else fgts_estimado
    multa_fgts = fgts_base * 0.4 if tipo_rescisao == "sem_justa_causa" else 0.0
    fgts_total = fgts_base + multa_fgts

    indenizacao_prazo = 0.0
    if tipo_rescisao == "prazo_determinado" and motivo_prazo == "antecipado_empregador":
        indenizacao_prazo = salario_base / 2.0

    partes = [
        round2(saldo_salario),
        round2(decimo_terceiro),
        round2(ferias_prop),
        round2(terco_ferias_prop),
        round2(ferias_vencidas),
        round2(terco_ferias_vencidas),
        round2(aviso_indenizado),
        round2(indenizacao_prazo),
        round2(-desconto_aviso),
        round2(-descontos),
    ]
    proventos = sum(valor for valor in partes if valor > 0)
    descontos_total = abs(sum(valor for valor in partes if valor < 0))
    liquido = proventos - descontos_total

    return {
        "meses_considerados": meses_considerados,
        "saldo_salario": round2(saldo_salario),
        "decimo_terceiro": round2(decimo_terceiro),
        "ferias_prop": round2(ferias_prop),
        "terco_ferias_prop": round2(terco_ferias_prop),
        "aviso_indenizado": round2(aviso_indenizado),
        "fgts_total": round2(fgts_total),
        "proventos": round2(proventos),
        "descontos": round2(descontos_total),
        "liquido": round2(liquido),
    }


def calcular_aliquota_efetiva_simples(anexo: str, rbt12: float) -> dict:
    receita = max(0.0, float(rbt12 or 0))
    tabela = SIMPLES_TABELAS.get(anexo, SIMPLES_TABELAS["III"])
    faixa = next((item for item in tabela if receita <= item["limite"]), tabela[-1])
    if receita <= 0:
        return {"faixa": faixa, "aliquota_efetiva": 0.0}
    aliquota = ((receita * faixa["aliquota"]) - faixa["deducao"]) / receita
    return {"faixa": faixa, "aliquota_efetiva": max(0.0, aliquota)}


def calcular_inss_prolabore(base: float) -> float:
    teto = INSS_FAIXAS[-1]["limite"]
    return round2(min(max(0.0, float(base or 0)), teto) * 0.11)


def calcular_prolabore_liquido(
    prolabore_bruto: float,
    dependentes: int = 0,
    pensao: float = 0.0,
    outras_deducoes: float = 0.0,
) -> dict:
    bruto = max(0.0, float(prolabore_bruto or 0))
    inss = calcular_inss_prolabore(bruto)
    mensal = calcular_irrf_mensal(
        bruto,
        dependentes=dependentes,
        pensao_alimenticia=pensao,
        outras_deducoes=outras_deducoes,
    )
    # Reprocessa IRRF com o INSS especifico do pro-labore.
    deducao_dependentes = max(0, int(dependentes or 0)) * DEDUCAO_DEPENDENTE
    deducoes_legais = inss + deducao_dependentes + max(0.0, float(pensao or 0)) + max(0.0, float(outras_deducoes or 0))
    deducao_aplicada = max(deducoes_legais, DESCONTO_SIMPLIFICADO)
    base_calculo = max(0.0, bruto - deducao_aplicada)
    irrf_bruto = calcular_irrf_bruto(base_calculo)
    reducao = calcular_reducao_lei_15270(bruto, irrf_bruto)
    irrf_final = max(0.0, irrf_bruto - reducao)
    liquido = bruto - inss - irrf_final - max(0.0, float(pensao or 0)) - max(0.0, float(outras_deducoes or 0))
    return {
        "inss": inss,
        "base_calculo": round2(base_calculo),
        "irrf_final": round2(irrf_final),
        "liquido": round2(liquido),
        "deducao_aplicada": round2(deducao_aplicada),
        "mensal_helper": mensal,
    }


def calcular_lucro_presumido_mensal(faturamento_mensal: float, atividade: str, aliquota_local: float = 0.0) -> dict:
    receita = max(0.0, float(faturamento_mensal or 0))
    aliq_local = max(0.0, float(aliquota_local or 0)) / 100.0
    if atividade == "servicos":
        percentual_irpj = 0.32
        percentual_csll = 0.32
    else:
        percentual_irpj = 0.08
        percentual_csll = 0.12
    base_irpj = receita * percentual_irpj
    irpj = (base_irpj * 0.15) + (max(0.0, base_irpj - 20000.0) * 0.10)
    base_csll = receita * percentual_csll
    csll = base_csll * 0.09
    pis_cofins = receita * 0.0365
    tributo_local = receita * aliq_local
    total = irpj + csll + pis_cofins + tributo_local
    return {
        "base_irpj": round2(base_irpj),
        "base_csll": round2(base_csll),
        "irpj": round2(irpj),
        "csll": round2(csll),
        "pis_cofins": round2(pis_cofins),
        "tributo_local": round2(tributo_local),
        "total": round2(total),
    }


def calcular_decimo_terceiro_liquido(salario_base: float, dependentes: int = 0) -> dict:
    bruto = max(0.0, float(salario_base or 0))
    primeira_parcela = bruto * 0.5
    mensal = calcular_irrf_mensal(bruto, dependentes=dependentes)
    liquido_total = bruto - mensal["inss"] - mensal["irrf_final"]
    return {
        "bruto": round2(bruto),
        "primeira_parcela": round2(primeira_parcela),
        "liquido_total": round2(liquido_total),
        "segunda_parcela": round2(max(0.0, liquido_total - primeira_parcela)),
    }


def calcular_distribuicao_lucros(
    faturamento_mensal: float,
    custos_mensais: float,
    tributos_mensais: float,
    reserva_percentual: float,
    participacao_socio: float,
) -> dict:
    lucro_antes_reserva = max(0.0, float(faturamento_mensal or 0)) - max(0.0, float(custos_mensais or 0)) - max(0.0, float(tributos_mensais or 0))
    reserva = lucro_antes_reserva * (max(0.0, min(float(reserva_percentual or 0), 40.0)) / 100.0) if lucro_antes_reserva > 0 else 0.0
    lucro_distribuivel = max(0.0, lucro_antes_reserva - reserva)
    parcela_socio = lucro_distribuivel * (max(1.0, min(float(participacao_socio or 0), 100.0)) / 100.0)
    return {
        "lucro_antes_reserva": round2(lucro_antes_reserva),
        "reserva": round2(reserva),
        "lucro_distribuivel": round2(lucro_distribuivel),
        "parcela_socio": round2(parcela_socio),
    }


def calcular_pj_vs_clt(
    salario_clt_bruto: float,
    beneficios_clt: float,
    dependentes: int,
    regime_pj: str,
    faturamento_pj_mensal: float,
    custos_pj_mensais: float,
    prolabore_mensal: float,
    rbt12_pj: float,
    anexo_pj: str,
    atividade_pj: str,
    aliquota_local_pj: float,
) -> dict:
    clt_mensal = calcular_irrf_mensal(salario_clt_bruto, dependentes=dependentes)
    ferias = calcular_ferias(salario_clt_bruto, 30)
    ferias_incremental = round2(max(0.0, ferias["liquido"] - (salario_clt_bruto - clt_mensal["inss"] - clt_mensal["irrf_final"])))
    decimo = calcular_irrf_mensal(salario_clt_bruto, dependentes=dependentes)
    decimo_liquido = round2(salario_clt_bruto - decimo["inss"] - decimo["irrf_final"])
    caixa_clt_anual = round2(((salario_clt_bruto - clt_mensal["inss"] - clt_mensal["irrf_final"]) * 12) + (beneficios_clt * 12) + ferias_incremental + decimo_liquido)
    fgts_anual = round2(salario_clt_bruto * 0.08 * 13)

    prolabore = calcular_prolabore_liquido(prolabore_mensal, dependentes=dependentes)
    receita_anual = faturamento_pj_mensal * 12
    rbt12 = rbt12_pj if rbt12_pj > 0 else receita_anual
    if regime_pj == "simples":
        simples = calcular_aliquota_efetiva_simples(anexo_pj, rbt12)
        das_mensal = faturamento_pj_mensal * simples["aliquota_efetiva"]
        cpp_mensal = prolabore_mensal * 0.20 if anexo_pj == "IV" else 0.0
        tributo_pj_mensal = das_mensal + cpp_mensal
    else:
        presumido = calcular_lucro_presumido_mensal(faturamento_pj_mensal, atividade_pj, aliquota_local_pj)
        tributo_pj_mensal = presumido["total"] + (prolabore_mensal * 0.20)
    caixa_empresa_antes_distribuicao = receita_anual - (custos_pj_mensais * 12) - (tributo_pj_mensal * 12)
    distribuicao_lucros = max(0.0, caixa_empresa_antes_distribuicao - (prolabore_mensal * 12))
    caixa_pj_anual = round2((prolabore["liquido"] * 12) + distribuicao_lucros)
    return {
        "caixa_clt_anual": caixa_clt_anual,
        "fgts_anual": fgts_anual,
        "caixa_pj_anual": caixa_pj_anual,
        "diferenca_anual": round2(caixa_pj_anual - caixa_clt_anual),
        "distribuicao_lucros": round2(distribuicao_lucros),
    }


class CalculadorasFormulaTests(unittest.TestCase):
    def assertMoney(self, actual: float, expected: float, label: str) -> None:
        self.assertAlmostEqual(actual, expected, places=2, msg=label)

    def test_inss_progressivo_faixas_e_teto(self) -> None:
        self.assertMoney(calcular_inss_progressivo(1621.00), 121.58, "INSS faixa 1")
        self.assertMoney(calcular_inss_progressivo(4354.27), 411.11, "INSS faixa 3")
        self.assertMoney(calcular_inss_progressivo(8475.55), 988.09, "INSS teto")
        self.assertMoney(calcular_inss_progressivo(9000.00), 988.09, "INSS acima do teto")

    def test_irrf_mensal_exemplo_site(self) -> None:
        resultado = calcular_irrf_mensal(6200, dependentes=1, pensao_alimenticia=0, outras_deducoes=200)
        self.assertMoney(resultado["inss"], 669.51, "INSS exemplo")
        self.assertMoney(resultado["base_calculo"], 5140.90, "Base calculo exemplo")
        self.assertMoney(resultado["irrf_bruto"], 505.02, "IRRF bruto exemplo")
        self.assertMoney(resultado["reducao"], 153.12, "Reducao exemplo")
        self.assertMoney(resultado["irrf_final"], 351.90, "IRRF final exemplo")
        self.assertMoney(resultado["aliquota_efetiva"], 5.68, "Aliquota efetiva exemplo")

    def test_irrf_reducao_zerando_imposto_ate_limite(self) -> None:
        resultado = calcular_irrf_mensal(4500)
        self.assertMoney(resultado["irrf_bruto"], 200.39, "IRRF bruto faixa de reducao")
        self.assertMoney(resultado["reducao"], 200.39, "Reducao aplicada")
        self.assertMoney(resultado["irrf_final"], 0.00, "IRRF final zerado")

    def test_irrf_sem_reducao_acima_faixa(self) -> None:
        resultado = calcular_irrf_mensal(7600)
        self.assertMoney(resultado["reducao"], 0.00, "Reducao nao aplicavel")
        self.assertMoney(resultado["irrf_final"], 943.25, "IRRF final sem reducao")

    def test_ferias_com_abono_exemplo(self) -> None:
        resultado = calcular_ferias(
            salario_base=4200,
            dias_ferias=20,
            media_variavel=300,
            vender_ferias=True,
            dias_vendidos=6,
        )
        self.assertMoney(resultado["bruto_total"], 5200.00, "Bruto ferias com abono")
        self.assertMoney(resultado["inss"], 368.60, "INSS ferias com abono")
        self.assertMoney(resultado["irrf"], 0.00, "IRRF ferias com abono")
        self.assertMoney(resultado["liquido"], 4831.40, "Liquido ferias com abono")

    def test_ferias_sem_abono(self) -> None:
        resultado = calcular_ferias(
            salario_base=3500,
            dias_ferias=30,
            media_variavel=0,
            vender_ferias=False,
            dias_vendidos=0,
        )
        self.assertMoney(resultado["valor_diario"], 116.67, "Valor diario")
        self.assertMoney(resultado["bruto_total"], 4666.67, "Bruto sem abono")
        self.assertMoney(resultado["descontos"], 454.85, "Descontos sem abono")
        self.assertMoney(resultado["liquido"], 4211.82, "Liquido sem abono")

    def test_aviso_previo_proporcional(self) -> None:
        self.assertEqual(calcular_aviso_proporcional_dias(0), 30)
        self.assertEqual(calcular_aviso_proporcional_dias(12), 30)
        self.assertEqual(calcular_aviso_proporcional_dias(24), 33)
        self.assertEqual(calcular_aviso_proporcional_dias(36), 36)
        self.assertEqual(calcular_aviso_proporcional_dias(300), 90)

    def test_rescisao_sem_justa_causa_exemplo(self) -> None:
        resultado = calcular_rescisao(
            tipo_rescisao="sem_justa_causa",
            salario=4200,
            meses_contrato=36,
            meses_ano_atual=5,
            dias_trabalhados=18,
            aviso_cumprido=True,
            ferias_vencidas_qtd=0,
            saldo_fgts_informado=0,
            descontos_extras=150,
        )
        self.assertEqual(resultado["meses_considerados"], 6)
        self.assertMoney(resultado["aviso_indenizado"], 5040.00, "Aviso indenizado")
        self.assertMoney(resultado["fgts_total"], 16934.40, "FGTS total")
        self.assertMoney(resultado["proventos"], 12460.00, "Proventos")
        self.assertMoney(resultado["descontos"], 150.00, "Descontos")
        self.assertMoney(resultado["liquido"], 12310.00, "Liquido")

    def test_rescisao_pedido_sem_aviso(self) -> None:
        resultado = calcular_rescisao(
            tipo_rescisao="pedido",
            salario=3000,
            meses_contrato=14,
            meses_ano_atual=2,
            dias_trabalhados=10,
            aviso_cumprido=False,
            ferias_vencidas_qtd=1,
            saldo_fgts_informado=5000,
            descontos_extras=250,
        )
        self.assertEqual(resultado["meses_considerados"], 2)
        self.assertMoney(resultado["fgts_total"], 5000.00, "FGTS informado")
        self.assertMoney(resultado["descontos"], 3250.00, "Descontos pedido sem aviso")
        self.assertMoney(resultado["liquido"], 2916.67, "Liquido pedido sem aviso")

    def test_rescisao_prazo_determinado_indenizacao(self) -> None:
        resultado = calcular_rescisao(
            tipo_rescisao="prazo_determinado",
            salario=2800,
            meses_contrato=8,
            meses_ano_atual=6,
            dias_trabalhados=16,
            aviso_cumprido=True,
            ferias_vencidas_qtd=0,
            saldo_fgts_informado=0,
            descontos_extras=0,
            motivo_prazo="antecipado_empregador",
        )
        self.assertMoney(resultado["fgts_total"], 1792.00, "FGTS prazo determinado")
        self.assertMoney(resultado["proventos"], 6704.43, "Proventos prazo determinado")
        self.assertMoney(resultado["liquido"], 6704.43, "Liquido prazo determinado")

    def test_prolabore_liquido_presumido(self) -> None:
        resultado = calcular_prolabore_liquido(8000, dependentes=1)
        self.assertMoney(resultado["inss"], 880.00, "INSS pro-labore")
        self.assertMoney(resultado["base_calculo"], 6930.41, "Base IRRF pro-labore")
        self.assertMoney(resultado["irrf_final"], 997.13, "IRRF pro-labore")
        self.assertMoney(resultado["liquido"], 6122.87, "Liquido pro-labore")

    def test_lucro_presumido_servicos_com_tributo_local(self) -> None:
        resultado = calcular_lucro_presumido_mensal(85000, "servicos", aliquota_local=2)
        self.assertMoney(resultado["base_irpj"], 27200.00, "Base IRPJ servicos")
        self.assertMoney(resultado["irpj"], 4800.00, "IRPJ servicos")
        self.assertMoney(resultado["csll"], 2448.00, "CSLL servicos")
        self.assertMoney(resultado["pis_cofins"], 3102.50, "PIS/Cofins servicos")
        self.assertMoney(resultado["tributo_local"], 1700.00, "Tributo local servicos")
        self.assertMoney(resultado["total"], 12050.50, "Total presumido servicos")

    def test_simples_vs_presumido_servicos(self) -> None:
        simples = calcular_aliquota_efetiva_simples("III", 1020000)
        total_simples = round2((85000 * simples["aliquota_efetiva"]))
        presumido = calcular_lucro_presumido_mensal(85000, "servicos", aliquota_local=2)
        total_presumido = round2(presumido["total"] + (18000 * 0.20))
        economia_anual = round2((total_presumido - total_simples) * 12)
        self.assertMoney(total_simples, 10630.00, "Total Simples mensal")
        self.assertMoney(total_presumido, 15650.50, "Total Presumido mensal")
        self.assertMoney(economia_anual, 60246.00, "Economia anual no Simples")

    def test_distribuicao_lucros_com_reserva(self) -> None:
        resultado = calcular_distribuicao_lucros(
            faturamento_mensal=120000,
            custos_mensais=63000,
            tributos_mensais=9800,
            reserva_percentual=15,
            participacao_socio=50,
        )
        self.assertMoney(resultado["lucro_antes_reserva"], 47200.00, "Lucro antes da reserva")
        self.assertMoney(resultado["reserva"], 7080.00, "Reserva mensal")
        self.assertMoney(resultado["lucro_distribuivel"], 40120.00, "Lucro distribuivel")
        self.assertMoney(resultado["parcela_socio"], 20060.00, "Parcela do socio")

    def test_pj_vs_clt_comparativo_base(self) -> None:
        resultado = calcular_pj_vs_clt(
            salario_clt_bruto=9500,
            beneficios_clt=1350,
            dependentes=1,
            regime_pj="simples",
            faturamento_pj_mensal=17500,
            custos_pj_mensais=1800,
            prolabore_mensal=5000,
            rbt12_pj=210000,
            anexo_pj="III",
            atividade_pj="servicos",
            aliquota_local_pj=0,
        )
        self.assertMoney(resultado["caixa_clt_anual"], 111159.70, "Caixa anual CLT")
        self.assertMoney(resultado["fgts_anual"], 9880.00, "FGTS anual")
        self.assertMoney(resultado["distribuicao_lucros"], 114240.00, "Distribuicao de lucros")
        self.assertMoney(resultado["caixa_pj_anual"], 167640.00, "Caixa anual PJ")
        self.assertMoney(resultado["diferenca_anual"], 56480.30, "Diferenca anual PJ x CLT")


if __name__ == "__main__":
    unittest.main(verbosity=2)

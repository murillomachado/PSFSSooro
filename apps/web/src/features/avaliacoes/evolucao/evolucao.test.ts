import type { AvaliacaoResposta, FaixaImcResposta } from '@psfssooro/contracts'
import { describe, expect, it } from 'vitest'
import { faixasVisiveis, limitesDoEixo, prepararEvolucao } from './evolucao.ts'

const avaliacao = (dataAvaliacao: string, imc: number, pesoKg: number, codigo = 'PESO_NORMAL'): AvaliacaoResposta => ({
  id: dataAvaliacao,
  aluno: { id: 'a1', nome: 'Pam Beesly' },
  professor: { id: 'p1', nome: 'Jim Halpert' },
  dataAvaliacao,
  alturaM: 1.68,
  pesoKg,
  imc,
  classificacao: { codigo, descricao: codigo === 'SOBREPESO' ? 'Sobrepeso' : 'Peso normal' },
  criadoEm: `${dataAvaliacao}T10:00:00.000Z`,
  atualizadoEm: `${dataAvaliacao}T10:00:00.000Z`,
})

const FAIXAS: FaixaImcResposta[] = [
  { codigo: 'ABAIXO_DO_PESO', descricao: 'Abaixo do peso', minimo: 0 },
  { codigo: 'PESO_NORMAL', descricao: 'Peso normal', minimo: 18.5 },
  { codigo: 'SOBREPESO', descricao: 'Sobrepeso', minimo: 25 },
  { codigo: 'OBESIDADE_I', descricao: 'Obesidade grau I', minimo: 30 },
]

describe('prepararEvolucao', () => {
  it('põe as avaliações em ordem cronológica (a API manda da mais nova para a mais antiga)', () => {
    const evolucao = prepararEvolucao([
      avaliacao('2026-10-05', 21.8, 61.5),
      avaliacao('2026-06-05', 23.4, 66),
      avaliacao('2026-08-05', 22.5, 63.5),
    ])
    expect(evolucao.pontos.map((p) => p.rotulo)).toEqual(['05/06', '05/08', '05/10'])
    expect(evolucao.pontos.map((p) => p.imc)).toEqual([23.4, 22.5, 21.8])
  })

  it('calcula a variação do IMC e do peso entre a primeira e a última avaliação', () => {
    const evolucao = prepararEvolucao([
      avaliacao('2026-10-05', 21.8, 61.5),
      avaliacao('2026-05-05', 25.3, 71.4, 'SOBREPESO'),
    ])
    expect(evolucao.atual?.imc).toBeCloseTo(21.8)
    expect(evolucao.variacaoImc).toBeCloseTo(-3.5)
    expect(evolucao.variacaoPeso).toBeCloseTo(-9.9)
  })

  it('sem avaliação, não há ponto atual nem variação; com uma só, a variação é zero', () => {
    expect(prepararEvolucao([])).toEqual({ pontos: [], atual: undefined, variacaoImc: 0, variacaoPeso: 0 })
    expect(prepararEvolucao([avaliacao('2026-10-05', 21.8, 61.5)]).variacaoImc).toBe(0)
  })
})

describe('escala do gráfico', () => {
  it('o eixo do IMC abre uma folga em volta dos valores, em números inteiros', () => {
    expect(limitesDoEixo([21.8, 23.4])).toEqual([19, 26])
    expect(limitesDoEixo([])).toEqual([15, 35])
  })

  it('mostra só as faixas que cruzam o eixo, cortadas nos limites dele', () => {
    expect(faixasVisiveis(FAIXAS, [19, 26])).toEqual([
      { codigo: 'PESO_NORMAL', descricao: 'Peso normal', de: 19, ate: 25 },
      { codigo: 'SOBREPESO', descricao: 'Sobrepeso', de: 25, ate: 26 },
    ])
  })
})

import type { AvaliacaoResposta, FaixaImcResposta } from '@psfssooro/contracts'
import { formatarData } from '../apresentacao.ts'

export interface PontoDaEvolucao {
  readonly data: string
  /** Dia e mês (05/10), para o eixo do gráfico. */
  readonly rotulo: string
  readonly imc: number
  readonly pesoKg: number
  readonly codigoDaFaixa: string
  readonly faixa: string
  readonly professor: string
}

export interface Evolucao {
  readonly pontos: readonly PontoDaEvolucao[]
  readonly atual: PontoDaEvolucao | undefined
  /** Diferença entre a última e a primeira avaliação; zero com menos de duas. */
  readonly variacaoImc: number
  readonly variacaoPeso: number
}

export interface FaixaVisivel {
  readonly codigo: string
  readonly descricao: string
  readonly de: number
  readonly ate: number
}

const umaCasa = (valor: number): number => Math.round(valor * 10) / 10

const paraPonto = (a: AvaliacaoResposta): PontoDaEvolucao => ({
  data: formatarData(a.dataAvaliacao),
  rotulo: formatarData(a.dataAvaliacao).slice(0, 5),
  imc: a.imc,
  pesoKg: a.pesoKg,
  codigoDaFaixa: a.classificacao.codigo,
  faixa: a.classificacao.descricao,
  professor: a.professor.nome,
})

/** Da lista da API (mais nova primeiro) para a linha do tempo do gráfico, com o resumo da evolução. */
export function prepararEvolucao(avaliacoes: readonly AvaliacaoResposta[]): Evolucao {
  const ordenadas = avaliacoes.toSorted(
    (a, b) => a.dataAvaliacao.localeCompare(b.dataAvaliacao) || a.criadoEm.localeCompare(b.criadoEm),
  )
  const pontos = ordenadas.map(paraPonto)
  const primeiro = pontos.at(0)
  const atual = pontos.at(-1)
  return {
    pontos,
    atual,
    variacaoImc: primeiro && atual ? umaCasa(atual.imc - primeiro.imc) : 0,
    variacaoPeso: primeiro && atual ? umaCasa(atual.pesoKg - primeiro.pesoKg) : 0,
  }
}

const FOLGA = 2
const EIXO_PADRAO: [number, number] = [15, 35]

/** O eixo do IMC vai de um pouco abaixo do menor valor a um pouco acima do maior. */
export function limitesDoEixo(imcs: readonly number[]): [number, number] {
  if (imcs.length === 0) return EIXO_PADRAO
  return [Math.floor(Math.min(...imcs) - FOLGA), Math.ceil(Math.max(...imcs) + FOLGA)]
}

/** As faixas do catálogo que aparecem no eixo, cada uma indo até onde a próxima começa. */
export function faixasVisiveis(
  faixas: readonly FaixaImcResposta[],
  [minimo, maximo]: [number, number],
): FaixaVisivel[] {
  return faixas
    .map((faixa, i) => ({
      codigo: faixa.codigo,
      descricao: faixa.descricao,
      de: Math.max(faixa.minimo, minimo),
      ate: Math.min(faixas[i + 1]?.minimo ?? Number.POSITIVE_INFINITY, maximo),
    }))
    .filter((faixa) => faixa.de < faixa.ate)
}

import { calcularImcEmDecimos, classificar } from './imc.ts'

export interface DadosDaAvaliacao {
  readonly alunoId: string
  readonly professorId: string
  /** Dia da avaliação, em AAAA-MM-DD. */
  readonly dataAvaliacao: string
  readonly alturaCm: number
  readonly pesoG: number
}

export interface Avaliacao extends DadosDaAvaliacao {
  readonly id: string
  readonly imcEmDecimos: number
  /** Código da faixa, gravado junto com o IMC. */
  readonly classificacao: string
  readonly criadoEm: string
  readonly atualizadoEm: string
}

export interface IdentidadeDaAvaliacao {
  readonly id: string
  readonly criadoEm: string
  readonly atualizadoEm: string
}

/** Monta a avaliação calculando o IMC e a classificação: o cliente nunca informa os dois. */
export function criarAvaliacao(identidade: IdentidadeDaAvaliacao, dados: DadosDaAvaliacao): Avaliacao {
  const imcEmDecimos = calcularImcEmDecimos(dados.alturaCm, dados.pesoG)
  return { ...identidade, ...dados, imcEmDecimos, classificacao: classificar(imcEmDecimos).codigo }
}

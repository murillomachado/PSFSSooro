import { LIMITE_MAXIMO } from '@psfssooro/contracts'
import type { FiltrosDeAvaliacoes } from './services/avaliacoes.service.ts'

/**
 * As chaves das consultas de avaliações. Ficam fora dos hooks (que só rodam no navegador) porque o
 * servidor usa as mesmas para entregar a página com os dados já carregados.
 */
export const CHAVE_DE_AVALIACOES = 'avaliacoes'

/** Todo o histórico de um aluno, até o teto de paginação da API, para o gráfico de evolução. */
export const filtrosDoHistorico = (alunoId: string): FiltrosDeAvaliacoes => ({
  pagina: 1,
  limite: LIMITE_MAXIMO,
  alunoId,
})

export const chavesDeAvaliacoes = {
  lista: (filtros: FiltrosDeAvaliacoes) => [CHAVE_DE_AVALIACOES, 'lista', filtros] as const,
  faixas: () => [CHAVE_DE_AVALIACOES, 'faixas'] as const,
  uma: (id: string) => [CHAVE_DE_AVALIACOES, 'uma', id] as const,
}

/** Os filtros com que a lista abre: a primeira página, sem filtro nenhum. */
export const PRIMEIRA_PAGINA: FiltrosDeAvaliacoes = { pagina: 1 }

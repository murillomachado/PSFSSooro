import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { Avaliacao } from '../domain/avaliacao.ts'

export interface FiltrosDeAvaliacao {
  readonly alunoId?: string
  readonly professorId?: string
  /** Primeiro dia do período, em AAAA-MM-DD, inclusive. */
  readonly de?: string
  /** Último dia do período, em AAAA-MM-DD, inclusive. */
  readonly ate?: string
  readonly pagina: number
  readonly limite: number
}

/** O que os casos de uso precisam para guardar e achar avaliações. Quem implementa é a camada infra/. */
export interface AvaliacaoRepository {
  buscarPorId(id: string): Promise<Avaliacao | undefined>
  /** Da mais recente para a mais antiga, pela data da avaliação. */
  listar(filtros: FiltrosDeAvaliacao): Promise<PaginaDe<Avaliacao>>
  /** Cria a avaliação, ou atualiza se o id já existe. */
  salvar(avaliacao: Avaliacao): Promise<void>
  excluir(id: string): Promise<void>
  /** O usuário aparece em alguma avaliação, como aluno ou como professor. */
  usuarioPossuiAvaliacoes(usuarioId: string): Promise<boolean>
}

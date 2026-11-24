import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { AvaliacaoRepository, FiltrosDeAvaliacao } from '../application/avaliacao-repository.ts'
import type { Avaliacao } from '../domain/avaliacao.ts'

/** Mesma interface do repositório do TypeORM, em memória, para os testes dos casos de uso. */
export class MemoriaAvaliacaoRepository implements AvaliacaoRepository {
  private readonly avaliacoes = new Map<string, Avaliacao>()

  buscarPorId(id: string): Promise<Avaliacao | undefined> {
    return Promise.resolve(this.avaliacoes.get(id))
  }

  listar(filtros: FiltrosDeAvaliacao): Promise<PaginaDe<Avaliacao>> {
    const filtradas = [...this.avaliacoes.values()]
      .filter((a) => filtros.alunoId === undefined || a.alunoId === filtros.alunoId)
      .filter((a) => filtros.professorId === undefined || a.professorId === filtros.professorId)
      .filter((a) => filtros.de === undefined || a.dataAvaliacao >= filtros.de)
      .filter((a) => filtros.ate === undefined || a.dataAvaliacao <= filtros.ate)
      .sort((a, b) => b.dataAvaliacao.localeCompare(a.dataAvaliacao) || a.id.localeCompare(b.id))
    const inicio = (filtros.pagina - 1) * filtros.limite
    return Promise.resolve({
      itens: filtradas.slice(inicio, inicio + filtros.limite),
      total: filtradas.length,
      pagina: filtros.pagina,
      limite: filtros.limite,
    })
  }

  salvar(avaliacao: Avaliacao): Promise<void> {
    this.avaliacoes.set(avaliacao.id, avaliacao)
    return Promise.resolve()
  }

  excluir(id: string): Promise<void> {
    this.avaliacoes.delete(id)
    return Promise.resolve()
  }

  usuarioPossuiAvaliacoes(usuarioId: string): Promise<boolean> {
    const possui = [...this.avaliacoes.values()].some((a) => a.alunoId === usuarioId || a.professorId === usuarioId)
    return Promise.resolve(possui)
  }
}

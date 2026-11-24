import type { DataSource, Repository } from 'typeorm'
import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { AvaliacaoRepository, FiltrosDeAvaliacao } from '../application/avaliacao-repository.ts'
import type { Avaliacao } from '../domain/avaliacao.ts'
import { AvaliacaoEntity } from './avaliacao.entity.ts'
import { paraDominio, paraPersistencia } from './avaliacao.mapper.ts'

/** Guarda avaliações no SQLite com o TypeORM. Recebe e devolve só objetos do domínio. */
export class TypeOrmAvaliacaoRepository implements AvaliacaoRepository {
  private readonly repositorio: Repository<AvaliacaoEntity>

  constructor(banco: DataSource) {
    this.repositorio = banco.getRepository(AvaliacaoEntity)
  }

  async buscarPorId(id: string): Promise<Avaliacao | undefined> {
    const entidade = await this.repositorio.findOneBy({ id })
    return entidade === null ? undefined : paraDominio(entidade)
  }

  async listar(filtros: FiltrosDeAvaliacao): Promise<PaginaDe<Avaliacao>> {
    const consulta = this.repositorio.createQueryBuilder('a')
    if (filtros.alunoId !== undefined) consulta.andWhere('a.aluno_id = :alunoId', { alunoId: filtros.alunoId })
    if (filtros.professorId !== undefined) {
      consulta.andWhere('a.professor_id = :professorId', { professorId: filtros.professorId })
    }
    if (filtros.de !== undefined) consulta.andWhere('a.data_avaliacao >= :de', { de: filtros.de })
    if (filtros.ate !== undefined) consulta.andWhere('a.data_avaliacao <= :ate', { ate: filtros.ate })
    const [entidades, total] = await consulta
      .orderBy('a.data_avaliacao', 'DESC')
      .addOrderBy('a.id', 'ASC')
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
      .getManyAndCount()
    return { itens: entidades.map(paraDominio), total, pagina: filtros.pagina, limite: filtros.limite }
  }

  async salvar(avaliacao: Avaliacao): Promise<void> {
    await this.repositorio.save(paraPersistencia(avaliacao))
  }

  async excluir(id: string): Promise<void> {
    await this.repositorio.delete({ id })
  }

  async usuarioPossuiAvaliacoes(usuarioId: string): Promise<boolean> {
    return this.repositorio.exists({ where: [{ alunoId: usuarioId }, { professorId: usuarioId }] })
  }
}

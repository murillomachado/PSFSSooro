import { type DataSource, In, QueryFailedError, type Repository } from 'typeorm'
import { Conflito } from '../../../shared/errors/erros.ts'
import type { PaginaDe } from '../../../shared/paginacao.ts'
import { usuarioJaExiste } from '../application/regras-compartilhadas.ts'
import type { FiltrosDeUsuario, UsuarioRepository } from '../application/usuario-repository.ts'
import type { Usuario } from '../domain/usuario.ts'
import { UsuarioEntity } from './usuario.entity.ts'
import { paraDominio, paraPersistencia } from './usuario.mapper.ts'

/** Guarda usuários no SQLite com o TypeORM. Recebe e devolve só objetos do domínio. */
export class TypeOrmUsuarioRepository implements UsuarioRepository {
  private readonly repositorio: Repository<UsuarioEntity>

  constructor(banco: DataSource) {
    this.repositorio = banco.getRepository(UsuarioEntity)
  }

  async buscarPorId(id: string): Promise<Usuario | undefined> {
    const entidade = await this.repositorio.findOneBy({ id })
    return entidade === null ? undefined : paraDominio(entidade)
  }

  async buscarPorUsuario(usuario: string): Promise<Usuario | undefined> {
    const entidade = await this.repositorio.findOneBy({ usuario })
    return entidade === null ? undefined : paraDominio(entidade)
  }

  async buscarPorIds(ids: readonly string[]): Promise<Usuario[]> {
    if (ids.length === 0) return []
    return (await this.repositorio.findBy({ id: In([...ids]) })).map(paraDominio)
  }

  async excluir(id: string): Promise<void> {
    try {
      await this.repositorio.delete({ id })
    } catch (erro) {
      // Se uma avaliação (ou um aluno) surgir entre a checagem do caso de uso e o DELETE, a chave
      // estrangeira (RESTRICT) é a palavra final, e vira um conflito (409) em vez de um erro 500.
      if (erro instanceof QueryFailedError && erro.message.includes('FOREIGN KEY')) {
        throw new Conflito(
          'Este usuário tem avaliações ou alunos vinculados e não pode ser excluído. Inative-o em vez de excluir.',
          'USUARIO_COM_AVALIACOES',
        )
      }
      throw erro
    }
  }

  async listar(filtros: FiltrosDeUsuario): Promise<PaginaDe<Usuario>> {
    const consulta = this.repositorio
      .createQueryBuilder('u')
      .where('u.perfil IN (:...perfis)', { perfis: filtros.perfis })
    if (filtros.ativo !== undefined) {
      consulta.andWhere('u.ativo = :ativo', { ativo: filtros.ativo ? 1 : 0 })
    }
    if (filtros.professorId !== undefined) {
      consulta.andWhere('u.professor_id = :professorId', { professorId: filtros.professorId })
    }
    if (filtros.busca !== undefined && filtros.busca !== '') {
      consulta.andWhere('(lower(u.nome) LIKE :busca OR u.usuario LIKE :busca)', {
        busca: `%${filtros.busca.toLowerCase()}%`,
      })
    }
    const [entidades, total] = await consulta
      .orderBy('u.nome', 'ASC')
      .addOrderBy('u.id', 'ASC')
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
      .getManyAndCount()
    return { itens: entidades.map(paraDominio), total, pagina: filtros.pagina, limite: filtros.limite }
  }

  async salvar(usuario: Usuario): Promise<void> {
    try {
      await this.repositorio.save(paraPersistencia(usuario))
    } catch (erro) {
      // Duas requisições simultâneas podem passar pela checagem prévia; o índice único do banco é a
      // palavra final, e a violação dele vira o mesmo conflito (409) do caso de uso.
      if (erro instanceof QueryFailedError && erro.message.includes('UNIQUE constraint failed: usuarios.usuario')) {
        throw usuarioJaExiste()
      }
      throw erro
    }
  }

  contarAdministradoresAtivos(): Promise<number> {
    return this.repositorio.countBy({ perfil: 'ADMINISTRADOR', ativo: true })
  }

  async idsDosAlunosDe(professorId: string): Promise<string[]> {
    const alunos = await this.repositorio.find({ select: { id: true }, where: { professorId } })
    return alunos.map((aluno) => aluno.id)
  }
}

import type { DataSource, Repository } from 'typeorm'
import type { PaginaDe } from '../../../shared/paginacao.ts'
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

  async listar(filtros: FiltrosDeUsuario): Promise<PaginaDe<Usuario>> {
    const consulta = this.repositorio
      .createQueryBuilder('u')
      .where('u.perfil IN (:...perfis)', { perfis: filtros.perfis })
    if (filtros.ativo !== undefined) {
      consulta.andWhere('u.ativo = :ativo', { ativo: filtros.ativo ? 1 : 0 })
    }
    if (filtros.busca !== undefined && filtros.busca !== '') {
      consulta.andWhere('(lower(u.nome) LIKE :busca OR u.usuario LIKE :busca)', {
        busca: `%${filtros.busca.toLowerCase()}%`,
      })
    }
    const [entidades, total] = await consulta
      .orderBy('u.nome', 'ASC')
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
      .getManyAndCount()
    return { itens: entidades.map(paraDominio), total, pagina: filtros.pagina, limite: filtros.limite }
  }

  async salvar(usuario: Usuario): Promise<void> {
    await this.repositorio.save(paraPersistencia(usuario))
  }

  contarAdministradoresAtivos(): Promise<number> {
    return this.repositorio.countBy({ perfil: 'ADMINISTRADOR', ativo: true })
  }
}

import type { PaginaDe } from '../../../shared/paginacao.ts'
import { usuarioJaExiste } from '../application/regras-compartilhadas.ts'
import type { FiltrosDeUsuario, UsuarioRepository } from '../application/usuario-repository.ts'
import type { Usuario } from '../domain/usuario.ts'

/** Mesma interface do repositório do TypeORM, em memória. Os testes dos casos de uso rodam sem banco com ela. */
export class MemoriaUsuarioRepository implements UsuarioRepository {
  private readonly usuarios = new Map<string, Usuario>()

  buscarPorId(id: string): Promise<Usuario | undefined> {
    return Promise.resolve(this.usuarios.get(id))
  }

  buscarPorUsuario(usuario: string): Promise<Usuario | undefined> {
    return Promise.resolve([...this.usuarios.values()].find((candidato) => candidato.usuario === usuario))
  }

  buscarPorIds(ids: readonly string[]): Promise<Usuario[]> {
    return Promise.resolve(ids.flatMap((id) => this.usuarios.get(id) ?? []))
  }

  excluir(id: string): Promise<void> {
    this.usuarios.delete(id)
    return Promise.resolve()
  }

  listar(filtros: FiltrosDeUsuario): Promise<PaginaDe<Usuario>> {
    const busca = filtros.busca?.toLowerCase() ?? ''
    const filtrados = [...this.usuarios.values()]
      .filter((usuario) => filtros.perfis.includes(usuario.perfil))
      .filter((usuario) => filtros.ativo === undefined || usuario.ativo === filtros.ativo)
      .filter((usuario) => filtros.professorId === undefined || usuario.professorId === filtros.professorId)
      .filter((usuario) => usuario.nome.toLowerCase().includes(busca) || usuario.usuario.includes(busca))
      .sort((a, b) => a.nome.localeCompare(b.nome) || a.id.localeCompare(b.id))
    const inicio = (filtros.pagina - 1) * filtros.limite
    return Promise.resolve({
      itens: filtrados.slice(inicio, inicio + filtros.limite),
      total: filtrados.length,
      pagina: filtros.pagina,
      limite: filtros.limite,
    })
  }

  salvar(usuario: Usuario): Promise<void> {
    const repetido = [...this.usuarios.values()].some(
      (outro) => outro.usuario === usuario.usuario && outro.id !== usuario.id,
    )
    if (repetido) return Promise.reject(usuarioJaExiste())
    this.usuarios.set(usuario.id, usuario)
    return Promise.resolve()
  }

  contarAdministradoresAtivos(): Promise<number> {
    const administradores = [...this.usuarios.values()].filter((u) => u.perfil === 'ADMINISTRADOR' && u.ativo)
    return Promise.resolve(administradores.length)
  }

  idsDosAlunosDe(professorId: string): Promise<string[]> {
    const alunos = [...this.usuarios.values()].filter((usuario) => usuario.professorId === professorId)
    return Promise.resolve(alunos.map((aluno) => aluno.id))
  }
}

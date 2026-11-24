import type { ListarUsuariosQuery } from '@psfssooro/contracts'
import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import { perfisQueOAtorGerencia } from '../domain/politicas.ts'
import type { Usuario } from '../domain/usuario.ts'
import type { UsuarioRepository } from './usuario-repository.ts'

export class ListarUsuarios {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async executar(ator: Ator, consulta: ListarUsuariosQuery): Promise<PaginaDe<Usuario>> {
    const visiveis = perfisQueOAtorGerencia(ator)
    const perfis = consulta.perfil === undefined ? visiveis : visiveis.filter((perfil) => perfil === consulta.perfil)
    if (perfis.length === 0) return { itens: [], total: 0, pagina: consulta.pagina, limite: consulta.limite }
    return this.usuarios.listar({
      perfis,
      ativo: consulta.ativo,
      busca: consulta.busca,
      pagina: consulta.pagina,
      limite: consulta.limite,
    })
  }
}

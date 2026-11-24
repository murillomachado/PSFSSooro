import { NaoAutenticado } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import type { Usuario } from '../../usuarios/domain/usuario.ts'

/** Os dados do usuário logado. A Web usa para montar o menu e as permissões da tela. */
export class ObterSessao {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async executar(ator: Ator): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(ator.id)
    if (usuario?.ativo !== true) throw new NaoAutenticado('Autenticação necessária ou expirada.')
    return usuario
  }
}

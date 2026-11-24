import type { Ator } from '../../../shared/security/ator.ts'
import type { Usuario } from '../domain/usuario.ts'
import { localizarVisivel } from './regras-compartilhadas.ts'
import type { UsuarioRepository } from './usuario-repository.ts'

export class ObterUsuario {
  constructor(private readonly usuarios: UsuarioRepository) {}

  executar(ator: Ator, id: string): Promise<Usuario> {
    return localizarVisivel(this.usuarios, ator, id)
  }
}

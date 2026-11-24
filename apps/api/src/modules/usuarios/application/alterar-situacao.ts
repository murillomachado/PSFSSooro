import { RegraDeNegocio, SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { Relogio } from '../../../shared/security/portas.ts'
import type { Usuario } from '../domain/usuario.ts'
import { localizarVisivel } from './regras-compartilhadas.ts'
import type { UsuarioRepository } from './usuario-repository.ts'

/** Ativar e inativar usuários (RF2). Só o administrador faz isso, e nunca em si mesmo. */
export class AlterarSituacao {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly relogio: Relogio,
  ) {}

  async executar(ator: Ator, id: string, ativo: boolean): Promise<Usuario> {
    if (ator.perfil !== 'ADMINISTRADOR') {
      throw new SemPermissao('Só o administrador ativa ou inativa usuários.')
    }
    const alvo = await localizarVisivel(this.usuarios, ator, id)
    // O ator é um administrador ativo. Inativar outra pessoa nunca zera os administradores ativos;
    // só inativar a si mesmo poderia, e por isso é proibido.
    if (!ativo && alvo.id === ator.id) {
      throw new RegraDeNegocio('Você não pode inativar a si mesmo.', 'NAO_INATIVAR_A_SI_MESMO')
    }
    const atualizado: Usuario = { ...alvo, ativo, atualizadoEm: this.relogio.agora().toISOString() }
    await this.usuarios.salvar(atualizado)
    return atualizado
  }
}

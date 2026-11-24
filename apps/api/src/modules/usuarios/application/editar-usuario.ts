import type { EditarUsuarioEntrada } from '@psfssooro/contracts'
import { RegraDeNegocio, SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { HasherDeSenha, Relogio } from '../../../shared/security/portas.ts'
import type { Usuario } from '../domain/usuario.ts'
import { garantirUsuarioLivre, localizarVisivel } from './regras-compartilhadas.ts'
import type { UsuarioRepository } from './usuario-repository.ts'

export class EditarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: HasherDeSenha,
    private readonly relogio: Relogio,
  ) {}

  async executar(ator: Ator, id: string, entrada: EditarUsuarioEntrada): Promise<Usuario> {
    const alvo = await localizarVisivel(this.usuarios, ator, id)
    const perfil = entrada.perfil ?? alvo.perfil
    if (perfil !== alvo.perfil) await this.validarTrocaDePerfil(ator, alvo)
    const login = entrada.usuario ?? alvo.usuario
    if (login !== alvo.usuario) await garantirUsuarioLivre(this.usuarios, login)
    const atualizado: Usuario = {
      ...alvo,
      nome: entrada.nome ?? alvo.nome,
      usuario: login,
      perfil,
      senhaHash: entrada.senha === undefined ? alvo.senhaHash : await this.hasher.gerar(entrada.senha),
      atualizadoEm: this.relogio.agora().toISOString(),
    }
    await this.usuarios.salvar(atualizado)
    return atualizado
  }

  /** Só o administrador troca o perfil, e o sistema nunca fica sem administrador ativo. */
  private async validarTrocaDePerfil(ator: Ator, alvo: Usuario): Promise<void> {
    if (ator.perfil !== 'ADMINISTRADOR') {
      throw new SemPermissao('Só o administrador altera o perfil de um usuário.', 'PERFIL_NAO_PERMITIDO')
    }
    if (alvo.perfil === 'ADMINISTRADOR' && alvo.ativo && (await this.usuarios.contarAdministradoresAtivos()) <= 1) {
      throw new RegraDeNegocio('O último administrador ativo não pode mudar de perfil.', 'ULTIMO_ADMINISTRADOR')
    }
  }
}

import { Conflito, RegraDeNegocio, SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import { localizarVisivel } from './regras-compartilhadas.ts'
import type { UsuarioRepository } from './usuario-repository.ts'
import type { VinculosDoUsuario } from './vinculos.ts'

/** Exclui um usuário (RN1): só o administrador, e só quem não tem avaliações vinculadas. */
export class ExcluirUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly vinculos: VinculosDoUsuario,
  ) {}

  async executar(ator: Ator, id: string): Promise<void> {
    if (ator.perfil !== 'ADMINISTRADOR') throw new SemPermissao('Só o administrador exclui usuários.')
    const alvo = await localizarVisivel(this.usuarios, ator, id)
    if (alvo.id === ator.id) {
      throw new RegraDeNegocio('Você não pode excluir a si mesmo.', 'NAO_EXCLUIR_A_SI_MESMO')
    }
    // O banco também garante isto (chave estrangeira RESTRICT); aqui a resposta já sugere o caminho.
    if (await this.vinculos.possuiAvaliacoes(alvo.id)) {
      throw new Conflito(
        'Este usuário tem avaliações vinculadas e não pode ser excluído. Inative-o em vez de excluir.',
        'USUARIO_COM_AVALIACOES',
      )
    }
    await this.usuarios.excluir(alvo.id)
  }
}

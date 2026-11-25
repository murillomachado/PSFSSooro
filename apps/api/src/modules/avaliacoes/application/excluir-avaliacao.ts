import { SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import type { AvaliacaoRepository } from './avaliacao-repository.ts'
import { localizarAvaliacao } from './regras-compartilhadas.ts'

/** Só o administrador exclui avaliações (RN2). */
export class ExcluirAvaliacao {
  constructor(
    private readonly avaliacoes: AvaliacaoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async executar(ator: Ator, id: string): Promise<void> {
    if (ator.perfil !== 'ADMINISTRADOR') throw new SemPermissao('Só o administrador exclui avaliações.')
    const avaliacao = await localizarAvaliacao(this.avaliacoes, this.usuarios, ator, id)
    await this.avaliacoes.excluir(avaliacao.id)
  }
}

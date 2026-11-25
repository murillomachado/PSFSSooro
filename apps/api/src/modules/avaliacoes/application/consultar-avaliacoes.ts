import type { ListarAvaliacoesQuery } from '@psfssooro/contracts'
import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import type { AvaliacaoRepository } from './avaliacao-repository.ts'
import { type AvaliacaoDetalhada, detalhar, detalharUma } from './detalhes.ts'
import { localizarAvaliacao } from './regras-compartilhadas.ts'

/**
 * Consulta de avaliações com filtro por aluno ou professor (RF5), dentro do que cada perfil enxerga:
 * o administrador, todas (RN3); o professor, as dos seus alunos (RN6); o aluno, as próprias (RN7).
 */
export class ListarAvaliacoes {
  constructor(
    private readonly avaliacoes: AvaliacaoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async executar(ator: Ator, consulta: ListarAvaliacoesQuery): Promise<PaginaDe<AvaliacaoDetalhada>> {
    // O aluno só enxerga as próprias avaliações (RN7): o aluno que ele pedir no filtro é ignorado.
    const alunoId = ator.perfil === 'ALUNO' ? ator.id : consulta.alunoId
    const alunoIds = ator.perfil === 'PROFESSOR' ? await this.usuarios.idsDosAlunosDe(ator.id) : undefined
    const pagina = await this.avaliacoes.listar({ ...consulta, alunoId, alunoIds })
    return { ...pagina, itens: await detalhar(this.usuarios, pagina.itens) }
  }
}

export class ObterAvaliacao {
  constructor(
    private readonly avaliacoes: AvaliacaoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async executar(ator: Ator, id: string): Promise<AvaliacaoDetalhada> {
    return detalharUma(this.usuarios, await localizarAvaliacao(this.avaliacoes, this.usuarios, ator, id))
  }
}

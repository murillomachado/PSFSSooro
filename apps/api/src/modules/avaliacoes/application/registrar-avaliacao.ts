import type { CriarAvaliacaoEntrada } from '@psfssooro/contracts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { Relogio } from '../../../shared/security/portas.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import { criarAvaliacao } from '../domain/avaliacao.ts'
import { emCentimetros, emGramas } from '../domain/medidas.ts'
import type { AvaliacaoRepository } from './avaliacao-repository.ts'
import { type AvaliacaoDetalhada, detalharUma } from './detalhes.ts'
import { definirProfessor, garantirDataNaoFutura, validarParticipantes } from './regras-compartilhadas.ts'

/**
 * Registra uma avaliação (RF3, RF4, RN2, RN5, RN9). O professor avalia só os seus alunos (RN6).
 * O IMC e a classificação são calculados aqui, nunca recebidos.
 */
export class RegistrarAvaliacao {
  constructor(
    private readonly avaliacoes: AvaliacaoRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly relogio: Relogio,
    private readonly gerarId: () => string,
  ) {}

  async executar(ator: Ator, entrada: CriarAvaliacaoEntrada): Promise<AvaliacaoDetalhada> {
    const professorId = definirProfessor(ator, entrada.professorId)
    garantirDataNaoFutura(this.relogio, entrada.dataAvaliacao)
    const responsavel = ator.perfil === 'PROFESSOR' ? ator.id : undefined
    await validarParticipantes(this.usuarios, entrada.alunoId, professorId, responsavel)
    const agora = this.relogio.agora().toISOString()
    const avaliacao = criarAvaliacao(
      { id: this.gerarId(), criadoEm: agora, atualizadoEm: agora },
      {
        alunoId: entrada.alunoId,
        professorId,
        dataAvaliacao: entrada.dataAvaliacao,
        alturaCm: emCentimetros(entrada.alturaM),
        pesoG: emGramas(entrada.pesoKg),
      },
    )
    await this.avaliacoes.salvar(avaliacao)
    return detalharUma(this.usuarios, avaliacao)
  }
}

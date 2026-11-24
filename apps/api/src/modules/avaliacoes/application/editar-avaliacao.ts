import type { EditarAvaliacaoEntrada } from '@psfssooro/contracts'
import { SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { Relogio } from '../../../shared/security/portas.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import { type Avaliacao, type DadosDaAvaliacao, criarAvaliacao } from '../domain/avaliacao.ts'
import { emCentimetros, emGramas } from '../domain/medidas.ts'
import { podeEditarAvaliacao } from '../domain/politicas.ts'
import type { AvaliacaoRepository } from './avaliacao-repository.ts'
import { type AvaliacaoDetalhada, detalharUma } from './detalhes.ts'
import { garantirDataNaoFutura, localizarAvaliacao, validarParticipantes } from './regras-compartilhadas.ts'

/** Corrige uma avaliação (RN2, RN5) e recalcula o IMC. O professor edita só as que realizou (D3). */
export class EditarAvaliacao {
  constructor(
    private readonly avaliacoes: AvaliacaoRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly relogio: Relogio,
  ) {}

  async executar(ator: Ator, id: string, entrada: EditarAvaliacaoEntrada): Promise<AvaliacaoDetalhada> {
    const atual = await localizarAvaliacao(this.avaliacoes, ator, id)
    // O professor vê as avaliações dos colegas, mas só edita as suas: 403, e não 404.
    if (!podeEditarAvaliacao(ator, atual)) {
      throw new SemPermissao('Você só edita as avaliações que realizou.', 'AVALIACAO_DE_OUTRO_PROFESSOR')
    }
    const novos = this.novosDados(atual, entrada)
    await this.validarMudancas(ator, atual, novos)
    const avaliacao = criarAvaliacao(
      { id: atual.id, criadoEm: atual.criadoEm, atualizadoEm: this.relogio.agora().toISOString() },
      novos,
    )
    await this.avaliacoes.salvar(avaliacao)
    return detalharUma(this.usuarios, avaliacao)
  }

  private novosDados(atual: Avaliacao, entrada: EditarAvaliacaoEntrada): DadosDaAvaliacao {
    return {
      alunoId: entrada.alunoId ?? atual.alunoId,
      professorId: entrada.professorId ?? atual.professorId,
      dataAvaliacao: entrada.dataAvaliacao ?? atual.dataAvaliacao,
      alturaCm: entrada.alturaM === undefined ? atual.alturaCm : emCentimetros(entrada.alturaM),
      pesoG: entrada.pesoKg === undefined ? atual.pesoG : emGramas(entrada.pesoKg),
    }
  }

  private async validarMudancas(ator: Ator, atual: Avaliacao, novos: DadosDaAvaliacao): Promise<void> {
    // Corrigir uma avaliação antiga de quem foi inativado depois é permitido: só a troca de aluno ou de
    // professor, que cria um vínculo novo, exige que os dois estejam ativos (D6).
    if (novos.alunoId !== atual.alunoId || novos.professorId !== atual.professorId) {
      if (ator.perfil !== 'ADMINISTRADOR') {
        throw new SemPermissao('Só o administrador troca o aluno ou o avaliador.', 'ALTERACAO_NAO_PERMITIDA')
      }
      await validarParticipantes(
        this.usuarios,
        novos.alunoId === atual.alunoId ? undefined : novos.alunoId,
        novos.professorId === atual.professorId ? undefined : novos.professorId,
      )
    }
    if (novos.dataAvaliacao !== atual.dataAvaliacao) garantirDataNaoFutura(this.relogio, novos.dataAvaliacao)
  }
}

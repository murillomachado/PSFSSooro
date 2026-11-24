import { EntradaInvalida, NaoEncontrado, RegraDeNegocio, SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { Relogio } from '../../../shared/security/portas.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import type { Avaliacao } from '../domain/avaliacao.ts'
import { podeVerAvaliacao } from '../domain/politicas.ts'
import type { AvaliacaoRepository } from './avaliacao-repository.ts'

/**
 * Quem é o avaliador. O professor é sempre ele mesmo (D4): se informar outro, recebe 403.
 * O administrador escolhe o professor.
 */
export function definirProfessor(ator: Ator, informado: string | undefined): string {
  if (ator.perfil === 'PROFESSOR') {
    if (informado !== undefined && informado !== ator.id) {
      throw new SemPermissao('O professor só registra avaliações em seu nome.', 'AVALIADOR_NAO_PERMITIDO')
    }
    return ator.id
  }
  if (ator.perfil === 'ADMINISTRADOR') {
    if (informado === undefined) {
      throw new EntradaInvalida([{ campo: 'professorId', mensagem: 'Escolha o professor avaliador' }])
    }
    return informado
  }
  throw new SemPermissao('O seu perfil não registra avaliações.')
}

/** A data da avaliação não pode ser futura (D10). O "hoje" vem do relógio injetado. */
export function garantirDataNaoFutura(relogio: Relogio, dataAvaliacao: string): void {
  const hoje = relogio.agora().toISOString().slice(0, 10)
  if (dataAvaliacao > hoje) throw new RegraDeNegocio('A data da avaliação não pode ser futura.', 'DATA_FUTURA')
}

/** O aluno e o professor precisam existir, ter o perfil certo e estar ativos (RN9, D6). */
export async function validarParticipantes(
  usuarios: UsuarioRepository,
  alunoId: string,
  professorId: string,
): Promise<void> {
  const aluno = await usuarios.buscarPorId(alunoId)
  if (aluno?.perfil !== 'ALUNO') throw new NaoEncontrado('Aluno não encontrado.', 'ALUNO_NAO_ENCONTRADO')
  const professor = await usuarios.buscarPorId(professorId)
  if (professor?.perfil !== 'PROFESSOR') {
    throw new NaoEncontrado('Professor não encontrado.', 'PROFESSOR_NAO_ENCONTRADO')
  }
  if (!aluno.ativo) {
    throw new RegraDeNegocio('Não é possível registrar avaliação para um aluno inativo.', 'ALUNO_INATIVO')
  }
  if (!professor.ativo) {
    throw new RegraDeNegocio('Não é possível registrar avaliação com um professor inativo.', 'PROFESSOR_INATIVO')
  }
}

/** Acha a avaliação que o ator pode ver. Quem não existe e quem ele não pode ver dão o mesmo 404. */
export async function localizarAvaliacao(avaliacoes: AvaliacaoRepository, ator: Ator, id: string): Promise<Avaliacao> {
  const avaliacao = await avaliacoes.buscarPorId(id)
  if (avaliacao === undefined || !podeVerAvaliacao(ator, avaliacao)) {
    throw new NaoEncontrado('Avaliação não encontrada.', 'AVALIACAO_NAO_ENCONTRADA')
  }
  return avaliacao
}

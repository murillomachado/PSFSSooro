import type { Ator } from '../../../shared/security/ator.ts'
import type { Avaliacao } from './avaliacao.ts'

/**
 * O administrador vê todas (RN3); o professor, as dos alunos de quem é o responsável (RN6), seja
 * quem for o avaliador; o aluno, só as próprias (RN7). `responsavel` é o professor responsável pelo aluno.
 */
export function podeVerAvaliacao(ator: Ator, avaliacao: Avaliacao, responsavel: string | undefined): boolean {
  if (ator.perfil === 'ADMINISTRADOR') return true
  if (ator.perfil === 'PROFESSOR') return responsavel === ator.id
  return avaliacao.alunoId === ator.id
}

/** O administrador edita todas (RN2); o professor, só as que realizou (RN5). O aluno não edita. */
export function podeEditarAvaliacao(ator: Ator, avaliacao: Avaliacao): boolean {
  if (ator.perfil === 'ADMINISTRADOR') return true
  return ator.perfil === 'PROFESSOR' && avaliacao.professorId === ator.id
}

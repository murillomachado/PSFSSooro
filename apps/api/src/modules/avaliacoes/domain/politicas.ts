import type { Ator } from '../../../shared/security/ator.ts'
import type { Avaliacao } from './avaliacao.ts'

/** O aluno vê só as próprias avaliações (RN7); administrador e professor veem todas (RN3, RN6). */
export function podeVerAvaliacao(ator: Ator, avaliacao: Avaliacao): boolean {
  return ator.perfil !== 'ALUNO' || avaliacao.alunoId === ator.id
}

/** O administrador edita todas (RN2); o professor, só as que realizou (RN5). O aluno não edita. */
export function podeEditarAvaliacao(ator: Ator, avaliacao: Avaliacao): boolean {
  if (ator.perfil === 'ADMINISTRADOR') return true
  return ator.perfil === 'PROFESSOR' && avaliacao.professorId === ator.id
}

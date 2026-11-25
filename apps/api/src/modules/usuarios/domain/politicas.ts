import { PERFIS, type Perfil } from '@psfssooro/contracts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { Usuario } from './usuario.ts'

/**
 * Quais perfis cada perfil pode ver, cadastrar e editar. Perfil novo, ou regra nova, é uma linha aqui:
 * nenhum caso de uso muda. O professor lida só com alunos (RN4); o aluno não gerencia ninguém.
 */
const PERFIS_GERENCIAVEIS = new Map<Perfil, readonly Perfil[]>([
  ['ADMINISTRADOR', PERFIS],
  ['PROFESSOR', ['ALUNO']],
  ['ALUNO', []],
])

export function perfisQueOAtorGerencia(ator: Ator): readonly Perfil[] {
  return PERFIS_GERENCIAVEIS.get(ator.perfil) ?? []
}

export function atorGerencia(ator: Ator, perfil: Perfil): boolean {
  return perfisQueOAtorGerencia(ator).includes(perfil)
}

/** Quem o ator vê e edita: o administrador, todos; o professor, só os alunos de quem é o responsável (RN6). */
export function atorEnxerga(ator: Ator, usuario: Usuario): boolean {
  if (!atorGerencia(ator, usuario.perfil)) return false
  return ator.perfil !== 'PROFESSOR' || usuario.professorId === ator.id
}

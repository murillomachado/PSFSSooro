import type { Perfil } from '@psfssooro/contracts'

export const NOME_DO_PERFIL: Record<Perfil, string> = {
  ADMINISTRADOR: 'Administrador',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
}

/** Quem o ator pode cadastrar: o administrador, qualquer perfil; o professor, só alunos (RN4). */
export const PERFIS_QUE_PODE_CADASTRAR: Record<Perfil, readonly Perfil[]> = {
  ADMINISTRADOR: ['ADMINISTRADOR', 'PROFESSOR', 'ALUNO'],
  PROFESSOR: ['ALUNO'],
  ALUNO: [],
}

/** O nome de cada perfil, na forma de opções para uma lista de escolha. */
export const OPCOES_DE_PERFIL = Object.entries(NOME_DO_PERFIL).map(([valor, texto]) => ({ valor, texto }))

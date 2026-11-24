import type { Perfil } from '@psfssooro/contracts'

/** Usuário do sistema. Datas em ISO 8601, para não depender de fuso horário. */
export interface Usuario {
  readonly id: string
  readonly nome: string
  /** Nome de usuário do login, sempre em minúsculas e único. */
  readonly usuario: string
  readonly senhaHash: string
  readonly perfil: Perfil
  readonly ativo: boolean
  readonly criadoEm: string
  readonly atualizadoEm: string
}

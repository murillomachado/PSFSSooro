import type { Perfil } from '@psfssooro/contracts'

/** Quem está fazendo a requisição: o usuário autenticado e o perfil dele. */
export interface Ator {
  readonly id: string
  readonly perfil: Perfil
}

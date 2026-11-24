import type { Perfil } from '@psfssooro/contracts'

/** Quem está logado, no que as telas de avaliações precisam saber. */
export interface Ator {
  readonly id: string
  readonly perfil: Perfil
}

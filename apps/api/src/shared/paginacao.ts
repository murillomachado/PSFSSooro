export interface PaginaDe<T> {
  readonly itens: readonly T[]
  readonly total: number
  readonly pagina: number
  readonly limite: number
}

'use client'

import { useEffect } from 'react'

interface PaginaRecebida {
  readonly itens: readonly unknown[]
  readonly total: number
  readonly pagina: number
  readonly limite: number
}

/**
 * Excluir o último item de uma página deixa a página pedida sem itens. Quando isso acontece,
 * pede a última página que existe, em vez de mostrar "Página 3 de 2".
 */
export function usePaginaValida(dados: PaginaRecebida | undefined, irParaPagina: (pagina: number) => void): void {
  useEffect(() => {
    if (dados !== undefined && dados.itens.length === 0 && dados.pagina > 1) {
      irParaPagina(Math.max(1, Math.ceil(dados.total / dados.limite)))
    }
  }, [dados, irParaPagina])
}

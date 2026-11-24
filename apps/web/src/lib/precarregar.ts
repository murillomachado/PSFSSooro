import type { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Busca no servidor e guarda no cache com a chave do hook. Uma falha não derruba a página: a tela
 * apenas refaz a busca no navegador.
 */
export function precarregar<T>(
  consultas: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
): Promise<unknown> {
  return consultas.query({ queryKey, queryFn }).catch(() => undefined)
}

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

interface PrecarregadoProps {
  /** Busca no servidor o que a tela vai pedir assim que abrir, nas mesmas chaves dos hooks. */
  readonly preparar: (consultas: QueryClient) => Promise<unknown>
  readonly children: ReactNode
}

/**
 * Renderização híbrida: o servidor busca os dados e entrega a página já preenchida; no navegador,
 * o TanStack Query começa com esses dados no cache e segue interativo (filtros, paginação, edição).
 * Se uma busca falhar aqui, a tela simplesmente a refaz no navegador.
 */
export async function Precarregado({ preparar, children }: Readonly<PrecarregadoProps>) {
  const consultas = new QueryClient()
  await preparar(consultas)
  return <HydrationBoundary state={dehydrate(consultas)}>{children}</HydrationBoundary>
}

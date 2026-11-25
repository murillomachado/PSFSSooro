import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { sistema } from '@/theme/sistema.ts'

/** Monta um componente com os mesmos provedores do app (Chakra e TanStack Query). */
export function renderizar(elemento: ReactElement) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <ChakraProvider value={sistema}>{elemento}</ChakraProvider>
    </QueryClientProvider>,
  )
}

export const USUARIO_EXEMPLO = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Ana Souza',
  usuario: 'aluno.ana',
  perfil: 'ALUNO' as const,
  ativo: true,
  professorId: '33333333-3333-4333-8333-333333333333' as string | null,
  criadoEm: '2026-11-01T10:00:00.000Z',
  atualizadoEm: '2026-11-01T10:00:00.000Z',
}

'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { Avisos } from '@/components/ui/Avisos.tsx'
import { ProvedorDeTema } from '@/components/ui/BotaoDeTema.tsx'
import { sistema } from '@/theme/sistema.ts'

export function Providers({ children }: { readonly children: ReactNode }) {
  // Os dados que o servidor entregou junto com a página valem por 30 segundos: sem isso, o navegador
  // buscaria tudo de novo logo ao abrir. Salvar ou excluir invalida as listas na hora, como antes.
  const [clienteDeConsultas] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }))
  return (
    <QueryClientProvider client={clienteDeConsultas}>
      <ChakraProvider value={sistema}>
        <ProvedorDeTema>
          {children}
          <Avisos />
        </ProvedorDeTema>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

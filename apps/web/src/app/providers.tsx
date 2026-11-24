'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { Avisos } from '@/components/ui/Avisos.tsx'
import { ProvedorDeTema } from '@/components/ui/BotaoDeTema.tsx'
import { sistema } from '@/theme/sistema.ts'

export function Providers({ children }: { readonly children: ReactNode }) {
  const [clienteDeConsultas] = useState(() => new QueryClient())
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

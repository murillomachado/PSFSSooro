'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

export function Providers({ children }: { readonly children: ReactNode }) {
  const [clienteDeConsultas] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={clienteDeConsultas}>
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    </QueryClientProvider>
  )
}

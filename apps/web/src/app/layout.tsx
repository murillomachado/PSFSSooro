import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from './providers.tsx'

export const metadata: Metadata = {
  title: 'Academia · Avaliações de IMC',
  description: 'Cadastro de usuários e avaliações de IMC da academia.',
}

export default function LayoutRaiz({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

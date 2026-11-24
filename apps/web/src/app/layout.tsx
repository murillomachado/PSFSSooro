import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import type { ReactNode } from 'react'
import { Providers } from './providers.tsx'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SooroFit · Avaliações de IMC',
  description: 'Acompanhamento da evolução do IMC dos alunos da academia.',
}

export default function LayoutRaiz({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

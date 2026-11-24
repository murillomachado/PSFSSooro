'use client'

import { ClientOnly, IconButton, Skeleton } from '@chakra-ui/react'
import { ThemeProvider, useTheme } from 'next-themes'
import type { ReactNode } from 'react'
import { LuMoon, LuSun } from 'react-icons/lu'

/** Guarda a escolha de tema (claro ou escuro) e, sem escolha, segue o sistema operacional. */
export function ProvedorDeTema({ children }: { readonly children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}

export function BotaoDeTema() {
  const { resolvedTheme, setTheme } = useTheme()
  const escuro = resolvedTheme === 'dark'
  // O tema só é conhecido no navegador: no servidor, um espaço reservado evita divergência na hidratação.
  return (
    <ClientOnly fallback={<Skeleton boxSize="9" borderRadius="md" />}>
      <IconButton
        variant="ghost"
        aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
        title={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
        onClick={() => {
          setTheme(escuro ? 'light' : 'dark')
        }}
      >
        {escuro ? <LuSun /> : <LuMoon />}
      </IconButton>
    </ClientOnly>
  )
}

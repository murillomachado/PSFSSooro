'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell.tsx'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { useSairAoPerderASessao, useSessao } from '@/features/auth/hooks/useSessao.ts'

/** Tudo que fica dentro deste grupo exige sessão: sem ela, vai para o login. */
export default function LayoutAutenticado({ children }: { readonly children: ReactNode }) {
  const { carregando, usuario, sair } = useSessao()
  const roteador = useRouter()
  useSairAoPerderASessao(sair)

  useEffect(() => {
    if (!carregando && usuario === undefined) roteador.replace('/login')
  }, [carregando, usuario, roteador])

  if (usuario === undefined) return <Carregando />

  return (
    <AppShell usuario={usuario} aoSair={sair}>
      {children}
    </AppShell>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { AppShell } from './AppShell.tsx'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { useSairAoPerderASessao, useSessao } from '@/features/auth/hooks/useSessao.ts'

/**
 * A casca da área logada. O servidor já confere a sessão antes (proxy.ts) e entrega o usuário no
 * cache; aqui ela é acompanhada no navegador: se a API recusar a sessão depois, a tela volta ao login.
 */
export function AreaAutenticada({ children }: { readonly children: ReactNode }) {
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

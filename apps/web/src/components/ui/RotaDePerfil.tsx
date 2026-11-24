'use client'

import type { Perfil } from '@psfssooro/contracts'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { Carregando } from './Carregando.tsx'

/** Mostra a tela só para os perfis permitidos; os demais voltam ao início. A API também recusa (403). */
export function RotaDePerfil({ perfis, children }: Readonly<{ perfis: readonly Perfil[]; children: ReactNode }>) {
  const { usuario } = useSessao()
  const roteador = useRouter()
  const permitido = usuario !== undefined && perfis.includes(usuario.perfil)

  useEffect(() => {
    if (usuario !== undefined && !permitido) roteador.replace('/inicio')
  }, [usuario, permitido, roteador])

  return permitido ? <>{children}</> : <Carregando />
}

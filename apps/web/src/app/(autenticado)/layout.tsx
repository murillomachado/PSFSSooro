import type { ReactNode } from 'react'
import { AreaAutenticada } from '@/components/layout/AreaAutenticada.tsx'
import { Precarregado } from '@/components/ui/Precarregado.tsx'
import { CHAVE_DA_SESSAO } from '@/features/auth/chaves.ts'
import { sessaoNoServidor } from '@/features/auth/servidor.ts'

/** No servidor: quem está logado já vem no cache, e a casca (menu, nome, perfil) sai pronta no HTML. */
export default async function LayoutAutenticado({ children }: { readonly children: ReactNode }) {
  const usuario = await sessaoNoServidor()
  return (
    <Precarregado
      preparar={async (consultas) => {
        if (usuario !== undefined) consultas.setQueryData(CHAVE_DA_SESSAO, usuario)
        return Promise.resolve()
      }}
    >
      <AreaAutenticada>{children}</AreaAutenticada>
    </Precarregado>
  )
}

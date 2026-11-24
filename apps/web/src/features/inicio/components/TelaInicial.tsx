'use client'

import { CabecalhoDePagina } from '@/components/ui/CabecalhoDePagina.tsx'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { PainelInicial } from './PainelInicial.tsx'
import { NOME_DO_PERFIL } from '@/features/usuarios/perfis.ts'

export function TelaInicial() {
  const { usuario } = useSessao()
  if (usuario === undefined) return <Carregando />
  return (
    <>
      <CabecalhoDePagina
        titulo={`Olá, ${usuario.nome}`}
        descricao={`Você entrou como ${NOME_DO_PERFIL[usuario.perfil].toLowerCase()}.`}
      />
      <PainelInicial usuario={usuario} />
    </>
  )
}

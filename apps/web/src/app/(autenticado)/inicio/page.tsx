'use client'

import { Heading, Text } from '@chakra-ui/react'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'

export default function PaginaInicial() {
  const { usuario } = useSessao()
  return (
    <>
      <Heading size="lg">Olá, {usuario?.nome}</Heading>
      <Text color="fg.muted">Você entrou como {usuario?.perfil.toLowerCase()}.</Text>
    </>
  )
}

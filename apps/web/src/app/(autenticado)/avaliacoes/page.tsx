'use client'

import { Button, Flex, Heading } from '@chakra-ui/react'
import Link from 'next/link'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { ListaDeAvaliacoes } from '@/features/avaliacoes/components/ListaDeAvaliacoes.tsx'

export default function PaginaDeAvaliacoes() {
  const { usuario } = useSessao()
  if (usuario === undefined) return <Carregando />
  return (
    <>
      <Flex justify="space-between" align="center" mb="4">
        <Heading size="lg">{usuario.perfil === 'ALUNO' ? 'Minhas avaliações' : 'Avaliações'}</Heading>
        {usuario.perfil !== 'ALUNO' && (
          <Button asChild>
            <Link href="/avaliacoes/nova">Nova avaliação</Link>
          </Button>
        )}
      </Flex>
      <ListaDeAvaliacoes ator={{ id: usuario.id, perfil: usuario.perfil }} />
    </>
  )
}

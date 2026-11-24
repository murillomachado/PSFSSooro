'use client'

import { Button } from '@chakra-ui/react'
import Link from 'next/link'
import { LuPlus } from 'react-icons/lu'
import { CabecalhoDePagina } from '@/components/ui/CabecalhoDePagina.tsx'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { ListaDeAvaliacoes } from '@/features/avaliacoes/components/ListaDeAvaliacoes.tsx'

export default function PaginaDeAvaliacoes() {
  const { usuario } = useSessao()
  if (usuario === undefined) return <Carregando />
  const ehAluno = usuario.perfil === 'ALUNO'
  return (
    <>
      <CabecalhoDePagina
        titulo={ehAluno ? 'Minhas avaliações' : 'Avaliações'}
        descricao={ehAluno ? 'O histórico das suas avaliações de IMC.' : 'As avaliações de IMC dos alunos.'}
        acao={
          !ehAluno && (
            <Button asChild>
              <Link href="/avaliacoes/nova">
                <LuPlus />
                Nova avaliação
              </Link>
            </Button>
          )
        }
      />
      <ListaDeAvaliacoes ator={{ id: usuario.id, perfil: usuario.perfil }} />
    </>
  )
}

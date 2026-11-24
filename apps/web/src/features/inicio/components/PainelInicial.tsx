'use client'

import type { UsuarioResposta } from '@psfssooro/contracts'
import { Button, Card, Flex, Heading, SimpleGrid } from '@chakra-ui/react'
import Link from 'next/link'
import { LuActivity, LuClipboardList, LuPlus, LuUserCheck, LuUsers } from 'react-icons/lu'
import { GraficoDeEvolucao } from '@/features/avaliacoes/evolucao/GraficoDeEvolucao.tsx'
import { useListaDeAvaliacoes } from '@/features/avaliacoes/hooks/useAvaliacoes.ts'
import { useListaDeUsuarios } from '@/features/usuarios/hooks/useUsuarios.ts'
import { Indicador } from './Indicador.tsx'

const GRADE = { base: 1, sm: 2, lg: 3 } as const

/** Administrador e professor: quantos alunos e avaliações existem (o total que a paginação da API já traz). */
function IndicadoresDaEquipe({ usuario }: Readonly<{ usuario: UsuarioResposta }>) {
  const ehAdmin = usuario.perfil === 'ADMINISTRADOR'
  const usuarios = useListaDeUsuarios({ pagina: 1, limite: 1 })
  const alunosAtivos = useListaDeUsuarios({ pagina: 1, limite: 1, perfil: 'ALUNO', ativo: true })
  const avaliacoes = useListaDeAvaliacoes({ pagina: 1 })
  const minhas = useListaDeAvaliacoes({ pagina: 1, professorId: usuario.id })
  return (
    <SimpleGrid columns={GRADE} gap="4">
      <Indicador rotulo="Alunos ativos" valor={alunosAtivos.data?.total} icone={LuUserCheck} />
      <Indicador rotulo="Avaliações registradas" valor={avaliacoes.data?.total} icone={LuClipboardList} />
      {ehAdmin ? (
        <Indicador rotulo="Usuários cadastrados" valor={usuarios.data?.total} icone={LuUsers} />
      ) : (
        <Indicador rotulo="Avaliações feitas por você" valor={minhas.data?.total} icone={LuActivity} />
      )}
    </SimpleGrid>
  )
}

function Atalhos({ usuario }: Readonly<{ usuario: UsuarioResposta }>) {
  const ehAluno = usuario.perfil === 'ALUNO'
  return (
    <Card.Root mt="6">
      <Card.Body gap="4">
        <Heading as="h2" size="md">
          Atalhos
        </Heading>
        <Flex gap="3" wrap="wrap">
          {!ehAluno && (
            <Button asChild>
              <Link href="/avaliacoes/nova">
                <LuPlus />
                Registrar avaliação
              </Link>
            </Button>
          )}
          {!ehAluno && (
            <Button asChild variant="outline">
              <Link href="/usuarios/novo">
                <LuPlus />
                {usuario.perfil === 'ADMINISTRADOR' ? 'Cadastrar usuário' : 'Cadastrar aluno'}
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/avaliacoes">{ehAluno ? 'Ver meu histórico' : 'Ver todas as avaliações'}</Link>
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  )
}

export function PainelInicial({ usuario }: Readonly<{ usuario: UsuarioResposta }>) {
  return (
    <>
      {usuario.perfil === 'ALUNO' ? (
        <GraficoDeEvolucao alunoId={usuario.id} />
      ) : (
        <IndicadoresDaEquipe usuario={usuario} />
      )}
      <Atalhos usuario={usuario} />
    </>
  )
}

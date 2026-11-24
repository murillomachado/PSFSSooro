'use client'

import { Box, Button, Flex, Heading, Link as LinkDoChakra, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { NOME_DO_PERFIL } from '@/features/usuarios/perfis.ts'
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
    <Box>
      <Flex as="header" align="center" justify="space-between" px="6" py="3" borderBottomWidth="1px">
        <Flex align="center" gap="6">
          <Heading size="md">Academia</Heading>
          <LinkDoChakra asChild>
            <Link href="/inicio">Início</Link>
          </LinkDoChakra>
          <LinkDoChakra asChild>
            <Link href="/avaliacoes">{usuario.perfil === 'ALUNO' ? 'Minhas avaliações' : 'Avaliações'}</Link>
          </LinkDoChakra>
          {usuario.perfil !== 'ALUNO' && (
            <LinkDoChakra asChild>
              <Link href="/usuarios">{usuario.perfil === 'ADMINISTRADOR' ? 'Usuários' : 'Alunos'}</Link>
            </LinkDoChakra>
          )}
        </Flex>
        <Flex align="center" gap="4">
          <Text>
            {usuario.nome} · {NOME_DO_PERFIL[usuario.perfil]}
          </Text>
          <Button variant="outline" size="sm" onClick={sair}>
            Sair
          </Button>
        </Flex>
      </Flex>
      <Box as="main" p="6">
        {children}
      </Box>
    </Box>
  )
}

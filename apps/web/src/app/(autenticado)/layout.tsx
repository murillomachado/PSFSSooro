'use client'

import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'

const NOME_DO_PERFIL = { ADMINISTRADOR: 'Administrador', PROFESSOR: 'Professor', ALUNO: 'Aluno' } as const

/** Tudo que fica dentro deste grupo exige sessão: sem ela, vai para o login. */
export default function LayoutAutenticado({ children }: { readonly children: ReactNode }) {
  const { carregando, usuario, sair } = useSessao()
  const roteador = useRouter()

  useEffect(() => {
    if (!carregando && usuario === undefined) roteador.replace('/login')
  }, [carregando, usuario, roteador])

  if (usuario === undefined) return <Carregando />

  return (
    <Box>
      <Flex as="header" align="center" justify="space-between" px="6" py="3" borderBottomWidth="1px">
        <Heading size="md">Academia</Heading>
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

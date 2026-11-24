'use client'

import { Button, Flex, Heading } from '@chakra-ui/react'
import Link from 'next/link'
import { RotaDePerfil } from '@/components/ui/RotaDePerfil.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { ListaDeUsuarios } from '@/features/usuarios/components/ListaDeUsuarios.tsx'

export default function PaginaDeUsuarios() {
  const { usuario } = useSessao()
  return (
    <RotaDePerfil perfis={['ADMINISTRADOR', 'PROFESSOR']}>
      <Flex justify="space-between" align="center" mb="4">
        <Heading size="lg">{usuario?.perfil === 'ADMINISTRADOR' ? 'Usuários' : 'Alunos'}</Heading>
        <Button asChild>
          <Link href="/usuarios/novo">Novo cadastro</Link>
        </Button>
      </Flex>
      {usuario !== undefined && <ListaDeUsuarios perfilDoAtor={usuario.perfil} />}
    </RotaDePerfil>
  )
}

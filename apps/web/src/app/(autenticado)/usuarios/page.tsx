'use client'

import { Button } from '@chakra-ui/react'
import Link from 'next/link'
import { LuPlus } from 'react-icons/lu'
import { CabecalhoDePagina } from '@/components/ui/CabecalhoDePagina.tsx'
import { RotaDePerfil } from '@/components/ui/RotaDePerfil.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { ListaDeUsuarios } from '@/features/usuarios/components/ListaDeUsuarios.tsx'

export default function PaginaDeUsuarios() {
  const { usuario } = useSessao()
  const ehAdmin = usuario?.perfil === 'ADMINISTRADOR'
  return (
    <RotaDePerfil perfis={['ADMINISTRADOR', 'PROFESSOR']}>
      <CabecalhoDePagina
        titulo={ehAdmin ? 'Usuários' : 'Alunos'}
        descricao={ehAdmin ? 'Administradores, professores e alunos da academia.' : 'Os alunos da academia.'}
        acao={
          <Button asChild>
            <Link href="/usuarios/novo">
              <LuPlus />
              Novo cadastro
            </Link>
          </Button>
        }
      />
      {usuario !== undefined && <ListaDeUsuarios perfilDoAtor={usuario.perfil} />}
    </RotaDePerfil>
  )
}

'use client'

import type { Perfil, UsuarioResposta } from '@psfssooro/contracts'
import { Badge, Button, Flex, Table, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { NOME_DO_PERFIL } from '../perfis.ts'

interface TabelaDeUsuariosProps {
  readonly usuarios: readonly UsuarioResposta[]
  readonly perfilDoAtor: Perfil
  readonly aoAlterarSituacao: (usuario: UsuarioResposta) => void
  readonly aoExcluir: (usuario: UsuarioResposta) => void
}

/** Só o administrador ativa, inativa e exclui (RF2, RN1); administrador e professor editam. */
export function TabelaDeUsuarios({
  usuarios,
  perfilDoAtor,
  aoAlterarSituacao,
  aoExcluir,
}: Readonly<TabelaDeUsuariosProps>) {
  if (usuarios.length === 0) return <Text color="fg.muted">Nenhum usuário encontrado.</Text>
  const ehAdmin = perfilDoAtor === 'ADMINISTRADOR'
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Nome</Table.ColumnHeader>
          <Table.ColumnHeader>Usuário</Table.ColumnHeader>
          <Table.ColumnHeader>Perfil</Table.ColumnHeader>
          <Table.ColumnHeader>Situação</Table.ColumnHeader>
          <Table.ColumnHeader>Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {usuarios.map((usuario) => (
          <Table.Row key={usuario.id}>
            <Table.Cell>{usuario.nome}</Table.Cell>
            <Table.Cell>{usuario.usuario}</Table.Cell>
            <Table.Cell>{NOME_DO_PERFIL[usuario.perfil]}</Table.Cell>
            <Table.Cell>
              <Badge colorPalette={usuario.ativo ? 'green' : 'gray'}>{usuario.ativo ? 'Ativo' : 'Inativo'}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Flex gap="2">
                <Button asChild size="xs" variant="outline">
                  <Link href={`/usuarios/${usuario.id}/editar`}>Editar</Link>
                </Button>
                {ehAdmin && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      aoAlterarSituacao(usuario)
                    }}
                  >
                    {usuario.ativo ? 'Inativar' : 'Ativar'}
                  </Button>
                )}
                {ehAdmin && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => {
                      aoExcluir(usuario)
                    }}
                  >
                    Excluir
                  </Button>
                )}
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

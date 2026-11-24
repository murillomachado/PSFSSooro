'use client'

import type { UsuarioResposta } from '@psfssooro/contracts'
import { Avatar, Badge, Box, Button, Menu, Portal, Text } from '@chakra-ui/react'
import { LuChevronDown, LuLogOut } from 'react-icons/lu'
import { NOME_DO_PERFIL } from '@/features/usuarios/perfis.ts'

interface MenuDoUsuarioProps {
  readonly usuario: UsuarioResposta
  readonly aoSair: () => void
}

/** Quem está logado (nome, usuário e perfil) e a saída do sistema. */
export function MenuDoUsuario({ usuario, aoSair }: Readonly<MenuDoUsuarioProps>) {
  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <Button variant="ghost" px="1.5" gap="2" aria-label="Menu do usuário">
          <Avatar.Root size="xs" colorPalette="brand" variant="solid">
            <Avatar.Fallback name={usuario.nome} />
          </Avatar.Root>
          <Text as="span" fontWeight="500" hideBelow="sm">
            {usuario.nome.split(' ')[0]}
          </Text>
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="56">
            <Box px="2" py="2">
              <Text fontWeight="600">{usuario.nome}</Text>
              <Text fontSize="sm" color="fg.muted">
                @{usuario.usuario}
              </Text>
              <Badge mt="2" variant="subtle">
                {NOME_DO_PERFIL[usuario.perfil]}
              </Badge>
            </Box>
            <Menu.Separator />
            <Menu.Item value="sair" onSelect={aoSair}>
              <LuLogOut />
              Sair
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

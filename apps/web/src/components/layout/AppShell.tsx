'use client'

import type { UsuarioResposta } from '@psfssooro/contracts'
import { Box, CloseButton, Drawer, Flex, IconButton, Portal } from '@chakra-ui/react'
import { type ReactNode, useState } from 'react'
import { LuMenu } from 'react-icons/lu'
import { BotaoDeTema } from '@/components/ui/BotaoDeTema.tsx'
import { Logo } from './Logo.tsx'
import { MenuDoUsuario } from './MenuDoUsuario.tsx'
import { MenuLateral } from './MenuLateral.tsx'

interface AppShellProps {
  readonly usuario: UsuarioResposta
  readonly aoSair: () => void
  readonly children: ReactNode
}

const LARGURA_DO_MENU = '64'

/** Menu lateral fixo no computador; no celular, ele vira uma gaveta aberta pelo botão da barra superior. */
export function AppShell({ usuario, aoSair, children }: Readonly<AppShellProps>) {
  const [gavetaAberta, definirGavetaAberta] = useState(false)
  const fecharGaveta = () => {
    definirGavetaAberta(false)
  }

  return (
    <Box minH="100dvh">
      <Box
        as="aside"
        hideBelow="md"
        position="fixed"
        insetY="0"
        left="0"
        w={LARGURA_DO_MENU}
        bg="bg.panel"
        borderRightWidth="1px"
      >
        <MenuLateral usuario={usuario} />
      </Box>

      <Drawer.Root
        open={gavetaAberta}
        placement="start"
        onOpenChange={(estado) => {
          definirGavetaAberta(estado.open)
        }}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxW="72">
              <Drawer.CloseTrigger asChild position="absolute" top="3" right="3">
                <CloseButton size="sm" aria-label="Fechar menu" />
              </Drawer.CloseTrigger>
              <MenuLateral usuario={usuario} aoNavegar={fecharGaveta} />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Box ms={{ md: LARGURA_DO_MENU }}>
        <Flex
          as="header"
          position="sticky"
          top="0"
          zIndex="sticky"
          align="center"
          justify="space-between"
          gap="3"
          h="14"
          px={{ base: '4', md: '8' }}
          bg="bg.panel/90"
          backdropFilter="blur(8px)"
          borderBottomWidth="1px"
        >
          <Flex align="center" gap="2" hideFrom="md">
            <IconButton
              variant="ghost"
              aria-label="Abrir menu"
              onClick={() => {
                definirGavetaAberta(true)
              }}
            >
              <LuMenu />
            </IconButton>
            <Logo />
          </Flex>
          <Box hideBelow="md" />
          <Flex align="center" gap="1">
            <BotaoDeTema />
            <MenuDoUsuario usuario={usuario} aoSair={aoSair} />
          </Flex>
        </Flex>
        <Box as="main" px={{ base: '4', md: '8' }} py={{ base: '5', md: '8' }} maxW="7xl" mx="auto">
          {children}
        </Box>
      </Box>
    </Box>
  )
}

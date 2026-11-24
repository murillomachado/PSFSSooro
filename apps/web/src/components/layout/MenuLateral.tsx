'use client'

import type { UsuarioResposta } from '@psfssooro/contracts'
import { Avatar, Box, Flex, Icon, Link as LinkDoChakra, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NOME_DO_PERFIL } from '@/features/usuarios/perfis.ts'
import { itemAtivo, itensDoMenu } from './itensDoMenu.ts'
import { Logo } from './Logo.tsx'

interface MenuLateralProps {
  readonly usuario: UsuarioResposta
  /** Na gaveta do celular, fecha o menu depois de escolher uma página. */
  readonly aoNavegar?: () => void
}

/** A navegação do perfil, com o item da página atual destacado e, no rodapé, quem está logado. */
export function MenuLateral({ usuario, aoNavegar }: Readonly<MenuLateralProps>) {
  const caminho = usePathname()
  return (
    <Flex direction="column" h="full" gap="6" px="4" py="5">
      <Box px="2">
        <Logo />
      </Box>
      <Stack as="nav" aria-label="Menu principal" gap="1" flex="1">
        {itensDoMenu(usuario.perfil).map((item) => {
          const ativo = itemAtivo(item.href, caminho)
          return (
            <LinkDoChakra
              key={item.href}
              asChild
              display="flex"
              alignItems="center"
              gap="3"
              px="3"
              py="2"
              borderRadius="md"
              fontWeight={ativo ? '600' : '500'}
              color={ativo ? 'brand.fg' : 'fg.muted'}
              bg={ativo ? 'brand.subtle' : undefined}
              boxShadow={ativo ? 'inset 3px 0 0 var(--chakra-colors-acento)' : undefined}
              _hover={{ bg: 'brand.subtle', color: 'brand.fg', textDecoration: 'none' }}
              onClick={aoNavegar}
            >
              <Link href={item.href} aria-current={ativo ? 'page' : undefined}>
                <Icon as={item.icone} boxSize="4" />
                {item.rotulo}
              </Link>
            </LinkDoChakra>
          )
        })}
      </Stack>
      <Flex align="center" gap="3" borderTopWidth="1px" pt="4" px="2">
        <Avatar.Root size="sm" colorPalette="brand" variant="solid">
          <Avatar.Fallback name={usuario.nome} />
        </Avatar.Root>
        <Box minW="0">
          <Text fontWeight="600" fontSize="sm" truncate>
            {usuario.nome}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {NOME_DO_PERFIL[usuario.perfil]}
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}

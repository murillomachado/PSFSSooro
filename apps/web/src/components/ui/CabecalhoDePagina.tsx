import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface CabecalhoDePaginaProps {
  readonly titulo: string
  readonly descricao?: ReactNode
  /** A ação principal da tela, como "Nova avaliação". */
  readonly acao?: ReactNode
}

/** Título com a barra laranja da marca, uma linha de contexto e a ação principal, igual em todas as telas. */
export function CabecalhoDePagina({ titulo, descricao, acao }: Readonly<CabecalhoDePaginaProps>) {
  return (
    <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap="4" mb="6" wrap="wrap">
      <Box borderLeftWidth="4px" borderColor="acento" ps="3" minW="0">
        <Heading as="h1" size={{ base: 'xl', md: '2xl' }} letterSpacing="-0.02em">
          {titulo}
        </Heading>
        {descricao !== undefined && (
          <Text color="fg.muted" mt="0.5">
            {descricao}
          </Text>
        )}
      </Box>
      {acao}
    </Flex>
  )
}

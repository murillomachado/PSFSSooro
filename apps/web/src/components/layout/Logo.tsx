import { Box, Flex, Text } from '@chakra-ui/react'

/** A marca: um quadrado índigo com o canto laranja e o nome. `claro` é para fundos escuros. */
export function Logo({ claro = false }: { readonly claro?: boolean }) {
  return (
    <Flex align="center" gap="2.5">
      <Box
        aria-hidden
        boxSize="8"
        borderRadius="lg"
        bg={claro ? 'white' : 'brand.solid'}
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" right="1.5" bottom="1.5" boxSize="2.5" borderRadius="sm" bg="acento" />
      </Box>
      <Text fontWeight="700" fontSize="lg" letterSpacing="-0.02em" color={claro ? 'white' : 'fg'}>
        Sooro
        <Text as="span" color={claro ? 'laranja.400' : 'acento'}>
          Fit
        </Text>
      </Text>
    </Flex>
  )
}

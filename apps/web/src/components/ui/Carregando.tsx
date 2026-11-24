import { Center, Spinner } from '@chakra-ui/react'

/** Estado de carregamento de página inteira. */
export function Carregando() {
  return (
    <Center minH="60vh" role="status" aria-label="Carregando">
      <Spinner size="lg" color="brand.solid" borderWidth="3px" />
    </Center>
  )
}

import { Button, Card, Flex, SimpleGrid } from '@chakra-ui/react'
import { type ReactNode, type SubmitEvent, useState } from 'react'
import { LuChevronDown, LuFilter, LuX } from 'react-icons/lu'
import { useTelaPequena } from '@/lib/useTelaPequena.ts'

interface BarraDeFiltrosProps {
  readonly aoFiltrar: () => void
  readonly aoLimpar: () => void
  readonly children: ReactNode
}

/**
 * Os campos de filtro de uma lista num painel, com até quatro colunas no computador. No celular, ficam
 * recolhidos atrás do botão "Filtros", para a lista aparecer logo na primeira tela.
 */
export function BarraDeFiltros({ aoFiltrar, aoLimpar, children }: Readonly<BarraDeFiltrosProps>) {
  const telaPequena = useTelaPequena()
  const [aberto, definirAberto] = useState(false)
  const enviar = (evento: SubmitEvent<HTMLFormElement>) => {
    evento.preventDefault()
    aoFiltrar()
  }
  if (telaPequena && !aberto) {
    return (
      <Button
        variant="outline"
        mb="4"
        aria-expanded={false}
        onClick={() => {
          definirAberto(true)
        }}
      >
        <LuFilter />
        Filtros
        <LuChevronDown />
      </Button>
    )
  }
  return (
    <form onSubmit={enviar}>
      <Card.Root mb="5" size="sm">
        <Card.Body>
          <Flex gap="3" align={{ base: 'stretch', lg: 'flex-end' }} direction={{ base: 'column', lg: 'row' }}>
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="3" flex="1">
              {children}
            </SimpleGrid>
            <Flex gap="2" justify="flex-end">
              <Button type="button" variant="ghost" onClick={aoLimpar}>
                <LuX />
                Limpar
              </Button>
              <Button type="submit">
                <LuFilter />
                Filtrar
              </Button>
            </Flex>
          </Flex>
        </Card.Body>
      </Card.Root>
    </form>
  )
}

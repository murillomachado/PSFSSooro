import { Card, Flex, Icon, Stat } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'

interface IndicadorProps {
  readonly rotulo: string
  /** `undefined` enquanto carrega. */
  readonly valor: ReactNode
  readonly detalhe?: ReactNode
  readonly icone: IconType
}

/** Um número de destaque da tela inicial, como o total de alunos ou o último IMC. */
export function Indicador({ rotulo, valor, detalhe, icone }: Readonly<IndicadorProps>) {
  return (
    <Card.Root size="sm">
      <Card.Body>
        <Stat.Root>
          <Flex justify="space-between" align="flex-start">
            <Stat.Label>{rotulo}</Stat.Label>
            <Flex boxSize="8" align="center" justify="center" borderRadius="md" bg="brand.subtle" color="brand.fg">
              <Icon as={icone} boxSize="4" />
            </Flex>
          </Flex>
          <Stat.ValueText fontSize="2xl" fontWeight="700">
            {valor ?? '—'}
          </Stat.ValueText>
          {detalhe !== undefined && <Stat.HelpText>{detalhe}</Stat.HelpText>}
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  )
}

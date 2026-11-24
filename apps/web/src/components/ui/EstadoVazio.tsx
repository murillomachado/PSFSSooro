import { EmptyState } from '@chakra-ui/react'
import { LuSearchX } from 'react-icons/lu'

/** Lista sem resultado: o que aconteceu e o que fazer. */
export function EstadoVazio({ titulo, dica }: { readonly titulo: string; readonly dica?: string }) {
  return (
    <EmptyState.Root borderWidth="1px" borderStyle="dashed" borderRadius="xl" bg="bg.panel">
      <EmptyState.Content>
        <EmptyState.Indicator>
          <LuSearchX />
        </EmptyState.Indicator>
        <EmptyState.Title>{titulo}</EmptyState.Title>
        {dica !== undefined && <EmptyState.Description>{dica}</EmptyState.Description>}
      </EmptyState.Content>
    </EmptyState.Root>
  )
}

import { Button, Flex, Text } from '@chakra-ui/react'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'

interface PaginacaoProps {
  readonly pagina: number
  readonly limite: number
  readonly total: number
  readonly aoMudar: (pagina: number) => void
}

/** "Anterior / Próxima" com a posição atual, para qualquer lista paginada pela API. */
export function Paginacao({ pagina, limite, total, aoMudar }: Readonly<PaginacaoProps>) {
  const totalDePaginas = Math.max(1, Math.ceil(total / limite))
  return (
    <Flex align="center" justify="space-between" gap="3" mt="4" wrap="wrap">
      <Text color="fg.muted" fontSize="sm">
        Página {pagina} de {totalDePaginas} · {total} no total
      </Text>
      <Flex gap="2">
        <Button
          size="sm"
          variant="outline"
          disabled={pagina <= 1}
          onClick={() => {
            aoMudar(pagina - 1)
          }}
        >
          <LuChevronLeft />
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pagina >= totalDePaginas}
          onClick={() => {
            aoMudar(pagina + 1)
          }}
        >
          Próxima
          <LuChevronRight />
        </Button>
      </Flex>
    </Flex>
  )
}

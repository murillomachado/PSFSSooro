import { Button, Flex, Text } from '@chakra-ui/react'

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
    <Flex align="center" justify="space-between" mt="4">
      <Text color="fg.muted">
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
        </Button>
      </Flex>
    </Flex>
  )
}

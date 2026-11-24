'use client'

import { Box, Card, Flex, Stack, Table, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useTelaPequena } from '@/lib/useTelaPequena.ts'
import { EstadoVazio } from './EstadoVazio.tsx'

export interface Coluna<T> {
  readonly titulo: string
  readonly valor: (item: T) => ReactNode
  /** Números ficam à direita, com algarismos de mesma largura. */
  readonly numerica?: boolean
}

interface TabelaResponsivaProps<T> {
  readonly itens: readonly T[]
  /** A primeira coluna é o título do cartão no celular. */
  readonly colunas: readonly Coluna<T>[]
  readonly chave: (item: T) => string
  readonly acoes?: (item: T) => ReactNode
  readonly vazio: string
}

const NUMERICA = { textAlign: 'end', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const

/**
 * Cada coluna é descrita uma vez e aparece como tabela no computador ou como cartão no celular,
 * onde rolar uma tabela larga para o lado é ruim.
 */
export function TabelaResponsiva<T>(props: Readonly<TabelaResponsivaProps<T>>) {
  const telaPequena = useTelaPequena()
  if (props.itens.length === 0) return <EstadoVazio titulo={props.vazio} dica="Mude os filtros ou cadastre um novo." />
  return telaPequena ? <Cartoes {...props} /> : <Tabela {...props} />
}

function Tabela<T>({ itens, colunas, chave, acoes }: Readonly<TabelaResponsivaProps<T>>) {
  return (
    <Card.Root overflow="hidden">
      <Table.ScrollArea>
        <Table.Root size="md" interactive>
          <Table.Header>
            <Table.Row bg="bg.muted">
              {colunas.map((coluna) => (
                <Table.ColumnHeader key={coluna.titulo} {...(coluna.numerica === true ? NUMERICA : {})}>
                  {coluna.titulo}
                </Table.ColumnHeader>
              ))}
              {acoes !== undefined && <Table.ColumnHeader textAlign="end">Ações</Table.ColumnHeader>}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {itens.map((item) => (
              <Table.Row key={chave(item)}>
                {colunas.map((coluna) => (
                  <Table.Cell key={coluna.titulo} {...(coluna.numerica === true ? NUMERICA : {})}>
                    {coluna.valor(item)}
                  </Table.Cell>
                ))}
                {acoes !== undefined && (
                  <Table.Cell>
                    <Flex gap="1" justify="flex-end">
                      {acoes(item)}
                    </Flex>
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Card.Root>
  )
}

function Cartoes<T>({ itens, colunas, chave, acoes }: Readonly<TabelaResponsivaProps<T>>) {
  const [principal, ...demais] = colunas
  return (
    <Stack gap="3">
      {itens.map((item) => (
        <Card.Root key={chave(item)} size="sm">
          <Card.Body gap="2">
            {principal !== undefined && (
              <Text fontWeight="600" fontSize="md">
                {principal.valor(item)}
              </Text>
            )}
            {demais.map((coluna) => (
              <Flex key={coluna.titulo} justify="space-between" gap="4" fontSize="sm">
                <Text color="fg.muted">{coluna.titulo}</Text>
                <Box textAlign="end" fontVariantNumeric="tabular-nums">
                  {coluna.valor(item)}
                </Box>
              </Flex>
            ))}
          </Card.Body>
          {acoes !== undefined && (
            <Card.Footer justifyContent="flex-end" gap="1" pt="0">
              {acoes(item)}
            </Card.Footer>
          )}
        </Card.Root>
      ))}
    </Stack>
  )
}

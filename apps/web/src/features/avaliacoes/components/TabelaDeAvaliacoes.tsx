'use client'

import type { AvaliacaoResposta } from '@psfssooro/contracts'
import { Badge, Button, Flex, Table, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { corDaFaixa, formatarAltura, formatarData, formatarImc, formatarPeso } from '../apresentacao.ts'
import type { Ator } from '../ator.ts'

interface TabelaDeAvaliacoesProps {
  readonly avaliacoes: readonly AvaliacaoResposta[]
  readonly ator: Ator
  readonly aoExcluir: (avaliacao: AvaliacaoResposta) => void
}

/** O administrador edita todas e exclui (RN2); o professor edita só as que realizou (RN5); o aluno só consulta. */
const podeEditar = (ator: Ator, a: AvaliacaoResposta): boolean =>
  ator.perfil === 'ADMINISTRADOR' || (ator.perfil === 'PROFESSOR' && a.professor.id === ator.id)

export function TabelaDeAvaliacoes({ avaliacoes, ator, aoExcluir }: Readonly<TabelaDeAvaliacoesProps>) {
  if (avaliacoes.length === 0) return <Text color="fg.muted">Nenhuma avaliação encontrada.</Text>
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Data</Table.ColumnHeader>
          <Table.ColumnHeader>Aluno</Table.ColumnHeader>
          <Table.ColumnHeader>Professor</Table.ColumnHeader>
          <Table.ColumnHeader>Altura</Table.ColumnHeader>
          <Table.ColumnHeader>Peso</Table.ColumnHeader>
          <Table.ColumnHeader>IMC</Table.ColumnHeader>
          <Table.ColumnHeader>Classificação</Table.ColumnHeader>
          <Table.ColumnHeader>Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {avaliacoes.map((a) => (
          <Table.Row key={a.id}>
            <Table.Cell>{formatarData(a.dataAvaliacao)}</Table.Cell>
            <Table.Cell>{a.aluno.nome}</Table.Cell>
            <Table.Cell>{a.professor.nome}</Table.Cell>
            <Table.Cell>{formatarAltura(a.alturaM)}</Table.Cell>
            <Table.Cell>{formatarPeso(a.pesoKg)}</Table.Cell>
            <Table.Cell>{formatarImc(a.imc)}</Table.Cell>
            <Table.Cell>
              <Badge colorPalette={corDaFaixa(a.classificacao.codigo)}>{a.classificacao.descricao}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Flex gap="2">
                {podeEditar(ator, a) && (
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/avaliacoes/${a.id}/editar`}>Editar</Link>
                  </Button>
                )}
                {ator.perfil === 'ADMINISTRADOR' && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => {
                      aoExcluir(a)
                    }}
                  >
                    Excluir
                  </Button>
                )}
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

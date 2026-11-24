'use client'

import { Badge, Box, Card, Heading, SimpleGrid, Skeleton, Stat, Text } from '@chakra-ui/react'
import { EstadoVazio } from '@/components/ui/EstadoVazio.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { mensagemDeErro } from '@/lib/http-client.ts'
import { corDaFaixa, formatarImc, formatarPeso } from '../apresentacao.ts'
import { useFaixasImc, useHistoricoDoAluno } from '../hooks/useAvaliacoes.ts'
import { type Evolucao, prepararEvolucao } from './evolucao.ts'
import { LinhaDoImc } from './LinhaDoImc.tsx'

const COM_SINAL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})

/** Quanto mudou desde a primeira avaliação, em destaque, com a data dela. */
function Variacao({ valor, unidade, desde }: Readonly<{ valor: number; unidade: string; desde: string | undefined }>) {
  if (desde === undefined) return <Stat.HelpText>primeira avaliação</Stat.HelpText>
  return (
    <Stat.HelpText>
      <Text as="span" fontWeight="600" color="fg">
        {COM_SINAL.format(valor)}
        {unidade}
      </Text>{' '}
      desde {desde}
    </Stat.HelpText>
  )
}

/** Os números do topo: onde o aluno está hoje e quanto mudou, lado a lado também no celular. */
function Resumo({ evolucao }: Readonly<{ evolucao: Evolucao }>) {
  const { atual, pontos, variacaoImc, variacaoPeso } = evolucao
  if (atual === undefined) return null
  const desde = pontos.length > 1 ? pontos[0]?.rotulo : undefined
  return (
    <SimpleGrid columns={2} gap={{ base: '4', md: '8' }} mb="5" maxW={{ md: '2xl' }}>
      <Stat.Root gap="1">
        <Stat.Label>IMC atual</Stat.Label>
        <Stat.ValueText>{formatarImc(atual.imc)}</Stat.ValueText>
        <Variacao valor={variacaoImc} unidade="" desde={desde} />
        <Badge alignSelf="flex-start" mt="1" colorPalette={corDaFaixa(atual.codigoDaFaixa)} variant="subtle">
          {atual.faixa}
        </Badge>
      </Stat.Root>
      <Stat.Root gap="1">
        <Stat.Label>Peso atual</Stat.Label>
        <Stat.ValueText>{formatarPeso(atual.pesoKg)}</Stat.ValueText>
        <Variacao valor={variacaoPeso} unidade=" kg" desde={desde} />
      </Stat.Root>
    </SimpleGrid>
  )
}

/** Gráfico da evolução do IMC de um aluno, com o resumo e os estados de carregamento, erro e vazio. */
export function GraficoDeEvolucao({ alunoId }: Readonly<{ alunoId: string }>) {
  const historico = useHistoricoDoAluno(alunoId)
  const faixas = useFaixasImc()
  const erro = historico.error ?? faixas.error

  if (erro !== null) return <MensagemDeErro mensagem={mensagemDeErro(erro)} />
  if (historico.data === undefined || faixas.data === undefined) return <Skeleton h="80" borderRadius="xl" mb="5" />

  const evolucao = prepararEvolucao(historico.data.itens)
  if (evolucao.atual === undefined) return <EstadoVazio titulo="Nenhuma avaliação para mostrar a evolução." />
  const nome = historico.data.itens[0]?.aluno.nome ?? ''
  const quantas = evolucao.pontos.length

  return (
    <Card.Root mb="5" as="section" aria-label="Evolução do IMC">
      <Card.Body>
        <Box mb="4">
          <Heading as="h2" size="lg">
            Evolução do IMC
          </Heading>
          <Text color="fg.muted">
            {quantas > 1
              ? `${nome} · ${String(quantas)} avaliações`
              : `${nome}: a evolução aparece a partir da segunda avaliação.`}
          </Text>
        </Box>
        <Resumo evolucao={evolucao} />
        <LinhaDoImc pontos={evolucao.pontos} faixas={faixas.data} />
      </Card.Body>
    </Card.Root>
  )
}

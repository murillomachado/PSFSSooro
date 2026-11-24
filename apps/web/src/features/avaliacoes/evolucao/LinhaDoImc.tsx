'use client'

import type { FaixaImcResposta } from '@psfssooro/contracts'
import { Chart, useChart } from '@chakra-ui/charts'
import { Badge, Box, Flex, Text } from '@chakra-ui/react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { corDaFaixa, formatarImc, formatarPeso } from '../apresentacao.ts'
import { faixasVisiveis, limitesDoEixo, type PontoDaEvolucao } from './evolucao.ts'

interface LinhaDoImcProps {
  readonly pontos: readonly PontoDaEvolucao[]
  readonly faixas: readonly FaixaImcResposta[]
}

/** A dica de cada ponto: a data e tudo o que foi medido nela. */
function Dica({ active, payload }: Readonly<Partial<TooltipContentProps<number, string>>>) {
  const ponto = payload?.[0]?.payload as PontoDaEvolucao | undefined
  if (active !== true || ponto === undefined) return null
  return (
    <Box bg="bg.panel" borderWidth="1px" borderRadius="md" px="3" py="2" boxShadow="md" fontSize="sm">
      <Text fontWeight="600">{ponto.data}</Text>
      <Text>
        IMC <strong>{formatarImc(ponto.imc)}</strong> · {formatarPeso(ponto.pesoKg)}
      </Text>
      <Badge mt="1" colorPalette={corDaFaixa(ponto.codigoDaFaixa)} variant="subtle">
        {ponto.faixa}
      </Badge>
      <Text color="fg.muted" mt="1">
        Avaliado por {ponto.professor}
      </Text>
    </Box>
  )
}

/**
 * A linha do IMC ao longo das avaliações, sobre as faixas da tabela de classificação (vindas da API,
 * nas mesmas cores das etiquetas da lista). O último ponto fica em destaque.
 */
export function LinhaDoImc({ pontos, faixas }: Readonly<LinhaDoImcProps>) {
  const chart = useChart({ data: [...pontos], series: [{ name: 'imc', color: 'brand.solid', label: 'IMC' }] })
  // O Chakra devolve a cor como `any`: aqui ela vira o texto da variável CSS do token.
  const cor = (token: string): string => String(chart.color(token))
  const eixo = limitesDoEixo(pontos.map((p) => p.imc))
  const fundo = faixasVisiveis(faixas, eixo)
  const ultimo = pontos.length - 1

  return (
    <>
      <Chart.Root chart={chart} aspectRatio={{ base: '4/3', md: '16/6' }}>
        <LineChart data={chart.data} responsive margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
          {fundo.map((faixa) => (
            <ReferenceArea
              key={faixa.codigo}
              y1={faixa.de}
              y2={faixa.ate}
              fill={cor(`${corDaFaixa(faixa.codigo)}.500`)}
              fillOpacity={0.1}
              stroke="none"
            />
          ))}
          <CartesianGrid stroke={cor('border.muted')} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={chart.key('rotulo')} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis domain={eixo} allowDecimals={false} tickLine={false} axisLine={false} width={44} />
          <Tooltip cursor={{ stroke: cor('border') }} animationDuration={100} content={<Dica />} />
          <Line
            type="monotone"
            dataKey={chart.key('imc')}
            stroke={cor('brand.solid')}
            strokeWidth={2.5}
            isAnimationActive={false}
            dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) => (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={index === ultimo ? 6 : 4}
                fill={cor('brand.solid')}
                stroke={cor('bg.panel')}
                strokeWidth={2}
              />
            )}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </Chart.Root>
      <Flex gap="3" wrap="wrap" mt="3" fontSize="xs" color="fg.muted" aria-label="Faixas do IMC no gráfico">
        {fundo.map((faixa) => (
          <Flex key={faixa.codigo} align="center" gap="1.5">
            <Box boxSize="2.5" borderRadius="sm" bg={`${corDaFaixa(faixa.codigo)}.500`} opacity={0.5} />
            {faixa.descricao}
          </Flex>
        ))}
      </Flex>
    </>
  )
}

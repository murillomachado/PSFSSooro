'use client'

import { Box, Card, Code, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react'
import { Logo } from '@/components/layout/Logo.tsx'
import { BotaoDeTema } from '@/components/ui/BotaoDeTema.tsx'
import { FormularioDeLogin } from '@/features/auth/components/FormularioDeLogin.tsx'

/** As faixas da tabela de IMC da especificação, nas cores das etiquetas. */
const FAIXAS = [
  { cor: 'blue.300', limite: '18,5' },
  { cor: 'green.300', limite: '25' },
  { cor: 'yellow.300', limite: '30' },
  { cor: 'orange.300', limite: '35' },
  { cor: 'red.300', limite: '40' },
]

const CONTAS = [
  { perfil: 'Administrador', usuario: 'michael.scott' },
  { perfil: 'Professor', usuario: 'dwight.schrute' },
  { perfil: 'Aluno', usuario: 'pam.beesly' },
]

function PainelDaMarca() {
  return (
    <Flex direction="column" justify="space-between" bg="brand.900" color="white" p="12" hideBelow="lg">
      <Logo claro />
      <Stack gap="4" maxW="md">
        <Heading as="p" size="4xl" lineHeight="1.15" letterSpacing="-0.02em">
          Acompanhe a evolução do IMC de cada aluno.
        </Heading>
        <Text color="whiteAlpha.800">
          Professores registram as avaliações, o sistema calcula o IMC e a classificação, e cada aluno acompanha o
          próprio histórico.
        </Text>
      </Stack>
      <Stack gap="2" maxW="md">
        <Flex h="2" borderRadius="full" overflow="hidden">
          {FAIXAS.map((faixa) => (
            <Box key={faixa.limite} flex="1" bg={faixa.cor} />
          ))}
        </Flex>
        <Flex justify="space-between" fontSize="xs" color="whiteAlpha.700">
          {FAIXAS.map((faixa) => (
            <Text key={faixa.limite}>{faixa.limite}</Text>
          ))}
        </Flex>
      </Stack>
    </Flex>
  )
}

export default function PaginaDeLogin() {
  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} minH="100dvh">
      <PainelDaMarca />
      <Flex direction="column" align="center" justify="center" p={{ base: '4', md: '8' }} position="relative">
        <Box position="absolute" top="4" right="4">
          <BotaoDeTema />
        </Box>
        <Stack gap="6" w="full" maxW="sm">
          <Box hideFrom="lg">
            <Logo />
          </Box>
          <Card.Root>
            <Card.Body gap="6">
              <Box>
                <Heading as="h1" size="2xl">
                  Entrar
                </Heading>
                <Text color="fg.muted">Use o usuário e a senha da academia.</Text>
              </Box>
              <FormularioDeLogin />
            </Card.Body>
          </Card.Root>
          <Box fontSize="sm" color="fg.muted">
            <Text fontWeight="600" mb="1">
              Contas de demonstração · senha <Code>senha1234</Code>
            </Text>
            {CONTAS.map((conta) => (
              <Flex key={conta.usuario} justify="space-between">
                <Text>{conta.perfil}</Text>
                <Code variant="plain">{conta.usuario}</Code>
              </Flex>
            ))}
          </Box>
        </Stack>
      </Flex>
    </Grid>
  )
}

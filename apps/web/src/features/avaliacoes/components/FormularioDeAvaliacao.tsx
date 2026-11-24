'use client'

import {
  type AvaliacaoResposta,
  type CriarAvaliacaoEntrada,
  criarAvaliacaoSchema,
  type Perfil,
} from '@psfssooro/contracts'
import { Button, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Resolver, useForm } from 'react-hook-form'
import { z } from 'zod'
import { CampoDeSelecao } from '@/components/ui/CampoDeSelecao.tsx'
import { CampoDeTexto } from '@/components/ui/CampoDeTexto.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { hoje } from '../apresentacao.ts'

export interface Opcao {
  readonly valor: string
  readonly texto: string
}

/** Usuários da API, na forma de opções de uma lista de escolha. */
export const comoOpcoes = (itens: readonly { id: string; nome: string }[] | undefined): Opcao[] =>
  (itens ?? []).map((u) => ({ valor: u.id, texto: u.nome }))

interface Valores {
  alunoId: string
  professorId?: string
  dataAvaliacao: string
  alturaM?: number
  pesoKg?: number
}

interface FormularioDeAvaliacaoProps {
  /** Com avaliação, o formulário edita; sem, registra. É o mesmo formulário nos dois casos. */
  readonly avaliacao?: AvaliacaoResposta
  readonly perfilDoAtor: Perfil
  readonly alunos: readonly Opcao[]
  readonly professores: readonly Opcao[]
  readonly enviando: boolean
  readonly erro: string | undefined
  readonly aoEnviar: (dados: CriarAvaliacaoEntrada) => void
}

/** Só o administrador escolhe o avaliador; para o professor, é sempre ele mesmo (a API define). */
const schemaDoAdministrador = criarAvaliacaoSchema.extend({ professorId: z.uuid('Escolha o professor') })

function resolverDoFormulario(ehAdmin: boolean): Resolver<Valores> {
  const validar = zodResolver(ehAdmin ? schemaDoAdministrador : criarAvaliacaoSchema) as Resolver<Valores>
  return (valores, contexto, opcoes) =>
    validar(
      { ...valores, professorId: !ehAdmin && valores.professorId === '' ? undefined : valores.professorId },
      contexto,
      opcoes,
    )
}

/** Garante que o aluno ou professor já gravado na avaliação aparece na lista, mesmo que hoje esteja inativo. */
function comOAtual(opcoes: readonly Opcao[], atual: Opcao | undefined): Opcao[] {
  const base = [{ valor: '', texto: 'Selecione…' }, ...opcoes]
  return atual === undefined || base.some((o) => o.valor === atual.valor) ? base : [...base, atual]
}

export function FormularioDeAvaliacao(props: Readonly<FormularioDeAvaliacaoProps>) {
  const { avaliacao, perfilDoAtor, enviando, erro, aoEnviar } = props
  const ehAdmin = perfilDoAtor === 'ADMINISTRADOR'
  const edicao = avaliacao !== undefined
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({
    resolver: resolverDoFormulario(ehAdmin),
    defaultValues: {
      alunoId: avaliacao?.aluno.id ?? '',
      professorId: avaliacao?.professor.id ?? '',
      dataAvaliacao: avaliacao?.dataAvaliacao ?? hoje(),
      alturaM: avaliacao?.alturaM,
      pesoKg: avaliacao?.pesoKg,
    },
  })
  // O professor corrige medidas e data da avaliação, mas só o administrador troca o aluno ou o avaliador.
  const alunoEditavel = ehAdmin || !edicao
  const alunoAtual = avaliacao && { valor: avaliacao.aluno.id, texto: avaliacao.aluno.nome }
  const professorAtual = avaliacao && { valor: avaliacao.professor.id, texto: avaliacao.professor.nome }

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        void handleSubmit(({ professorId, ...resto }) => {
          aoEnviar((professorId === '' ? resto : { ...resto, professorId }) as CriarAvaliacaoEntrada)
        })(evento)
      }}
    >
      <Stack gap="4">
        {erro !== undefined && <MensagemDeErro mensagem={erro} />}
        {alunoEditavel ? (
          <CampoDeSelecao
            rotulo="Aluno"
            opcoes={comOAtual(props.alunos, alunoAtual)}
            erro={errors.alunoId?.message}
            {...register('alunoId')}
          />
        ) : (
          <Text>Aluno: {avaliacao.aluno.nome}</Text>
        )}
        {ehAdmin && (
          <CampoDeSelecao
            rotulo="Professor avaliador"
            opcoes={comOAtual(props.professores, professorAtual)}
            erro={errors.professorId?.message}
            {...register('professorId')}
          />
        )}
        <CampoDeTexto
          rotulo="Data da avaliação"
          type="date"
          max={hoje()}
          erro={errors.dataAvaliacao?.message}
          {...register('dataAvaliacao')}
        />
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <CampoDeTexto
            rotulo="Altura (m)"
            type="number"
            step="0.01"
            erro={errors.alturaM?.message}
            {...register('alturaM', { valueAsNumber: true })}
          />
          <CampoDeTexto
            rotulo="Peso (kg)"
            type="number"
            step="0.01"
            erro={errors.pesoKg?.message}
            {...register('pesoKg', { valueAsNumber: true })}
          />
        </SimpleGrid>
        <Button type="submit" loading={enviando} alignSelf={{ sm: 'flex-end' }}>
          {edicao ? 'Salvar alterações' : 'Registrar avaliação'}
        </Button>
      </Stack>
    </form>
  )
}

'use client'

import { Button, Flex } from '@chakra-ui/react'
import { type SubmitEvent, useState } from 'react'
import { CampoDeSelecao } from '@/components/ui/CampoDeSelecao.tsx'
import { CampoDeTexto } from '@/components/ui/CampoDeTexto.tsx'
import type { FiltrosDeAvaliacoes } from '../services/avaliacoes.service.ts'
import type { Opcao } from './FormularioDeAvaliacao.tsx'

interface FiltrosDeAvaliacoesProps {
  /** Vazio para o aluno, que só vê as próprias avaliações e não escolhe de quem. */
  readonly alunos: readonly Opcao[]
  /** Vazio quando não há o que escolher. */
  readonly professores: readonly Opcao[]
  readonly aoFiltrar: (filtros: Omit<FiltrosDeAvaliacoes, 'pagina'>) => void
}

const comTodos = (opcoes: readonly Opcao[]): Opcao[] => [{ valor: '', texto: 'Todos' }, ...opcoes]

/** Transforma o que está nos campos em filtros, omitindo os vazios. */
function montarFiltros(campos: Record<'alunoId' | 'professorId' | 'de' | 'ate', string>) {
  return {
    ...(campos.alunoId === '' ? {} : { alunoId: campos.alunoId }),
    ...(campos.professorId === '' ? {} : { professorId: campos.professorId }),
    ...(campos.de === '' ? {} : { de: campos.de }),
    ...(campos.ate === '' ? {} : { ate: campos.ate }),
  }
}

export function FiltrosDeAvaliacoes({ alunos, professores, aoFiltrar }: Readonly<FiltrosDeAvaliacoesProps>) {
  const [campos, definirCampos] = useState({ alunoId: '', professorId: '', de: '', ate: '' })
  const mudar = (nome: keyof typeof campos) => (e: { target: { value: string } }) => {
    definirCampos({ ...campos, [nome]: e.target.value })
  }
  const enviar = (evento: SubmitEvent<HTMLFormElement>) => {
    evento.preventDefault()
    aoFiltrar(montarFiltros(campos))
  }

  return (
    <form onSubmit={enviar}>
      <Flex gap="3" align="flex-end" wrap="wrap" mb="4">
        {alunos.length > 0 && (
          <CampoDeSelecao rotulo="Aluno" opcoes={comTodos(alunos)} value={campos.alunoId} onChange={mudar('alunoId')} />
        )}
        {professores.length > 0 && (
          <CampoDeSelecao
            rotulo="Professor"
            opcoes={comTodos(professores)}
            value={campos.professorId}
            onChange={mudar('professorId')}
          />
        )}
        <CampoDeTexto rotulo="De" type="date" erro={undefined} value={campos.de} onChange={mudar('de')} />
        <CampoDeTexto rotulo="Até" type="date" erro={undefined} value={campos.ate} onChange={mudar('ate')} />
        <Button type="submit">Filtrar</Button>
      </Flex>
    </form>
  )
}

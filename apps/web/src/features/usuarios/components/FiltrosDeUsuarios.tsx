'use client'

import { perfilSchema } from '@psfssooro/contracts'
import { Button, Flex } from '@chakra-ui/react'
import { type SubmitEvent, useState } from 'react'
import { CampoDeSelecao } from '@/components/ui/CampoDeSelecao.tsx'
import { CampoDeTexto } from '@/components/ui/CampoDeTexto.tsx'
import { OPCOES_DE_PERFIL } from '../perfis.ts'
import type { FiltrosDaLista } from '../services/usuarios.service.ts'

const OPCOES_DE_SITUACAO = [
  { valor: '', texto: 'Todas' },
  { valor: 'true', texto: 'Ativos' },
  { valor: 'false', texto: 'Inativos' },
]

const OPCOES_DO_FILTRO_DE_PERFIL = [{ valor: '', texto: 'Todos' }, ...OPCOES_DE_PERFIL]

interface FiltrosDeUsuariosProps {
  /** O professor só lista alunos, então o filtro de perfil só aparece para o administrador. */
  readonly mostrarPerfil: boolean
  readonly aoFiltrar: (filtros: Omit<FiltrosDaLista, 'pagina'>) => void
}

export function FiltrosDeUsuarios({ mostrarPerfil, aoFiltrar }: Readonly<FiltrosDeUsuariosProps>) {
  const [busca, definirBusca] = useState('')
  const [perfil, definirPerfil] = useState('')
  const [situacao, definirSituacao] = useState('')

  const enviar = (evento: SubmitEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const perfilEscolhido = perfilSchema.safeParse(perfil)
    aoFiltrar({
      busca: busca.trim(),
      ...(perfilEscolhido.success ? { perfil: perfilEscolhido.data } : {}),
      ...(situacao === '' ? {} : { ativo: situacao === 'true' }),
    })
  }

  return (
    <form onSubmit={enviar}>
      <Flex gap="3" align="flex-end" wrap="wrap" mb="4">
        <CampoDeTexto
          rotulo="Buscar por nome ou usuário"
          erro={undefined}
          value={busca}
          onChange={(e) => {
            definirBusca(e.target.value)
          }}
        />
        {mostrarPerfil && (
          <CampoDeSelecao
            rotulo="Perfil"
            opcoes={OPCOES_DO_FILTRO_DE_PERFIL}
            value={perfil}
            onChange={(e) => {
              definirPerfil(e.target.value)
            }}
          />
        )}
        <CampoDeSelecao
          rotulo="Situação"
          opcoes={OPCOES_DE_SITUACAO}
          value={situacao}
          onChange={(e) => {
            definirSituacao(e.target.value)
          }}
        />
        <Button type="submit">Filtrar</Button>
      </Flex>
    </form>
  )
}

'use client'

import { perfilSchema } from '@psfssooro/contracts'
import { useState } from 'react'
import { BarraDeFiltros } from '@/components/ui/BarraDeFiltros.tsx'
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

  const filtrar = () => {
    const perfilEscolhido = perfilSchema.safeParse(perfil)
    aoFiltrar({
      busca: busca.trim(),
      ...(perfilEscolhido.success ? { perfil: perfilEscolhido.data } : {}),
      ...(situacao === '' ? {} : { ativo: situacao === 'true' }),
    })
  }
  const limpar = () => {
    definirBusca('')
    definirPerfil('')
    definirSituacao('')
    aoFiltrar({})
  }

  return (
    <BarraDeFiltros aoFiltrar={filtrar} aoLimpar={limpar}>
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
    </BarraDeFiltros>
  )
}

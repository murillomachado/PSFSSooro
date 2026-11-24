import type { UsuarioResposta } from '@psfssooro/contracts'
import type { QueryClient } from '@tanstack/react-query'
import { precarregarAvaliacoes, precarregarEvolucao } from '@/features/avaliacoes/precarregar.ts'
import { precarregarUsuarios } from '@/features/usuarios/precarregar.ts'
import type { ClienteHttp } from '@/lib/http-client.ts'
import { filtrosDoPainel } from './filtros.ts'

/** No servidor: o que a tela inicial de cada perfil mostra ao abrir. */
export function precarregarInicio(consultas: QueryClient, cliente: ClienteHttp, usuario: UsuarioResposta) {
  if (usuario.perfil === 'ALUNO') return precarregarEvolucao(consultas, cliente, usuario.id)
  return Promise.all([
    precarregarUsuarios(consultas, cliente, filtrosDoPainel.usuarios),
    precarregarUsuarios(consultas, cliente, filtrosDoPainel.alunosAtivos),
    precarregarAvaliacoes(consultas, cliente, filtrosDoPainel.avaliacoes),
    precarregarAvaliacoes(consultas, cliente, filtrosDoPainel.feitasPor(usuario.id)),
  ])
}

import type { Perfil } from '@psfssooro/contracts'
import type { QueryClient } from '@tanstack/react-query'
import type { ClienteHttp } from '@/lib/http-client.ts'
import { precarregar } from '@/lib/precarregar.ts'
import { chavesDeUsuarios, filtrosParaEscolha } from './chaves.ts'
import { type FiltrosDaLista, listarUsuarios } from './services/usuarios.service.ts'

/** No servidor: as consultas de usuários que as telas fazem ao abrir, com as mesmas chaves dos hooks. */
export const precarregarUsuarios = (consultas: QueryClient, cliente: ClienteHttp, filtros: FiltrosDaLista) =>
  precarregar(consultas, chavesDeUsuarios.lista(filtros), () => listarUsuarios(filtros, cliente))

export const precarregarEscolha = (consultas: QueryClient, cliente: ClienteHttp, perfil: Perfil) =>
  precarregar(consultas, chavesDeUsuarios.escolha(perfil, false), () =>
    listarUsuarios(filtrosParaEscolha(perfil, false), cliente),
  )

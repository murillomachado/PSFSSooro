import type {
  CriarUsuarioEntrada,
  EditarUsuarioEntrada,
  PaginaDeUsuarios,
  Perfil,
  UsuarioResposta,
} from '@psfssooro/contracts'
import { type ClienteHttp, http } from '@/lib/http-client.ts'

export interface FiltrosDaLista {
  readonly pagina: number
  readonly limite?: number
  readonly busca?: string
  readonly perfil?: Perfil
  readonly ativo?: boolean
}

export async function listarUsuarios(filtros: FiltrosDaLista, cliente: ClienteHttp = http): Promise<PaginaDeUsuarios> {
  const params = { ...filtros, busca: filtros.busca === '' ? undefined : filtros.busca }
  return (await cliente.get<PaginaDeUsuarios>('/usuarios', { params })).data
}

export async function obterUsuario(id: string): Promise<UsuarioResposta> {
  return (await http.get<UsuarioResposta>(`/usuarios/${id}`)).data
}

export async function criarUsuario(entrada: CriarUsuarioEntrada): Promise<UsuarioResposta> {
  return (await http.post<UsuarioResposta>('/usuarios', entrada)).data
}

export async function editarUsuario(id: string, entrada: EditarUsuarioEntrada): Promise<UsuarioResposta> {
  return (await http.put<UsuarioResposta>(`/usuarios/${id}`, entrada)).data
}

export async function alterarSituacao(id: string, ativo: boolean): Promise<UsuarioResposta> {
  return (await http.patch<UsuarioResposta>(`/usuarios/${id}/situacao`, { ativo })).data
}

export async function excluirUsuario(id: string): Promise<void> {
  await http.delete(`/usuarios/${id}`)
}

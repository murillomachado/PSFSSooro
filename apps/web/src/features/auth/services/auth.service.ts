import { type LoginEntrada, type LoginResposta, type UsuarioResposta } from '@psfssooro/contracts'
import { type ClienteHttp, http } from '@/lib/http-client.ts'

export async function entrar(entrada: LoginEntrada): Promise<LoginResposta> {
  return (await http.post<LoginResposta>('/auth/login', entrada)).data
}

/** Encerra a sessão: a API apaga o cookie. */
export async function sairDaSessao(): Promise<void> {
  await http.post('/auth/logout')
}

export async function obterSessao(cliente: ClienteHttp = http): Promise<UsuarioResposta> {
  return (await cliente.get<UsuarioResposta>('/auth/me')).data
}

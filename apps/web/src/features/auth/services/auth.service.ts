import { type LoginEntrada, type LoginResposta, type UsuarioResposta } from '@psfssooro/contracts'
import { http } from '@/lib/http-client.ts'

export async function entrar(entrada: LoginEntrada): Promise<LoginResposta> {
  return (await http.post<LoginResposta>('/auth/login', entrada)).data
}

export async function obterSessao(): Promise<UsuarioResposta> {
  return (await http.get<UsuarioResposta>('/auth/me')).data
}

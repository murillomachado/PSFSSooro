import { problemaSchema } from '@psfssooro/contracts'
import axios, { isAxiosError } from 'axios'

/**
 * Único lugar que importa o Axios: telas e services usam este cliente. A sessão viaja num cookie
 * httpOnly que a API grava no login: o navegador o envia sozinho (withCredentials) e o JavaScript
 * da página nunca vê o token.
 */
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api',
  withCredentials: true,
})

let aoPerderASessao: (() => void) | undefined

/** Quem cuida da sessão registra aqui o que fazer quando a API recusar a sessão (401 fora do login). */
export function aoPerderASessaoFazer(acao: (() => void) | undefined): void {
  aoPerderASessao = acao
}

http.interceptors.response.use(undefined, (erro: unknown) => {
  const url = isAxiosError(erro) ? (erro.config?.url ?? '') : ''
  // No login, 401 significa "usuário ou senha errados" e a tela mostra a mensagem; nos demais, a sessão acabou.
  if (isAxiosError(erro) && erro.response?.status === 401 && !url.endsWith('/auth/login')) {
    aoPerderASessao?.()
  }
  return Promise.reject(erro instanceof Error ? erro : new Error('Erro desconhecido'))
})

/** A mensagem que a API mandou (RFC 9457) ou, sem resposta dela, uma mensagem para a pessoa. */
export function mensagemDeErro(erro: unknown): string {
  if (isAxiosError(erro)) {
    const problema = problemaSchema.safeParse(erro.response?.data)
    if (problema.success) return problema.data.detail
    if (erro.response === undefined) return 'Não foi possível falar com o servidor. Tente de novo em instantes.'
  }
  return 'Algo deu errado. Tente de novo.'
}

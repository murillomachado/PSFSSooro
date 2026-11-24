import type { CookieOptions, Request, Response } from 'express'

/** O cookie que guarda o token da sessão no navegador. */
export const COOKIE_DA_SESSAO = 'sessao'

export interface OpcoesDaSessao {
  readonly validadeEmSegundos: number
  /** Só por HTTPS. Fica desligado em http://localhost; ligue em qualquer ambiente real. */
  readonly seguro: boolean
}

/**
 * httpOnly: o JavaScript da página não lê o token, então um script injetado não consegue roubá-lo.
 * SameSite=Lax: o navegador não envia o cookie em requisições que outro site dispara.
 */
const atributos = (seguro: boolean): CookieOptions => ({ httpOnly: true, sameSite: 'lax', secure: seguro, path: '/' })

export function gravarSessao(res: Response, token: string, opcoes: OpcoesDaSessao): void {
  res.cookie(COOKIE_DA_SESSAO, token, { ...atributos(opcoes.seguro), maxAge: opcoes.validadeEmSegundos * 1000 })
}

export function apagarSessao(res: Response, opcoes: OpcoesDaSessao): void {
  res.clearCookie(COOKIE_DA_SESSAO, atributos(opcoes.seguro))
}

/** O token do cookie da sessão, se a requisição trouxe um. */
export function tokenDoCookie(req: Request): string | undefined {
  // O nome do campo é o de COOKIE_DA_SESSAO.
  const valor = (req.cookies as { sessao?: unknown } | undefined)?.sessao
  return typeof valor === 'string' && valor !== '' ? valor : undefined
}

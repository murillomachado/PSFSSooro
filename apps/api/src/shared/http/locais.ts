import type { Response } from 'express'
import { NaoAutenticado } from '../errors/erros.ts'
import type { Ator } from '../security/ator.ts'

// O Express guarda por requisição, em res.locals, o que os middlewares descobriram: quem é o ator
// e a consulta e os parâmetros já validados. Estas funções são o único lugar que lê e grava isso.

export function definirAtor(res: Response, ator: Ator): void {
  res.locals.ator = ator
}

/** O ator autenticado da requisição. Só falha se uma rota esqueceu de passar pelo middleware `autenticar`. */
export function atorDe(res: Response): Ator {
  const ator = res.locals.ator as Ator | undefined
  if (ator === undefined) throw new NaoAutenticado('Autenticação necessária.')
  return ator
}

export function definirEntradaValidada(res: Response, consulta: unknown, parametros: unknown): void {
  res.locals.consulta = consulta
  res.locals.parametros = parametros
}

export function idDaRota(res: Response): string {
  return (res.locals.parametros as { id: string }).id
}

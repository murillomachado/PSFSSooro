import type { RequestHandler } from 'express'
import type { z } from 'zod'
import { type CampoInvalido, EntradaInvalida } from '../errors/erros.ts'
import { definirEntradaValidada } from './locais.ts'

export interface EsquemasDaRota {
  readonly corpo?: z.ZodType
  readonly consulta?: z.ZodType
  readonly parametros?: z.ZodType
}

/** Valida um pedaço da requisição. Devolve o valor já convertido, e acumula os problemas em `campos`. */
function conferir(esquema: z.ZodType | undefined, valor: unknown, campos: CampoInvalido[]): unknown {
  if (esquema === undefined) return valor
  const resultado = esquema.safeParse(valor)
  if (resultado.success) return resultado.data
  for (const problema of resultado.error.issues) {
    campos.push({ campo: problema.path.map(String).join('.'), mensagem: problema.message })
  }
  return undefined
}

/**
 * Valida corpo, query string e parâmetros da rota com os schemas do contracts (o mesmo schema que
 * a Web usa no formulário). O corpo validado substitui `req.body`; a consulta e os parâmetros vão
 * para res.locals, porque no Express 5 `req.query` não pode ser sobrescrito.
 */
export function validar(esquemas: EsquemasDaRota): RequestHandler {
  return (req, res, next) => {
    const campos: CampoInvalido[] = []
    const corpo = conferir(esquemas.corpo, req.body, campos)
    const consulta = conferir(esquemas.consulta, req.query, campos)
    const parametros = conferir(esquemas.parametros, req.params, campos)
    if (campos.length > 0) {
      next(new EntradaInvalida(campos))
      return
    }
    req.body = corpo
    definirEntradaValidada(res, consulta, parametros)
    next()
  }
}

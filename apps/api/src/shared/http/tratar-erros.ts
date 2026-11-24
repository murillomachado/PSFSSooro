import type { Problema } from '@psfssooro/contracts'
import type { ErrorRequestHandler, RequestHandler, Response } from 'express'
import { EntradaInvalida, ErroDeDominio, MuitasTentativas, NaoEncontrado } from '../errors/erros.ts'

const PROBLEM_JSON = 'application/problem+json'

function paraProblema(erro: ErroDeDominio): Problema {
  const base = {
    // RFC 9457: sem uma página por tipo de erro, o `type` é about:blank; quem distingue os erros é o `codigo`.
    type: 'about:blank',
    title: erro.titulo,
    status: erro.status,
    detail: erro.message,
    codigo: erro.codigo,
  }
  return erro instanceof EntradaInvalida ? { ...base, campos: [...erro.campos] } : base
}

/** Erros que o próprio Express e o leitor de JSON lançam (JSON malformado, corpo grande demais). */
function erroDeRequisicao(erro: unknown): ErroDeDominio | undefined {
  if (typeof erro !== 'object' || erro === null) return undefined
  const { status, type } = erro as { status?: unknown; type?: unknown }
  if (typeof status !== 'number' || status < 400 || status >= 500) return undefined
  if (type === 'entity.too.large') {
    return new ErroDeDominio(
      413,
      'CORPO_GRANDE_DEMAIS',
      'Requisição inválida',
      'O corpo da requisição é grande demais.',
    )
  }
  return new ErroDeDominio(status, 'REQUISICAO_INVALIDA', 'Requisição inválida', 'A requisição não pôde ser lida.')
}

function responder(res: Response, erro: ErroDeDominio): void {
  // RFC 9110: o 401 diz ao cliente como se autenticar.
  if (erro.status === 401) res.set('WWW-Authenticate', 'Bearer')
  if (erro instanceof MuitasTentativas) res.set('Retry-After', String(erro.segundosParaTentarDeNovo))
  res.status(erro.status).type(PROBLEM_JSON).json(paraProblema(erro))
}

/** Único ponto de saída de erro da API: todo erro vira um problem+json no mesmo formato. */
export function criarTratadorDeErros(registrar: (erro: unknown) => void): ErrorRequestHandler {
  return (erro, _req, res, next) => {
    if (res.headersSent) {
      next(erro)
      return
    }
    const conhecido = erro instanceof ErroDeDominio ? erro : erroDeRequisicao(erro)
    if (conhecido !== undefined) {
      responder(res, conhecido)
      return
    }
    // Erro inesperado: o detalhe vai para o registro, e o cliente recebe uma mensagem genérica, sem stack.
    registrar(erro)
    responder(
      res,
      new ErroDeDominio(500, 'ERRO_INTERNO', 'Erro interno', 'Ocorreu um erro inesperado. Tente novamente.'),
    )
  }
}

export const rotaNaoEncontrada: RequestHandler = (_req, _res, next) => {
  next(new NaoEncontrado('Rota não encontrada.', 'ROTA_NAO_ENCONTRADA'))
}

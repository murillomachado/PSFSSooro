import type { Perfil } from '@psfssooro/contracts'
import type { RequestHandler } from 'express'
import { SemPermissao } from '../errors/erros.ts'
import { atorDe } from './locais.ts'

/** Só deixa passar os perfis informados. Uma linha na definição da rota, sem `if` dentro dela. */
export function autorizar(...perfis: readonly Perfil[]): RequestHandler {
  return (_req, res, next) => {
    if (!perfis.includes(atorDe(res).perfil)) {
      next(new SemPermissao('Você não tem permissão para esta ação.'))
      return
    }
    next()
  }
}

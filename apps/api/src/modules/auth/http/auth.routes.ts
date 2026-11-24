import { loginSchema } from '@psfssooro/contracts'
import { type RequestHandler, Router } from 'express'
import { validar } from '../../../shared/http/validar.ts'
import type { AuthController } from './auth.controller.ts'

export function criarRotasDeAuth(
  controller: AuthController,
  autenticarRequisicao: RequestHandler,
  limitarTentativas: RequestHandler,
): Router {
  const rotas = Router()
  rotas.post('/login', limitarTentativas, validar({ corpo: loginSchema }), controller.login)
  rotas.post('/logout', controller.logout)
  rotas.get('/me', autenticarRequisicao, controller.me)
  return rotas
}

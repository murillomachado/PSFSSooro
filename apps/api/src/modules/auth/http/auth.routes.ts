import { loginSchema } from '@psfssooro/contracts'
import { type RequestHandler, Router } from 'express'
import { validar } from '../../../shared/http/validar.ts'
import type { AuthController } from './auth.controller.ts'

export function criarRotasDeAuth(controller: AuthController, autenticarRequisicao: RequestHandler): Router {
  const rotas = Router()
  rotas.post('/login', validar({ corpo: loginSchema }), controller.login)
  rotas.get('/me', autenticarRequisicao, controller.me)
  return rotas
}

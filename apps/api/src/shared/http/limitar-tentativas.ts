import type { Request, RequestHandler } from 'express'
import { ipKeyGenerator, type RateLimitInfo, rateLimit } from 'express-rate-limit'
import { MuitasTentativas } from '../errors/erros.ts'

export const TENTATIVAS_DE_LOGIN = 5
export const JANELA_EM_MINUTOS = 15

/** O usuário do corpo do login, como o login o compara (sem espaços, em minúsculas). */
function usuarioDoCorpo(corpo: unknown): string {
  const usuario = (corpo as { usuario?: unknown } | undefined)?.usuario
  return typeof usuario === 'string' ? usuario.trim().toLowerCase() : ''
}

/**
 * Contra adivinhação de senha: depois de 5 logins errados para o mesmo usuário, a partir do mesmo
 * endereço, em 15 minutos, o login desse usuário fica bloqueado até a janela acabar (429).
 * Logins certos não contam, e os outros usuários seguem entrando normalmente.
 */
export function limitarTentativasDeLogin(): RequestHandler {
  return rateLimit({
    windowMs: JANELA_EM_MINUTOS * 60_000,
    limit: TENTATIVAS_DE_LOGIN,
    skipSuccessfulRequests: true,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}:${usuarioDoCorpo(req.body)}`,
    handler: (req, _res, next) => {
      const { rateLimit: limite } = req as Request & { rateLimit?: RateLimitInfo }
      const fim = limite?.resetTime ?? new Date(Date.now() + JANELA_EM_MINUTOS * 60_000)
      const segundos = Math.max(1, Math.ceil((fim.getTime() - Date.now()) / 1000))
      const minutos = Math.ceil(segundos / 60)
      next(new MuitasTentativas(`Muitas tentativas de login. Tente de novo em ${String(minutos)} minutos.`, segundos))
    },
  })
}

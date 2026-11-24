import type { RequestHandler } from 'express'
import { NaoAutenticado } from '../errors/erros.ts'
import type { Ator } from '../security/ator.ts'
import type { VerificadorDeToken } from '../security/portas.ts'
import { definirAtor } from './locais.ts'

/** Descobre o ator de um usuário. Devolve undefined se ele não existe ou está inativo. */
export interface ProvedorDeAtor {
  buscarAtor(usuarioId: string): Promise<Ator | undefined>
}

function extrairBearer(cabecalho: string | undefined): string | undefined {
  const [esquema, token] = cabecalho?.split(' ') ?? []
  return esquema === 'Bearer' && token !== undefined && token !== '' ? token : undefined
}

/**
 * Exige um token válido e relê o usuário a cada requisição: quem foi inativado perde o acesso
 * na hora, sem esperar o token expirar.
 */
export function autenticar(verificador: VerificadorDeToken, provedor: ProvedorDeAtor): RequestHandler {
  return async (req, res, next) => {
    const token = extrairBearer(req.headers.authorization)
    const usuarioId = token === undefined ? undefined : verificador.verificar(token)
    const ator = usuarioId === undefined ? undefined : await provedor.buscarAtor(usuarioId)
    if (ator === undefined) {
      next(new NaoAutenticado('Autenticação necessária ou expirada.'))
      return
    }
    definirAtor(res, ator)
    next()
  }
}

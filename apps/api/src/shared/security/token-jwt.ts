import jwt from 'jsonwebtoken'
import type { GeradorDeToken, VerificadorDeToken } from './portas.ts'

const ALGORITMO = 'HS256'

/** JWT assinado com HS256. O algoritmo é fixo na assinatura e na verificação, para o token não escolher o próprio. */
export class TokenJwt implements GeradorDeToken, VerificadorDeToken {
  private readonly segredo: string
  private readonly expiracaoEmSegundos: number

  constructor(segredo: string, expiracaoEmSegundos: number) {
    this.segredo = segredo
    this.expiracaoEmSegundos = expiracaoEmSegundos
  }

  gerar(usuarioId: string): string {
    return jwt.sign({}, this.segredo, {
      algorithm: ALGORITMO,
      subject: usuarioId,
      expiresIn: this.expiracaoEmSegundos,
    })
  }

  verificar(token: string): string | undefined {
    try {
      const conteudo = jwt.verify(token, this.segredo, { algorithms: [ALGORITMO] })
      return typeof conteudo === 'object' && typeof conteudo.sub === 'string' ? conteudo.sub : undefined
    } catch {
      return undefined
    }
  }
}

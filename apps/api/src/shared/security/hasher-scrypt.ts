import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { HasherDeSenha } from './portas.ts'

const TAMANHO_DA_CHAVE = 64
const TAMANHO_DO_SAL = 16

function derivar(senha: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, sal, TAMANHO_DA_CHAVE, (erro, chave) => {
      if (erro === null) resolve(chave)
      else reject(erro)
    })
  })
}

/** Senha guardada como `sal:chave` (hexadecimal), com scrypt, que já vem no Node. Cada senha tem o seu sal. */
export class HasherScrypt implements HasherDeSenha {
  async gerar(senha: string): Promise<string> {
    const sal = randomBytes(TAMANHO_DO_SAL)
    const chave = await derivar(senha, sal)
    return `${sal.toString('hex')}:${chave.toString('hex')}`
  }

  async conferir(senha: string, hash: string): Promise<boolean> {
    const [sal = '', chave = ''] = hash.split(':')
    const esperada = Buffer.from(chave, 'hex')
    const obtida = await derivar(senha, Buffer.from(sal, 'hex'))
    // Comparação em tempo constante: o tempo de resposta não revela quantos bytes batem.
    return esperada.length === obtida.length && timingSafeEqual(esperada, obtida)
  }
}

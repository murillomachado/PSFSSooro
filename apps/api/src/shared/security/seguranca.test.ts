import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { HasherScrypt } from './hasher-scrypt.ts'
import { relogioDoSistema } from './relogio.ts'
import { TokenJwt } from './token-jwt.ts'

const SEGREDO = 'um-segredo-de-teste-com-mais-de-trinta-e-dois-caracteres'
const USUARIO_ID = '4b1c9f3e-9d2a-4b7e-8f10-1a2b3c4d5e6f'

describe('HasherScrypt', () => {
  const hasher = new HasherScrypt()

  it('confere a senha certa e recusa a errada', async () => {
    const hash = await hasher.gerar('senha1234')
    expect(await hasher.conferir('senha1234', hash)).toBe(true)
    expect(await hasher.conferir('senha12345', hash)).toBe(false)
  })

  it('não guarda a senha em texto e gera um hash diferente a cada vez (sal aleatório)', async () => {
    const [primeiro, segundo] = await Promise.all([hasher.gerar('senha1234'), hasher.gerar('senha1234')])
    expect(primeiro).not.toContain('senha1234')
    expect(primeiro).not.toBe(segundo)
  })

  it('recusa um hash malformado, em vez de lançar erro', async () => {
    expect(await hasher.conferir('senha1234', 'isto-nao-e-um-hash')).toBe(false)
  })
})

describe('TokenJwt', () => {
  const token = new TokenJwt(SEGREDO, 3600)

  it('devolve o id do usuário de um token que ele mesmo gerou', () => {
    expect(token.verificar(token.gerar(USUARIO_ID))).toBe(USUARIO_ID)
  })

  it('recusa token assinado com outro segredo', () => {
    const deOutro = new TokenJwt('outro-segredo-tambem-com-mais-de-trinta-e-dois-caracteres', 3600)
    expect(token.verificar(deOutro.gerar(USUARIO_ID))).toBeUndefined()
  })

  it('recusa token expirado', () => {
    const expirado = jwt.sign({}, SEGREDO, { algorithm: 'HS256', subject: USUARIO_ID, expiresIn: -10 })
    expect(token.verificar(expirado)).toBeUndefined()
  })

  it('recusa token sem assinatura (alg: none), o ataque clássico', () => {
    // Montado na mão: o ataque é um token cujo cabeçalho diz "alg: none" e que vem sem assinatura.
    const codificar = (objeto: object): string => Buffer.from(JSON.stringify(objeto)).toString('base64url')
    const semAssinatura = `${codificar({ alg: 'none', typ: 'JWT' })}.${codificar({ sub: USUARIO_ID })}.`
    expect(token.verificar(semAssinatura)).toBeUndefined()
  })

  it('recusa token sem o campo sub e texto que nem é um token', () => {
    expect(token.verificar(jwt.sign({}, SEGREDO, { algorithm: 'HS256' }))).toBeUndefined()
    expect(token.verificar('lixo')).toBeUndefined()
  })
})

describe('relogioDoSistema', () => {
  it('devolve o instante atual', () => {
    const antes = Date.now()
    const agora = relogioDoSistema.agora().getTime()
    expect(agora).toBeGreaterThanOrEqual(antes)
    expect(agora).toBeLessThanOrEqual(Date.now())
  })
})

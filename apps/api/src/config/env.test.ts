import { describe, expect, it } from 'vitest'
import { carregarEnv } from './env.ts'

const SEGREDO = 'um-segredo-de-teste-com-mais-de-trinta-e-dois-caracteres'

describe('carregarEnv', () => {
  it('aplica os valores padrão quando só o segredo é informado', () => {
    expect(carregarEnv({ JWT_SECRET: SEGREDO })).toEqual({
      ambiente: 'development',
      porta: 3333,
      caminhoDoBanco: './academia.sqlite',
      segredoJwt: SEGREDO,
      expiracaoDoTokenEmSegundos: 28_800,
      origemCors: 'http://localhost:3000',
      cookieSeguro: false,
    })
  })

  it('converte e usa as variáveis informadas', () => {
    const env = carregarEnv({
      JWT_SECRET: SEGREDO,
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_PATH: '/dados/banco.sqlite',
      JWT_EXPIRES_IN_SECONDS: '3600',
      CORS_ORIGIN: 'https://academia.exemplo.com',
    })
    expect(env).toMatchObject({ ambiente: 'production', porta: 8080, expiracaoDoTokenEmSegundos: 3600 })
    expect(env.caminhoDoBanco).toBe('/dados/banco.sqlite')
    expect(env.origemCors).toBe('https://academia.exemplo.com')
  })

  it('recusa subir sem o segredo do JWT, dizendo qual variável falta', () => {
    expect(() => carregarEnv({})).toThrow(/JWT_SECRET: é obrigatório/)
  })

  it.each([
    ['segredo curto', { JWT_SECRET: 'curto' }, /JWT_SECRET: precisa ter pelo menos 32 caracteres/],
    ['porta não numérica', { JWT_SECRET: SEGREDO, PORT: 'abc' }, /PORT: precisa ser um número inteiro/],
    ['porta fora do intervalo', { JWT_SECRET: SEGREDO, PORT: '70000' }, /PORT: máximo 65535/],
    ['ambiente desconhecido', { JWT_SECRET: SEGREDO, NODE_ENV: 'staging' }, /NODE_ENV/],
  ])('recusa %s', (_descricao, variaveis, mensagem) => {
    expect(() => carregarEnv(variaveis)).toThrow(mensagem)
  })

  it('lista todos os problemas de uma vez', () => {
    const carregar = (): unknown => carregarEnv({ JWT_SECRET: 'curto', PORT: 'x' })
    expect(carregar).toThrow(/JWT_SECRET/)
    expect(carregar).toThrow(/PORT/)
  })
})

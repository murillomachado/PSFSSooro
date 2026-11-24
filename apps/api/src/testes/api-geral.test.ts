import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { montarApp } from '../container.ts'
import { criarBancoEmMemoria } from '../shared/database/banco-em-memoria.ts'
import type { DataSource } from '../shared/database/data-source.ts'
import { ENV_DE_TESTE } from './ambiente.ts'

describe('API: comportamento geral', () => {
  let banco: DataSource
  let app: ReturnType<typeof montarApp>

  beforeAll(async () => {
    banco = await criarBancoEmMemoria()
    app = montarApp(ENV_DE_TESTE, banco)
  })
  afterAll(async () => {
    await banco.destroy()
  })

  it('GET /api/health responde que está no ar, sem exigir login', async () => {
    const resposta = await request(app).get('/api/health')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'ok' })
  })

  it('responde 404 em problem+json para uma rota que não existe', async () => {
    const resposta = await request(app).get('/api/nao-existe')
    expect(resposta.status).toBe(404)
    expect(resposta.headers['content-type']).toMatch(/application\/problem\+json/)
  })

  it('exige login em /api/usuarios', async () => {
    expect((await request(app).get('/api/usuarios')).status).toBe(401)
  })

  it('libera no CORS só a origem do front-end, e nunca "*", e envia os cabeçalhos de segurança', async () => {
    const resposta = await request(app).get('/api/health').set('Origin', ENV_DE_TESTE.origemCors)
    expect(resposta.headers['access-control-allow-origin']).toBe(ENV_DE_TESTE.origemCors)
    expect(resposta.headers['x-content-type-options']).toBe('nosniff')
    // Com origem fixa, a resposta a outro site continua anunciando só a origem configurada: o navegador bloqueia.
    const deOutraOrigem = await request(app).get('/api/health').set('Origin', 'https://outro-site.exemplo')
    expect(deOutraOrigem.headers['access-control-allow-origin']).toBe(ENV_DE_TESTE.origemCors)
  })
})

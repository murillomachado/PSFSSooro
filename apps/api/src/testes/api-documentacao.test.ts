import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Ambiente, criarAmbiente } from './ambiente.ts'

interface Operacao {
  readonly security?: unknown[]
  readonly requestBody?: { content: Record<string, { schema: { required?: string[] } }> }
  readonly responses: Record<string, unknown>
}
interface DocumentoOpenApi {
  readonly openapi: string
  readonly paths: Record<string, Record<string, Operacao>>
}

/** Todas as rotas da API, no formato do OpenAPI: nenhuma pode faltar na documentação. */
const ROTAS = [
  'post /api/auth/login',
  'get /api/auth/me',
  'get /api/usuarios',
  'post /api/usuarios',
  'get /api/usuarios/{id}',
  'put /api/usuarios/{id}',
  'delete /api/usuarios/{id}',
  'patch /api/usuarios/{id}/situacao',
  'get /api/avaliacoes',
  'post /api/avaliacoes',
  'get /api/avaliacoes/faixas',
  'get /api/avaliacoes/{id}',
  'put /api/avaliacoes/{id}',
  'delete /api/avaliacoes/{id}',
]

describe('documentação da API (OpenAPI)', () => {
  let ambiente: Ambiente
  let documento: DocumentoOpenApi

  beforeAll(async () => {
    ambiente = await criarAmbiente()
    documento = (await request(ambiente.app).get('/api/docs/openapi.json')).body as DocumentoOpenApi
  })
  afterAll(async () => {
    await ambiente.banco.destroy()
  })

  it('descreve todas as rotas, sem precisar de login para ler', () => {
    expect(documento.openapi).toBe('3.1.0')
    const descritas = Object.entries(documento.paths).flatMap(([caminho, metodos]) =>
      Object.keys(metodos).map((metodo) => `${metodo} ${caminho}`),
    )
    expect(descritas.toSorted((a, b) => a.localeCompare(b))).toEqual(ROTAS.toSorted((a, b) => a.localeCompare(b)))
  })

  it('o corpo vem dos mesmos schemas que validam a requisição, e só o login dispensa o token', () => {
    const cadastro = documento.paths['/api/usuarios']?.post
    expect(cadastro?.requestBody?.content['application/json']?.schema.required).toEqual([
      'nome',
      'usuario',
      'senha',
      'perfil',
    ])
    expect(cadastro?.security).toEqual([{ bearer: [] }])
    expect(documento.paths['/api/auth/login']?.post?.security).toBeUndefined()
    expect(Object.keys(cadastro?.responses ?? {})).toEqual(expect.arrayContaining(['201', '400', '401', '403', '409']))
  })

  it('a página navegável abre em /api/docs', async () => {
    const pagina = await request(ambiente.app).get('/api/docs/')
    expect(pagina.status).toBe(200)
    expect(pagina.text).toContain('swagger-ui')
  })
})

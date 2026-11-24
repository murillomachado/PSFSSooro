import { problemaSchema } from '@psfssooro/contracts'
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { type Caminhos, type Esquema, esquema } from './openapi.ts'

const DESCRICAO = [
  'API do SooroFit: usuários, autenticação e avaliações de IMC.',
  'Para chamar as rotas protegidas aqui mesmo: execute **POST /api/auth/login** (por exemplo, `michael.scott` / `senha1234`),',
  'copie o `token` da resposta e cole em **Authorize**.',
  'Todo erro volta como `application/problem+json` (RFC 9457).',
].join(' ')

/** O documento OpenAPI 3.1, reunindo o que cada módulo descreve das próprias rotas. */
export function documentoOpenApi(caminhosDosModulos: readonly Caminhos[]): Esquema {
  return {
    openapi: '3.1.0',
    info: { title: 'SooroFit API', version: '1.0.0', description: DESCRICAO },
    components: {
      securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: { Problema: esquema(problemaSchema) },
    },
    paths: Object.assign({}, ...caminhosDosModulos) as Caminhos,
  }
}

/** /api/docs: a página navegável (Swagger UI) e, em /api/docs/openapi.json, o documento em si. */
export function criarRotasDaDocumentacao(documento: Esquema): Router {
  const rotas = Router()
  rotas.get('/openapi.json', (_req, res) => {
    res.json(documento)
  })
  rotas.use('/', swaggerUi.serve, swaggerUi.setup(documento, { customSiteTitle: 'SooroFit API' }))
  return rotas
}

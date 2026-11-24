import cors from 'cors'
import express, { type Express, type RequestHandler, type Router } from 'express'
import helmet from 'helmet'
import { criarTratadorDeErros, rotaNaoEncontrada } from './shared/http/tratar-erros.ts'

export interface DependenciasDoApp {
  readonly origemCors: string
  readonly autenticar: RequestHandler
  readonly rotasDeAuth: Router
  readonly rotasDeUsuarios: Router
  readonly rotasDeAvaliacoes: Router
  /** A documentação navegável (OpenAPI), pública. */
  readonly rotasDaDocumentacao: Router
  readonly registrarErro: (erro: unknown) => void
}

/** Monta o Express a partir das dependências que recebe. Nos testes, o mesmo app roda com um banco em memória. */
export function criarApp(dependencias: DependenciasDoApp): Express {
  const app = express()
  app.use(helmet())
  app.use(cors({ origin: dependencias.origemCors }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.use('/api/docs', dependencias.rotasDaDocumentacao)
  app.use('/api/auth', dependencias.rotasDeAuth)
  app.use('/api/usuarios', dependencias.autenticar, dependencias.rotasDeUsuarios)

  app.use('/api/avaliacoes', dependencias.autenticar, dependencias.rotasDeAvaliacoes)

  app.use(rotaNaoEncontrada)
  app.use(criarTratadorDeErros(dependencias.registrarErro))
  return app
}

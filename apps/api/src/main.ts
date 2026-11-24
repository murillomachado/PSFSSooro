import { carregarEnv } from './config/env.ts'
import { montarApp } from './container.ts'
import { criarBanco } from './shared/database/data-source.ts'

const env = carregarEnv()
const banco = criarBanco(env.caminhoDoBanco)
await banco.initialize()

const servidor = montarApp(env, banco).listen(env.porta, () => {
  console.log(`API no ar em http://localhost:${env.porta}`)
})

function encerrar(): void {
  servidor.close(() => {
    void banco.destroy()
  })
}
process.on('SIGINT', encerrar)
process.on('SIGTERM', encerrar)

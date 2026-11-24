import process from 'node:process'
// Sobe a API compilada com um banco novo: apaga o arquivo, aplica as migrations, cria os usuários
// de demonstração e inicia o servidor. Usado só pelo playwright.config.ts.
import { spawn, spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const api = path.join(import.meta.dirname, '../api')
const banco = path.join(os.tmpdir(), 'psfssooro-e2e.sqlite')
rmSync(banco, { force: true })

const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: '3333',
  DATABASE_PATH: banco,
  JWT_SECRET: 'segredo-do-teste-e2e-com-mais-de-trinta-e-dois-caracteres',
  CORS_ORIGIN: 'http://localhost:3000',
}

for (const etapa of ['dist/bin/migrar.js', 'dist/bin/semear.js']) {
  const resultado = spawnSync(process.execPath, [etapa], { cwd: api, env, stdio: 'inherit' })
  if (resultado.status !== 0) process.exit(resultado.status ?? 1)
}
const servidor = spawn(process.execPath, ['dist/main.js'], { cwd: api, env, stdio: 'inherit' })
servidor.on('exit', (codigo) => process.exit(codigo ?? 0))
process.on('SIGTERM', () => servidor.kill('SIGTERM'))
process.on('SIGINT', () => servidor.kill('SIGINT'))

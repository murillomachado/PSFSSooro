import { carregarEnv } from '../config/env.ts'
import { criarBanco } from '../shared/database/data-source.ts'

const banco = criarBanco(carregarEnv().caminhoDoBanco)
await banco.initialize()
const aplicadas = await banco.runMigrations()
console.log(
  aplicadas.length === 0
    ? 'O banco já está atualizado.'
    : `Migrations aplicadas: ${aplicadas.map((migration) => migration.name).join(', ')}`,
)
await banco.destroy()

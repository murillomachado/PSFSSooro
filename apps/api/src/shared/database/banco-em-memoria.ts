import { criarBanco, type DataSource } from './data-source.ts'

/** Banco SQLite em memória com as migrations de verdade aplicadas. Usado pelos testes de integração. */
export async function criarBancoEmMemoria(): Promise<DataSource> {
  const banco = criarBanco(':memory:')
  await banco.initialize()
  await banco.runMigrations()
  return banco
}

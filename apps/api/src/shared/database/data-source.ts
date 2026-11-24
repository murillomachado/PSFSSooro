import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { AvaliacaoEntity } from '../../modules/avaliacoes/infra/avaliacao.entity.ts'
import { UsuarioEntity } from '../../modules/usuarios/infra/usuario.entity.ts'
import { CriarUsuarios1764200000000 } from './migrations/1764200000000-criar-usuarios.ts'
import { CriarAvaliacoes1764300000000 } from './migrations/1764300000000-criar-avaliacoes.ts'

export type { DataSource }

/**
 * Conexão com o SQLite. O `synchronize` fica desligado: o esquema só muda por migration, que é
 * versionada e pode ser desfeita. As chaves estrangeiras já vêm ligadas no better-sqlite3.
 */
export function criarBanco(caminho: string): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: caminho,
    entities: [UsuarioEntity, AvaliacaoEntity],
    migrations: [CriarUsuarios1764200000000, CriarAvaliacoes1764300000000],
    synchronize: false,
  })
}

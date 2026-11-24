import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CriarUsuarios1764200000000 implements MigrationInterface {
  name = 'CriarUsuarios1764200000000'

  async up(consulta: QueryRunner): Promise<void> {
    // O perfil é um conjunto fechado, por isso tem CHECK no banco. O nome de usuário é gravado em
    // minúsculas, então o índice único já impede "Ana" e "ana" de coexistirem.
    await consulta.query(`
      CREATE TABLE usuarios (
        id varchar PRIMARY KEY NOT NULL,
        nome varchar NOT NULL,
        usuario varchar NOT NULL,
        senha_hash varchar NOT NULL,
        perfil varchar NOT NULL CHECK (perfil IN ('ADMINISTRADOR', 'PROFESSOR', 'ALUNO')),
        ativo boolean NOT NULL DEFAULT (1),
        criado_em varchar NOT NULL,
        atualizado_em varchar NOT NULL
      )
    `)
    await consulta.query('CREATE UNIQUE INDEX ux_usuarios_usuario ON usuarios (usuario)')
  }

  async down(consulta: QueryRunner): Promise<void> {
    await consulta.query('DROP INDEX ux_usuarios_usuario')
    await consulta.query('DROP TABLE usuarios')
  }
}

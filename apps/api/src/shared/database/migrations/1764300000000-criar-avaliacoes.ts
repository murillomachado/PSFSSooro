import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CriarAvaliacoes1764300000000 implements MigrationInterface {
  name = 'CriarAvaliacoes1764300000000'

  async up(consulta: QueryRunner): Promise<void> {
    // ON DELETE RESTRICT: o banco recusa excluir um usuário que ainda tem avaliações (RN1), mesmo que
    // a checagem da aplicação falhe. Os CHECKs repetem os limites físicos da API.
    await consulta.query(`
      CREATE TABLE avaliacoes (
        id varchar PRIMARY KEY NOT NULL,
        aluno_id varchar NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
        professor_id varchar NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
        data_avaliacao varchar NOT NULL,
        altura_cm integer NOT NULL CHECK (altura_cm BETWEEN 50 AND 250),
        peso_g integer NOT NULL CHECK (peso_g BETWEEN 10000 AND 400000),
        imc_decimos integer NOT NULL CHECK (imc_decimos > 0),
        classificacao varchar NOT NULL,
        criado_em varchar NOT NULL,
        atualizado_em varchar NOT NULL
      )
    `)
    await consulta.query('CREATE INDEX ix_avaliacoes_aluno ON avaliacoes (aluno_id, data_avaliacao)')
    await consulta.query('CREATE INDEX ix_avaliacoes_professor ON avaliacoes (professor_id)')
  }

  async down(consulta: QueryRunner): Promise<void> {
    await consulta.query('DROP INDEX ix_avaliacoes_professor')
    await consulta.query('DROP INDEX ix_avaliacoes_aluno')
    await consulta.query('DROP TABLE avaliacoes')
  }
}

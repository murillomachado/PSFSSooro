import type { MigrationInterface, QueryRunner } from 'typeorm'

export class VincularAlunoAoProfessor1764400000000 implements MigrationInterface {
  name = 'VincularAlunoAoProfessor1764400000000'

  async up(consulta: QueryRunner): Promise<void> {
    // O professor responsável pelo aluno (RN6). Fica nulo para administradores e professores; a API
    // exige o vínculo em todo aluno novo. RESTRICT: o banco recusa excluir um professor que ainda tem alunos.
    await consulta.query(
      'ALTER TABLE usuarios ADD COLUMN professor_id varchar NULL REFERENCES usuarios (id) ON DELETE RESTRICT',
    )
    await consulta.query('CREATE INDEX ix_usuarios_professor ON usuarios (professor_id)')
  }

  async down(consulta: QueryRunner): Promise<void> {
    await consulta.query('DROP INDEX ix_usuarios_professor')
    await consulta.dropColumn('usuarios', 'professor_id')
  }
}

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { criarBanco, type DataSource } from './data-source.ts'

const TABELAS = "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('usuarios', 'avaliacoes')"

describe('migrations', () => {
  let banco: DataSource

  beforeEach(async () => {
    banco = criarBanco(':memory:')
    await banco.initialize()
  })
  afterEach(async () => {
    await banco.destroy()
  })

  it('sobem, descem e sobem de novo, com o banco sempre consistente', async () => {
    expect(await banco.runMigrations()).toHaveLength(3)
    expect(await banco.query(TABELAS)).toHaveLength(2)

    await banco.undoLastMigration()
    await banco.undoLastMigration()
    await banco.undoLastMigration()
    expect(await banco.query(TABELAS)).toHaveLength(0)

    expect(await banco.runMigrations()).toHaveLength(3)
    expect(await banco.query(TABELAS)).toHaveLength(2)
  })

  it('o banco recusa o que as regras não permitem: perfil inválido e usuário repetido', async () => {
    await banco.runMigrations()
    const inserir = (id: string, usuario: string, perfil: string): Promise<unknown> =>
      banco.query(
        'INSERT INTO usuarios (id, nome, usuario, senha_hash, perfil, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, 'Nome', usuario, 'hash', perfil, 'agora', 'agora'],
      )
    await inserir('1', 'ana', 'ALUNO')
    await expect(inserir('2', 'ana', 'ALUNO')).rejects.toThrow(/UNIQUE/)
    await expect(inserir('3', 'bia', 'DIRETOR')).rejects.toThrow(/CHECK/)
  })

  it('o professor responsável precisa existir, e não pode ser excluído enquanto tiver alunos (RN6)', async () => {
    await banco.runMigrations()
    const inserir = (id: string, perfil: string, professorId: string | null): Promise<unknown> =>
      banco.query(
        'INSERT INTO usuarios (id, nome, usuario, senha_hash, perfil, professor_id, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, 'Nome', `u${id}`, 'hash', perfil, professorId, 'agora', 'agora'],
      )
    await inserir('p', 'PROFESSOR', null)
    await inserir('a', 'ALUNO', 'p')
    await expect(inserir('b', 'ALUNO', 'inexistente')).rejects.toThrow(/FOREIGN KEY/)
    await expect(banco.query("DELETE FROM usuarios WHERE id = 'p'")).rejects.toThrow(/FOREIGN KEY/)
  })
})

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
    expect(await banco.runMigrations()).toHaveLength(4)
    expect(await banco.query(TABELAS)).toHaveLength(2)

    for (let i = 0; i < 4; i++) await banco.undoLastMigration()
    expect(await banco.query(TABELAS)).toHaveLength(0)

    expect(await banco.runMigrations()).toHaveLength(4)
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

  it('recalcula as avaliações já gravadas com o IMC truncado e a faixa do valor exato (D5)', async () => {
    await banco.runMigrations()
    await banco.undoLastMigration()
    const agora = "'agora'"
    await banco.query(
      `INSERT INTO usuarios (id, nome, usuario, senha_hash, perfil, criado_em, atualizado_em) VALUES
        ('a', 'Aluno', 'a', 'h', 'ALUNO', ${agora}, ${agora}), ('p', 'Prof', 'p', 'h', 'PROFESSOR', ${agora}, ${agora})`,
    )
    // Gravadas com a regra antiga (arredondar): 24,968 virava 25,0 Sobrepeso; 18,48 virava 18,5 Peso normal.
    const inserir = ([id, alturaCm, pesoG, imc, faixa]: readonly [
      string,
      number,
      number,
      number,
      string,
    ]): Promise<unknown> =>
      banco.query(
        'INSERT INTO avaliacoes (id, aluno_id, professor_id, data_avaliacao, altura_cm, peso_g, imc_decimos, classificacao, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, 'a', 'p', '2026-11-01', alturaCm, pesoG, imc, faixa, 'agora', 'agora'],
      )
    await inserir(['borda-alta', 179, 80_000, 250, 'SOBREPESO'])
    await inserir(['borda-baixa', 100, 18_480, 185, 'PESO_NORMAL'])
    await inserir(['meio', 175, 70_000, 229, 'PESO_NORMAL'])
    const gravadas = (): Promise<unknown> =>
      banco.query('SELECT id, imc_decimos AS imc, classificacao FROM avaliacoes ORDER BY id')

    await banco.runMigrations()
    expect(await gravadas()).toEqual([
      { id: 'borda-alta', imc: 249, classificacao: 'PESO_NORMAL' },
      { id: 'borda-baixa', imc: 184, classificacao: 'ABAIXO_DO_PESO' },
      { id: 'meio', imc: 228, classificacao: 'PESO_NORMAL' },
    ])

    await banco.undoLastMigration()
    expect(await gravadas()).toEqual([
      { id: 'borda-alta', imc: 250, classificacao: 'SOBREPESO' },
      { id: 'borda-baixa', imc: 185, classificacao: 'PESO_NORMAL' },
      { id: 'meio', imc: 229, classificacao: 'PESO_NORMAL' },
    ])
  })
})

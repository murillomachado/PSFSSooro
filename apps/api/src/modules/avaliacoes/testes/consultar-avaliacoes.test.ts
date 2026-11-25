import { describe, expect, it } from 'vitest'
import { ListarAvaliacoes, ObterAvaliacao } from '../application/consultar-avaliacoes.ts'
import { ADMIN, ANA, BRUNO, CARLA, PAULO, cenario, comoAna, comoCarla, comoPaulo, novaAvaliacao } from './apoio.ts'

const PAGINA = { pagina: 1, limite: 20 }

describe('consulta de avaliações', () => {
  const avaliacoes = [
    novaAvaliacao({ id: 'a1', alunoId: ANA.id, professorId: PAULO.id, dataAvaliacao: '2026-09-10' }),
    novaAvaliacao({ id: 'a2', alunoId: ANA.id, professorId: CARLA.id, dataAvaliacao: '2026-10-10' }),
    novaAvaliacao({ id: 'a3', alunoId: BRUNO.id, professorId: CARLA.id, dataAvaliacao: '2026-11-10' }),
  ]
  const montar = async () => {
    const { usuarios, avaliacoes: repositorio } = await cenario(...avaliacoes)
    return { listar: new ListarAvaliacoes(repositorio, usuarios), obter: new ObterAvaliacao(repositorio, usuarios) }
  }
  const ids = (pagina: { itens: readonly { avaliacao: { id: string } }[] }): string[] =>
    pagina.itens.map((item) => item.avaliacao.id)

  it('o administrador vê todas, da mais recente para a mais antiga, com os nomes (RF5, RN3)', async () => {
    const { listar } = await montar()
    const comoAdmin = await listar.executar(ADMIN, PAGINA)
    expect(ids(comoAdmin)).toEqual(['a3', 'a2', 'a1'])
    expect(comoAdmin.itens[0]).toMatchObject({ alunoNome: 'Bruno Lima', professorNome: 'Carla' })
  })

  it('o professor vê todas as avaliações dos seus alunos, inclusive as de colegas, e só elas (RN6)', async () => {
    const { listar } = await montar()
    // Ana é aluna de Paulo: a2 foi feita por Carla, mas é da evolução de Ana. Bruno é aluno de Carla.
    expect(ids(await listar.executar(comoPaulo, PAGINA))).toEqual(['a2', 'a1'])
    expect(ids(await listar.executar(comoCarla, PAGINA))).toEqual(['a3'])
  })

  it('o professor que filtra por um aluno de outro professor não recebe nada (RN6)', async () => {
    const { listar } = await montar()
    expect(await listar.executar(comoPaulo, { ...PAGINA, alunoId: BRUNO.id })).toMatchObject({ itens: [], total: 0 })
    expect(ids(await listar.executar(comoCarla, { ...PAGINA, professorId: CARLA.id }))).toEqual(['a3'])
  })

  it('filtra por aluno, por professor e por período, que se combinam (RF5)', async () => {
    const { listar } = await montar()
    expect(ids(await listar.executar(ADMIN, { ...PAGINA, alunoId: ANA.id }))).toEqual(['a2', 'a1'])
    expect(ids(await listar.executar(ADMIN, { ...PAGINA, professorId: CARLA.id }))).toEqual(['a3', 'a2'])
    expect(ids(await listar.executar(ADMIN, { ...PAGINA, de: '2026-10-01', ate: '2026-10-31' }))).toEqual(['a2'])
    expect(ids(await listar.executar(ADMIN, { ...PAGINA, alunoId: ANA.id, professorId: CARLA.id }))).toEqual(['a2'])
  })

  it('o aluno vê só as próprias avaliações, mesmo pedindo as de outro aluno (RN7)', async () => {
    const { listar } = await montar()
    expect(ids(await listar.executar(comoAna, PAGINA))).toEqual(['a2', 'a1'])
    expect(ids(await listar.executar(comoAna, { ...PAGINA, alunoId: BRUNO.id }))).toEqual(['a2', 'a1'])
  })

  it('pagina o resultado e informa o total', async () => {
    const { listar } = await montar()
    const segunda = await listar.executar(ADMIN, { pagina: 2, limite: 2 })
    expect(ids(segunda)).toEqual(['a1'])
    expect(segunda).toMatchObject({ total: 3, pagina: 2, limite: 2 })
  })

  it('obter devolve a avaliação; a de um aluno que não é seu é "não encontrada" (RN6, RN7)', async () => {
    const { obter } = await montar()
    expect((await obter.executar(comoPaulo, 'a2')).avaliacao.id).toBe('a2')
    await expect(obter.executar(comoPaulo, 'a3')).rejects.toMatchObject({ status: 404 })
    expect((await obter.executar(comoAna, 'a1')).alunoNome).toBe('Ana Souza')
    await expect(obter.executar(comoAna, 'a3')).rejects.toMatchObject({ status: 404 })
    await expect(obter.executar(ADMIN, 'nao-existe')).rejects.toMatchObject({ status: 404 })
  })
})

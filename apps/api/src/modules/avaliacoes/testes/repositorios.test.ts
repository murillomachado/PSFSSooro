import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { criarBancoEmMemoria } from '../../../shared/database/banco-em-memoria.ts'
import { TypeOrmUsuarioRepository } from '../../usuarios/infra/typeorm-usuario.repository.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import { MemoriaUsuarioRepository } from '../../usuarios/infra/memoria-usuario.repository.ts'
import type { AvaliacaoRepository } from '../application/avaliacao-repository.ts'
import { MemoriaAvaliacaoRepository } from '../infra/memoria-avaliacao.repository.ts'
import { TypeOrmAvaliacaoRepository } from '../infra/typeorm-avaliacao.repository.ts'
import { ANA, BRUNO, CARLA, PAULO, novaAvaliacao } from './apoio.ts'

interface Ambiente {
  readonly usuarios: UsuarioRepository
  readonly repositorio: AvaliacaoRepository
  readonly encerrar: () => Promise<void>
}

const emMemoria = (): Promise<Ambiente> =>
  Promise.resolve({
    usuarios: new MemoriaUsuarioRepository(),
    repositorio: new MemoriaAvaliacaoRepository(),
    encerrar: () => Promise.resolve(),
  })

const comTypeOrm = async (): Promise<Ambiente> => {
  const banco = await criarBancoEmMemoria()
  return {
    usuarios: new TypeOrmUsuarioRepository(banco),
    repositorio: new TypeOrmAvaliacaoRepository(banco),
    encerrar: () => banco.destroy(),
  }
}

// O mesmo contrato roda contra o repositório em memória e contra o do TypeORM com SQLite de verdade.
describe.each([
  ['em memória', emMemoria],
  ['TypeORM com SQLite', comTypeOrm],
])('contrato do AvaliacaoRepository: %s', (_nome, criar) => {
  let ambiente: Ambiente
  const repositorio = (): AvaliacaoRepository => ambiente.repositorio

  beforeEach(async () => {
    ambiente = await criar()
    for (const usuario of [PAULO, CARLA, ANA, BRUNO]) await ambiente.usuarios.salvar(usuario)
  })
  afterEach(async () => {
    await ambiente.encerrar()
  })

  it('guarda uma avaliação, a acha pelo id e a atualiza em vez de duplicar', async () => {
    const avaliacao = novaAvaliacao({ id: 'a1' })
    await repositorio().salvar(avaliacao)
    expect(await repositorio().buscarPorId('a1')).toEqual(avaliacao)
    await repositorio().salvar(novaAvaliacao({ id: 'a1', pesoG: 90_000 }))
    expect(await repositorio().buscarPorId('a1')).toMatchObject({ pesoG: 90_000, imcEmDecimos: 294 })
    expect((await repositorio().listar({ pagina: 1, limite: 10 })).total).toBe(1)
    expect(await repositorio().buscarPorId('inexistente')).toBeUndefined()
  })

  it('exclui só a avaliação pedida', async () => {
    await repositorio().salvar(novaAvaliacao({ id: 'a1' }))
    await repositorio().salvar(novaAvaliacao({ id: 'a2' }))
    await repositorio().excluir('a1')
    expect(await repositorio().buscarPorId('a1')).toBeUndefined()
    expect(await repositorio().buscarPorId('a2')).toBeDefined()
  })

  it('informa se um usuário aparece em alguma avaliação, como aluno ou como professor', async () => {
    await repositorio().salvar(novaAvaliacao({ alunoId: ANA.id, professorId: PAULO.id }))
    expect(await repositorio().usuarioPossuiAvaliacoes(ANA.id)).toBe(true)
    expect(await repositorio().usuarioPossuiAvaliacoes(PAULO.id)).toBe(true)
    expect(await repositorio().usuarioPossuiAvaliacoes(BRUNO.id)).toBe(false)
    expect(await repositorio().usuarioPossuiAvaliacoes(CARLA.id)).toBe(false)
  })

  describe('listar', () => {
    beforeEach(async () => {
      await repositorio().salvar(
        novaAvaliacao({ id: 'a1', alunoId: ANA.id, professorId: PAULO.id, dataAvaliacao: '2026-09-10' }),
      )
      await repositorio().salvar(
        novaAvaliacao({ id: 'a2', alunoId: ANA.id, professorId: CARLA.id, dataAvaliacao: '2026-10-10' }),
      )
      await repositorio().salvar(
        novaAvaliacao({ id: 'a3', alunoId: BRUNO.id, professorId: CARLA.id, dataAvaliacao: '2026-10-10' }),
      )
    })
    const ids = async (filtros = {}): Promise<string[]> => {
      const pagina = await repositorio().listar({ pagina: 1, limite: 10, ...filtros })
      return pagina.itens.map((avaliacao) => avaliacao.id)
    }

    it('ordena da data mais recente para a mais antiga, com desempate estável pelo id', async () => {
      expect(await ids()).toEqual(['a2', 'a3', 'a1'])
    })

    it('filtra por aluno, por professor e por período inclusivo', async () => {
      expect(await ids({ alunoId: ANA.id })).toEqual(['a2', 'a1'])
      expect(await ids({ professorId: CARLA.id })).toEqual(['a2', 'a3'])
      expect(await ids({ de: '2026-10-10' })).toEqual(['a2', 'a3'])
      expect(await ids({ ate: '2026-09-10' })).toEqual(['a1'])
      expect(await ids({ alunoId: ANA.id, de: '2026-09-10', ate: '2026-09-30' })).toEqual(['a1'])
    })

    it('restringe a uma lista de alunos (os de um professor); lista vazia não devolve nada', async () => {
      expect(await ids({ alunoIds: [BRUNO.id] })).toEqual(['a3'])
      expect(await ids({ alunoIds: [ANA.id, BRUNO.id], professorId: PAULO.id })).toEqual(['a1'])
      expect(await ids({ alunoIds: [] })).toEqual([])
    })

    it('pagina, com o total do conjunto filtrado', async () => {
      const segunda = await repositorio().listar({ pagina: 2, limite: 2 })
      expect(segunda.itens.map((avaliacao) => avaliacao.id)).toEqual(['a1'])
      expect(segunda).toMatchObject({ total: 3, pagina: 2, limite: 2 })
    })
  })
})

describe('integridade do banco (RN1)', () => {
  it('o SQLite recusa excluir um usuário que tem avaliação, mesmo se a aplicação falhasse', async () => {
    const ambiente = await comTypeOrm()
    await ambiente.usuarios.salvar(PAULO)
    await ambiente.usuarios.salvar(ANA)
    await ambiente.repositorio.salvar(novaAvaliacao())
    await expect(ambiente.usuarios.excluir(ANA.id)).rejects.toMatchObject({
      status: 409,
      codigo: 'USUARIO_COM_AVALIACOES',
    })
    await ambiente.encerrar()
  })
})

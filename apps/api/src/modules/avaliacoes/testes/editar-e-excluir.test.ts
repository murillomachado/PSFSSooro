import { describe, expect, it } from 'vitest'
import { EditarAvaliacao } from '../application/editar-avaliacao.ts'
import { ExcluirAvaliacao } from '../application/excluir-avaliacao.ts'
import {
  ADMIN,
  ANA,
  BRUNO,
  CARLA,
  PAULO,
  cenario,
  comoAna,
  comoCarla,
  comoPaulo,
  novaAvaliacao,
  relogioFixo,
} from './apoio.ts'

const DEPOIS = '2026-11-26T09:30:00.000Z'

describe('EditarAvaliacao', () => {
  const existente = novaAvaliacao({ id: 'av-1' })
  const montar = async () => {
    const { usuarios, avaliacoes } = await cenario(existente)
    return { usuarios, avaliacoes, editar: new EditarAvaliacao(avaliacoes, usuarios, relogioFixo(DEPOIS)) }
  }

  it('o professor corrige a própria avaliação e o IMC é recalculado (RN5)', async () => {
    const { editar, avaliacoes } = await montar()
    const resultado = await editar.executar(comoPaulo, 'av-1', { pesoKg: 90 })
    expect(resultado.avaliacao).toMatchObject({ pesoG: 90_000, imcEmDecimos: 293, classificacao: 'SOBREPESO' })
    expect(resultado.avaliacao.atualizadoEm).toBe(DEPOIS)
    expect(resultado.avaliacao.criadoEm).toBe(existente.criadoEm)
    expect(await avaliacoes.buscarPorId('av-1')).toEqual(resultado.avaliacao)
  })

  it('o professor vê, mas não edita, a avaliação que um colega fez num aluno seu (403, e não 404)', async () => {
    const { editar, avaliacoes } = await montar()
    await avaliacoes.salvar(novaAvaliacao({ id: 'av-carla', alunoId: ANA.id, professorId: CARLA.id }))
    await expect(editar.executar(comoPaulo, 'av-carla', { pesoKg: 80 })).rejects.toMatchObject({
      status: 403,
      codigo: 'AVALIACAO_DE_OUTRO_PROFESSOR',
    })
  })

  it('a avaliação de um aluno que não é seu nem aparece para o professor (404, RN6)', async () => {
    const { editar } = await montar()
    await expect(editar.executar(comoCarla, 'av-1', { pesoKg: 80 })).rejects.toMatchObject({ status: 404 })
  })

  it('o administrador edita qualquer avaliação, inclusive trocando aluno e avaliador (RN2)', async () => {
    const { editar } = await montar()
    const resultado = await editar.executar(ADMIN, 'av-1', { alunoId: BRUNO.id, professorId: CARLA.id })
    expect(resultado.avaliacao).toMatchObject({ alunoId: BRUNO.id, professorId: CARLA.id })
  })

  it('o professor não troca o aluno nem o avaliador da avaliação (403)', async () => {
    const { editar } = await montar()
    await expect(editar.executar(comoPaulo, 'av-1', { alunoId: BRUNO.id })).rejects.toMatchObject({ status: 403 })
    await expect(editar.executar(comoPaulo, 'av-1', { professorId: CARLA.id })).rejects.toMatchObject({ status: 403 })
  })

  it('o aluno não edita, e a avaliação de outro aluno nem aparece para ele (404)', async () => {
    const { editar } = await montar()
    await expect(editar.executar(comoAna, 'av-1', { pesoKg: 60 })).rejects.toMatchObject({ status: 403 })
    const deBruno = novaAvaliacao({ id: 'av-2', alunoId: BRUNO.id })
    const outro = await cenario(deBruno)
    const editarOutro = new EditarAvaliacao(outro.avaliacoes, outro.usuarios, relogioFixo(DEPOIS))
    await expect(editarOutro.executar(comoAna, 'av-2', { pesoKg: 60 })).rejects.toMatchObject({ status: 404 })
  })

  it('recusa data futura na correção', async () => {
    const { editar } = await montar()
    await expect(editar.executar(comoPaulo, 'av-1', { dataAvaliacao: '2026-12-31' })).rejects.toMatchObject({
      status: 422,
    })
  })

  it('corrigir avaliação de quem foi inativado depois é permitido; trocar para um inativo, não (D6)', async () => {
    const { editar, usuarios } = await montar()
    await usuarios.salvar({ ...ANA, ativo: false })
    expect((await editar.executar(comoPaulo, 'av-1', { pesoKg: 70 })).avaliacao.pesoG).toBe(70_000)
    await usuarios.salvar({ ...BRUNO, ativo: false })
    await expect(editar.executar(ADMIN, 'av-1', { alunoId: BRUNO.id })).rejects.toMatchObject({
      status: 422,
      codigo: 'ALUNO_INATIVO',
    })
    // Trocar só o professor não reexige que o aluno, já inativo, esteja ativo: o vínculo com ele não é novo.
    expect((await editar.executar(ADMIN, 'av-1', { professorId: CARLA.id })).avaliacao.professorId).toBe(CARLA.id)
  })

  it('responde "não encontrada" para uma avaliação que não existe', async () => {
    const { editar } = await montar()
    await expect(editar.executar(ADMIN, 'nao-existe', { pesoKg: 70 })).rejects.toMatchObject({ status: 404 })
  })
})

describe('ExcluirAvaliacao', () => {
  it('só o administrador exclui (RN2)', async () => {
    const { usuarios, avaliacoes } = await cenario(novaAvaliacao({ id: 'av-1', professorId: PAULO.id }))
    const excluir = new ExcluirAvaliacao(avaliacoes, usuarios)
    await expect(excluir.executar(comoPaulo, 'av-1')).rejects.toMatchObject({ status: 403 })
    await expect(excluir.executar(comoAna, 'av-1')).rejects.toMatchObject({ status: 403 })
    await excluir.executar(ADMIN, 'av-1')
    expect(await avaliacoes.buscarPorId('av-1')).toBeUndefined()
    await expect(excluir.executar(ADMIN, 'av-1')).rejects.toMatchObject({ status: 404 })
  })
})

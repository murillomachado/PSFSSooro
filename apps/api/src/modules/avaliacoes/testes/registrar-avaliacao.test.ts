import { describe, expect, it } from 'vitest'
import { RegistrarAvaliacao } from '../application/registrar-avaliacao.ts'
import { ADMIN, ANA, AGORA, BRUNO, CARLA, PAULO, cenario, comoAna, comoPaulo, relogioFixo } from './apoio.ts'

const entrada = { alunoId: ANA.id, dataAvaliacao: '2026-11-20', alturaM: 1.75, pesoKg: 72 }

describe('RegistrarAvaliacao', () => {
  const montar = async () => {
    const { usuarios, avaliacoes } = await cenario()
    const registrar = new RegistrarAvaliacao(avaliacoes, usuarios, relogioFixo(AGORA), () => 'av-1')
    return { usuarios, avaliacoes, registrar }
  }

  it('o professor registra a avaliação em nome dele, e a API calcula o IMC e a classificação (RF3, RF4)', async () => {
    const { registrar, avaliacoes } = await montar()
    const resultado = await registrar.executar(comoPaulo, entrada)
    expect(resultado.professorNome).toBe('Paulo')
    expect(resultado.avaliacao).toMatchObject({
      professorId: PAULO.id,
      alturaCm: 175,
      pesoG: 72_000,
      imcEmDecimos: 235,
      classificacao: 'PESO_NORMAL',
    })
    expect(await avaliacoes.buscarPorId('av-1')).toEqual(resultado.avaliacao)
  })

  it('o professor não registra em nome de outro professor (403)', async () => {
    const { registrar } = await montar()
    await expect(registrar.executar(comoPaulo, { ...entrada, professorId: CARLA.id })).rejects.toMatchObject({
      status: 403,
    })
  })

  it('o administrador escolhe o professor avaliador, e precisa informar qual', async () => {
    const { registrar } = await montar()
    expect((await registrar.executar(ADMIN, { ...entrada, professorId: CARLA.id })).avaliacao.professorId).toBe(
      CARLA.id,
    )
    await expect(registrar.executar(ADMIN, entrada)).rejects.toMatchObject({ status: 400 })
  })

  it('o aluno não registra avaliações (403)', async () => {
    const { registrar } = await montar()
    await expect(registrar.executar(comoAna, entrada)).rejects.toMatchObject({ status: 403 })
  })

  it('recusa data futura, mas aceita o dia de hoje', async () => {
    const { registrar } = await montar()
    await expect(registrar.executar(comoPaulo, { ...entrada, dataAvaliacao: '2026-11-26' })).rejects.toMatchObject({
      status: 422,
      codigo: 'DATA_FUTURA',
    })
    const hoje = await registrar.executar(comoPaulo, { ...entrada, dataAvaliacao: AGORA.slice(0, 10) })
    expect(hoje.avaliacao.dataAvaliacao).toBe(AGORA.slice(0, 10))
  })

  it('exige aluno e professor existentes, com o perfil certo', async () => {
    const { registrar } = await montar()
    await expect(registrar.executar(comoPaulo, { ...entrada, alunoId: 'nao-existe' })).rejects.toMatchObject({
      status: 404,
      codigo: 'ALUNO_NAO_ENCONTRADO',
    })
    await expect(registrar.executar(comoPaulo, { ...entrada, alunoId: PAULO.id })).rejects.toMatchObject({
      status: 404,
    })
    await expect(registrar.executar(ADMIN, { ...entrada, professorId: BRUNO.id })).rejects.toMatchObject({
      status: 404,
      codigo: 'PROFESSOR_NAO_ENCONTRADO',
    })
  })

  it('não registra para aluno ou professor inativo (422)', async () => {
    const { registrar, usuarios } = await montar()
    await usuarios.salvar({ ...ANA, ativo: false })
    await expect(registrar.executar(comoPaulo, entrada)).rejects.toMatchObject({ status: 422, codigo: 'ALUNO_INATIVO' })
    await usuarios.salvar({ ...ANA, ativo: true })
    await usuarios.salvar({ ...CARLA, ativo: false })
    await expect(registrar.executar(ADMIN, { ...entrada, professorId: CARLA.id })).rejects.toMatchObject({
      status: 422,
      codigo: 'PROFESSOR_INATIVO',
    })
  })
})

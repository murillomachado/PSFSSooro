import { describe, expect, it } from 'vitest'
import { AlterarSituacao } from '../application/alterar-situacao.ts'
import { ADMIN, ALUNO, DEPOIS, PROFESSOR, administrador, novoUsuario, relogioFixo, repositorioCom } from './apoio.ts'

describe('AlterarSituacao (RF2)', () => {
  const ana = novoUsuario({ usuario: 'aluno.ana' })

  const montar = async () => {
    const repositorio = await repositorioCom(administrador(), ana)
    return { repositorio, alterar: new AlterarSituacao(repositorio, relogioFixo(DEPOIS)) }
  }

  it('o administrador inativa e reativa um usuário', async () => {
    const { repositorio, alterar } = await montar()
    const inativo = await alterar.executar(ADMIN, ana.id, false)
    expect(inativo).toMatchObject({ ativo: false, atualizadoEm: DEPOIS })
    expect(await repositorio.buscarPorId(ana.id)).toEqual(inativo)
    expect((await alterar.executar(ADMIN, ana.id, true)).ativo).toBe(true)
  })

  it('só o administrador muda a situação: o professor e o aluno recebem 403', async () => {
    const { alterar } = await montar()
    await expect(alterar.executar(PROFESSOR, ana.id, false)).rejects.toMatchObject({ status: 403 })
    await expect(alterar.executar(ALUNO, ana.id, false)).rejects.toMatchObject({ status: 403 })
  })

  it('o administrador não inativa a si mesmo, o que deixaria o sistema sem administrador', async () => {
    const { alterar } = await montar()
    await expect(alterar.executar(ADMIN, ADMIN.id, false)).rejects.toMatchObject({
      status: 422,
      codigo: 'NAO_INATIVAR_A_SI_MESMO',
    })
  })

  it('responde "não encontrado" para um usuário que não existe', async () => {
    const { alterar } = await montar()
    await expect(alterar.executar(ADMIN, 'inexistente', false)).rejects.toMatchObject({ status: 404 })
  })
})

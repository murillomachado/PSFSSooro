import { describe, expect, it } from 'vitest'
import { ExcluirUsuario } from '../application/excluir-usuario.ts'
import { ADMIN, PROFESSOR, administrador, novoUsuario, repositorioCom, semVinculos } from './apoio.ts'

describe('ExcluirUsuario', () => {
  const ana = novoUsuario({ usuario: 'aluno.ana' })
  const comAvaliacoes = { possuiAvaliacoes: (id: string) => Promise.resolve(id === ana.id) }

  it('o administrador exclui um usuário sem avaliações (RN1)', async () => {
    const usuarios = await repositorioCom(administrador(), ana)
    await new ExcluirUsuario(usuarios, semVinculos).executar(ADMIN, ana.id)
    expect(await usuarios.buscarPorId(ana.id)).toBeUndefined()
  })

  it('recusa excluir quem tem avaliações vinculadas e sugere inativar (409)', async () => {
    const usuarios = await repositorioCom(administrador(), ana)
    await expect(new ExcluirUsuario(usuarios, comAvaliacoes).executar(ADMIN, ana.id)).rejects.toMatchObject({
      status: 409,
      codigo: 'USUARIO_COM_AVALIACOES',
    })
    expect(await usuarios.buscarPorId(ana.id)).toBeDefined()
  })

  it('só o administrador exclui, e ele não exclui a si mesmo', async () => {
    const usuarios = await repositorioCom(administrador(), ana)
    const excluir = new ExcluirUsuario(usuarios, semVinculos)
    await expect(excluir.executar(PROFESSOR, ana.id)).rejects.toMatchObject({ status: 403 })
    await expect(excluir.executar(ADMIN, ADMIN.id)).rejects.toMatchObject({ status: 422 })
    await expect(excluir.executar(ADMIN, 'nao-existe')).rejects.toMatchObject({ status: 404 })
  })
})

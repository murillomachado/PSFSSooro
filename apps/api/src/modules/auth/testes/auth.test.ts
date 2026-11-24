import { describe, expect, it, vi } from 'vitest'
import { hasherFalso, novoUsuario, repositorioCom } from '../../usuarios/testes/apoio.ts'
import { AutenticarUsuario } from '../application/autenticar-usuario.ts'
import { ObterSessao } from '../application/obter-sessao.ts'

const tokens = { gerar: (usuarioId: string) => `token-de-${usuarioId}` }
const ana = novoUsuario({ usuario: 'aluno.ana' })
const inativo = novoUsuario({ usuario: 'aluno.inativo', ativo: false })

describe('AutenticarUsuario (RF6, RN8)', () => {
  const montar = async () => {
    const hasher = {
      ...hasherFalso,
      conferir: vi.fn((senha: string, hash: string) => hasherFalso.conferir(senha, hash)),
    }
    const repositorio = await repositorioCom(ana, inativo)
    return { hasher, autenticar: new AutenticarUsuario(repositorio, hasher, tokens) }
  }

  it('devolve o token e o usuário quando a senha confere', async () => {
    const { autenticar } = await montar()
    expect(await autenticar.executar({ usuario: 'aluno.ana', senha: 'senha1234' })).toEqual({
      token: `token-de-${ana.id}`,
      usuario: ana,
    })
  })

  it('responde igual para senha errada e para usuário inexistente, e confere uma senha nos dois casos', async () => {
    const { hasher, autenticar } = await montar()
    const erroEsperado = { status: 401, codigo: 'CREDENCIAIS_INVALIDAS' }
    await expect(autenticar.executar({ usuario: 'aluno.ana', senha: 'errada123' })).rejects.toMatchObject(erroEsperado)
    await expect(autenticar.executar({ usuario: 'ninguem', senha: 'senha1234' })).rejects.toMatchObject(erroEsperado)
    // Conferir contra um hash falso mantém o tempo de resposta igual: ninguém descobre quem tem conta.
    expect(hasher.conferir).toHaveBeenCalledTimes(2)
  })

  it('recusa o usuário inativo, mas só diz que ele está inativo a quem acertou a senha', async () => {
    const { autenticar } = await montar()
    await expect(autenticar.executar({ usuario: 'aluno.inativo', senha: 'senha1234' })).rejects.toMatchObject({
      status: 403,
      codigo: 'USUARIO_INATIVO',
    })
    await expect(autenticar.executar({ usuario: 'aluno.inativo', senha: 'errada123' })).rejects.toMatchObject({
      status: 401,
    })
  })
})

describe('ObterSessao', () => {
  const sessao = async () => new ObterSessao(await repositorioCom(ana, inativo))

  it('devolve o usuário logado', async () => {
    expect(await (await sessao()).executar({ id: ana.id, perfil: 'ALUNO' })).toEqual(ana)
  })

  it('recusa quem não existe mais ou foi inativado', async () => {
    const obter = await sessao()
    await expect(obter.executar({ id: 'inexistente', perfil: 'ALUNO' })).rejects.toMatchObject({ status: 401 })
    await expect(obter.executar({ id: inativo.id, perfil: 'ALUNO' })).rejects.toMatchObject({ status: 401 })
  })
})

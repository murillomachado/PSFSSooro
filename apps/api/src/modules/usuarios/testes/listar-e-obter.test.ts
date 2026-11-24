import { describe, expect, it } from 'vitest'
import { ListarUsuarios } from '../application/listar-usuarios.ts'
import { ObterUsuario } from '../application/obter-usuario.ts'
import { ADMIN, ALUNO, PROFESSOR, administrador, novoUsuario, repositorioCom } from './apoio.ts'

const ana = novoUsuario({ nome: 'Ana', usuario: 'aluno.ana' })
const bruno = novoUsuario({ nome: 'Bruno', usuario: 'aluno.bruno', ativo: false })
const carla = novoUsuario({ nome: 'Carla', usuario: 'prof.carla', perfil: 'PROFESSOR' })
const consulta = { pagina: 1, limite: 20 }

const cenario = async (): Promise<Awaited<ReturnType<typeof repositorioCom>>> =>
  repositorioCom(administrador(), carla, ana, bruno)

describe('ListarUsuarios', () => {
  it('o administrador vê todos os perfis', async () => {
    const pagina = await new ListarUsuarios(await cenario()).executar(ADMIN, consulta)
    expect(pagina.itens.map((u) => u.nome)).toEqual(['Administrador', 'Ana', 'Bruno', 'Carla'])
  })

  it('o professor vê só alunos (RN4), mesmo que peça outro perfil', async () => {
    const listar = new ListarUsuarios(await cenario())
    expect((await listar.executar(PROFESSOR, consulta)).itens.map((u) => u.nome)).toEqual(['Ana', 'Bruno'])
    const pedindoProfessores = await listar.executar(PROFESSOR, { ...consulta, perfil: 'PROFESSOR' })
    expect(pedindoProfessores).toEqual({ itens: [], total: 0, pagina: 1, limite: 20 })
  })

  it('o aluno não enxerga ninguém', async () => {
    const pagina = await new ListarUsuarios(await cenario()).executar(ALUNO, consulta)
    expect(pagina.total).toBe(0)
  })

  it('aplica os filtros de perfil, situação e busca', async () => {
    const listar = new ListarUsuarios(await cenario())
    expect((await listar.executar(ADMIN, { ...consulta, perfil: 'PROFESSOR' })).itens).toHaveLength(1)
    expect((await listar.executar(ADMIN, { ...consulta, ativo: false })).itens.map((u) => u.nome)).toEqual(['Bruno'])
    expect((await listar.executar(ADMIN, { ...consulta, busca: 'carl' })).itens.map((u) => u.nome)).toEqual(['Carla'])
  })
})

describe('ObterUsuario', () => {
  it('o administrador vê qualquer usuário, e o professor vê um aluno', async () => {
    const obter = new ObterUsuario(await cenario())
    expect(await obter.executar(ADMIN, carla.id)).toEqual(carla)
    expect(await obter.executar(PROFESSOR, ana.id)).toEqual(ana)
  })

  it('responde "não encontrado", e não "sem permissão", para quem o ator não pode ver', async () => {
    const obter = new ObterUsuario(await cenario())
    await expect(obter.executar(PROFESSOR, carla.id)).rejects.toMatchObject({ status: 404 })
    await expect(obter.executar(PROFESSOR, ADMIN.id)).rejects.toMatchObject({ status: 404 })
    await expect(obter.executar(ALUNO, ana.id)).rejects.toMatchObject({ status: 404 })
  })

  it('responde "não encontrado" para um id que não existe, igual ao caso anterior', async () => {
    await expect(new ObterUsuario(await cenario()).executar(ADMIN, 'inexistente')).rejects.toMatchObject({
      status: 404,
      codigo: 'USUARIO_NAO_ENCONTRADO',
    })
  })
})

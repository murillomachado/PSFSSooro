import { describe, expect, it } from 'vitest'
import { CriarUsuario } from '../application/criar-usuario.ts'
import { EditarUsuario } from '../application/editar-usuario.ts'
import {
  ADMIN,
  AGORA,
  DEPOIS,
  PROFESSOR,
  administrador,
  hasherFalso,
  novoUsuario,
  relogioFixo,
  repositorioCom,
} from './apoio.ts'

const cadastro = { nome: 'Bruno Lima', usuario: 'aluno.bruno', senha: 'senha1234', perfil: 'ALUNO' as const }

describe('CriarUsuario', () => {
  const montar = async (...existentes: Parameters<typeof repositorioCom>) => {
    const repositorio = await repositorioCom(...existentes)
    return { repositorio, criar: new CriarUsuario(repositorio, hasherFalso, relogioFixo(), () => 'novo-id') }
  }

  it('o administrador cadastra qualquer perfil; o usuário nasce ativo e a senha é guardada só como hash', async () => {
    const { repositorio, criar } = await montar()
    const usuario = await criar.executar(ADMIN, { ...cadastro, perfil: 'PROFESSOR' })
    expect(usuario).toEqual({
      id: 'novo-id',
      nome: 'Bruno Lima',
      usuario: 'aluno.bruno',
      senhaHash: 'hash(senha1234)',
      perfil: 'PROFESSOR',
      ativo: true,
      criadoEm: AGORA,
      atualizadoEm: AGORA,
    })
    expect(await repositorio.buscarPorId('novo-id')).toEqual(usuario)
  })

  it('o professor cadastra alunos (RN4), mas não outros perfis', async () => {
    const { criar } = await montar()
    expect((await criar.executar(PROFESSOR, cadastro)).perfil).toBe('ALUNO')
    await expect(criar.executar(PROFESSOR, { ...cadastro, perfil: 'PROFESSOR' })).rejects.toMatchObject({ status: 403 })
    await expect(criar.executar(PROFESSOR, { ...cadastro, perfil: 'ADMINISTRADOR' })).rejects.toMatchObject({
      status: 403,
    })
  })

  it('recusa um nome de usuário que já existe', async () => {
    const { criar } = await montar(novoUsuario({ usuario: 'aluno.bruno' }))
    await expect(criar.executar(ADMIN, cadastro)).rejects.toMatchObject({ status: 409, codigo: 'USUARIO_JA_EXISTE' })
  })
})

describe('EditarUsuario', () => {
  const ana = novoUsuario({ nome: 'Ana', usuario: 'aluno.ana' })
  const carla = novoUsuario({ nome: 'Carla', usuario: 'prof.carla', perfil: 'PROFESSOR' })

  const montar = async (...existentes: Parameters<typeof repositorioCom>) => {
    const repositorio = await repositorioCom(...existentes)
    return { repositorio, editar: new EditarUsuario(repositorio, hasherFalso, relogioFixo(DEPOIS)) }
  }

  it('altera só o que foi informado e atualiza a data de alteração', async () => {
    const { repositorio, editar } = await montar(ana)
    const editado = await editar.executar(ADMIN, ana.id, { nome: 'Ana Maria' })
    expect(editado).toEqual({ ...ana, nome: 'Ana Maria', atualizadoEm: DEPOIS })
    expect(await repositorio.buscarPorId(ana.id)).toEqual(editado)
  })

  it('troca a senha só quando uma nova é informada', async () => {
    const { editar } = await montar(ana)
    expect((await editar.executar(ADMIN, ana.id, { senha: 'outrasenha1' })).senhaHash).toBe('hash(outrasenha1)')
    expect((await editar.executar(ADMIN, ana.id, { nome: 'Ana Souza' })).senhaHash).toBe('hash(outrasenha1)')
  })

  it('o professor corrige os dados de um aluno (RN4), mas não troca o perfil nem edita outro professor', async () => {
    const { editar } = await montar(ana, carla)
    expect((await editar.executar(PROFESSOR, ana.id, { nome: 'Ana Maria' })).nome).toBe('Ana Maria')
    await expect(editar.executar(PROFESSOR, ana.id, { perfil: 'PROFESSOR' })).rejects.toMatchObject({ status: 403 })
    await expect(editar.executar(PROFESSOR, carla.id, { nome: 'Outro' })).rejects.toMatchObject({ status: 404 })
  })

  it('recusa trocar o nome de usuário por um que já existe, mas aceita repetir o próprio', async () => {
    const { editar } = await montar(ana, carla)
    await expect(editar.executar(ADMIN, ana.id, { usuario: 'prof.carla' })).rejects.toMatchObject({ status: 409 })
    expect((await editar.executar(ADMIN, ana.id, { usuario: 'aluno.ana' })).usuario).toBe('aluno.ana')
  })

  it('o administrador troca o perfil de um usuário', async () => {
    const { editar } = await montar(administrador(), ana)
    expect((await editar.executar(ADMIN, ana.id, { perfil: 'PROFESSOR' })).perfil).toBe('PROFESSOR')
  })

  it('o último administrador ativo não pode mudar de perfil, mas pode se houver outro', async () => {
    const { editar } = await montar(administrador())
    await expect(editar.executar(ADMIN, ADMIN.id, { perfil: 'PROFESSOR' })).rejects.toMatchObject({
      status: 422,
      codigo: 'ULTIMO_ADMINISTRADOR',
    })
    const comOutro = await montar(administrador(), administrador({ id: 'admin-2', usuario: 'admin2' }))
    expect((await comOutro.editar.executar(ADMIN, ADMIN.id, { perfil: 'PROFESSOR' })).perfil).toBe('PROFESSOR')
  })

  it('responde "não encontrado" para um usuário que não existe', async () => {
    const { editar } = await montar()
    await expect(editar.executar(ADMIN, 'inexistente', { nome: 'X' })).rejects.toMatchObject({ status: 404 })
  })
})

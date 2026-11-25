import { describe, expect, it } from 'vitest'
import { CriarUsuario } from '../application/criar-usuario.ts'
import { EditarUsuario } from '../application/editar-usuario.ts'
import { ExcluirUsuario } from '../application/excluir-usuario.ts'
import { ListarUsuarios } from '../application/listar-usuarios.ts'
import { ObterUsuario } from '../application/obter-usuario.ts'
import {
  ADMIN,
  PROFESSOR,
  administrador,
  hasherFalso,
  novoUsuario,
  relogioFixo,
  repositorioCom,
  semVinculos,
} from './apoio.ts'

// Cada aluno tem um professor responsável (RN6): é quem o vê, o edita e o avalia.
const paulo = novoUsuario({ id: PROFESSOR.id, nome: 'Paulo', usuario: 'prof.paulo', perfil: 'PROFESSOR' })
const carla = novoUsuario({ id: 'professor-2', nome: 'Carla', usuario: 'prof.carla', perfil: 'PROFESSOR' })
const inativo = novoUsuario({ id: 'professor-3', nome: 'Inativo', usuario: 'prof.inativo', perfil: 'PROFESSOR' })
const ana = novoUsuario({ nome: 'Ana', usuario: 'aluno.ana', professorId: paulo.id })
const bruno = novoUsuario({ nome: 'Bruno', usuario: 'aluno.bruno', professorId: carla.id })
const COMO_CARLA = { id: carla.id, perfil: 'PROFESSOR' } as const
const cadastro = { nome: 'Davi', usuario: 'aluno.davi', senha: 'senha1234', perfil: 'ALUNO' as const }

const montar = async () => {
  const usuarios = await repositorioCom(administrador(), paulo, carla, { ...inativo, ativo: false }, ana, bruno)
  return {
    usuarios,
    criar: new CriarUsuario(usuarios, hasherFalso, relogioFixo(), () => 'novo-id'),
    editar: new EditarUsuario(usuarios, hasherFalso, relogioFixo(), semVinculos),
    excluir: new ExcluirUsuario(usuarios, semVinculos),
    listar: new ListarUsuarios(usuarios),
    obter: new ObterUsuario(usuarios),
  }
}

describe('professor responsável pelo aluno (RN6)', () => {
  it('o professor que cadastra um aluno é o responsável, e não escolhe outro (403)', async () => {
    const { criar } = await montar()
    expect((await criar.executar(PROFESSOR, cadastro)).professorId).toBe(paulo.id)
    await expect(criar.executar(PROFESSOR, { ...cadastro, professorId: carla.id })).rejects.toMatchObject({
      status: 403,
      codigo: 'RESPONSAVEL_NAO_PERMITIDO',
    })
  })

  it('o administrador escolhe o responsável de todo aluno, que precisa ser um professor ativo', async () => {
    const { criar } = await montar()
    await expect(criar.executar(ADMIN, cadastro)).rejects.toMatchObject({ status: 400 })
    await expect(criar.executar(ADMIN, { ...cadastro, professorId: inativo.id })).rejects.toMatchObject({
      status: 422,
      codigo: 'PROFESSOR_INATIVO',
    })
    await expect(criar.executar(ADMIN, { ...cadastro, professorId: ana.id })).rejects.toMatchObject({ status: 404 })
    expect((await criar.executar(ADMIN, { ...cadastro, professorId: carla.id })).professorId).toBe(carla.id)
  })

  it('quem não é aluno não tem responsável', async () => {
    const { criar } = await montar()
    const professor = await criar.executar(ADMIN, { ...cadastro, perfil: 'PROFESSOR', professorId: carla.id })
    expect(professor.professorId).toBeUndefined()
  })

  it('o professor lista e vê só os próprios alunos; o de outro professor é "não encontrado"', async () => {
    const { listar, obter } = await montar()
    const pagina = await listar.executar(PROFESSOR, { pagina: 1, limite: 20, professorId: carla.id })
    expect(pagina.itens.map((u) => u.nome)).toEqual(['Ana'])
    expect(await obter.executar(PROFESSOR, ana.id)).toEqual(ana)
    await expect(obter.executar(PROFESSOR, bruno.id)).rejects.toMatchObject({ status: 404 })
  })

  it('o administrador filtra os alunos de um professor', async () => {
    const { listar } = await montar()
    const pagina = await listar.executar(ADMIN, { pagina: 1, limite: 20, professorId: carla.id })
    expect(pagina.itens.map((u) => u.nome)).toEqual(['Bruno'])
  })

  it('só o administrador transfere o aluno; o professor edita os dados dos seus, sem transferir', async () => {
    const { editar } = await montar()
    expect((await editar.executar(PROFESSOR, ana.id, { nome: 'Ana Maria' })).professorId).toBe(paulo.id)
    await expect(editar.executar(PROFESSOR, ana.id, { professorId: carla.id })).rejects.toMatchObject({ status: 403 })
    await expect(editar.executar(COMO_CARLA, ana.id, { nome: 'Outra' })).rejects.toMatchObject({ status: 404 })
    expect((await editar.executar(ADMIN, ana.id, { professorId: carla.id })).professorId).toBe(carla.id)
  })

  it('o aluno que muda de perfil perde o responsável; quem vira aluno precisa de um', async () => {
    const { editar, usuarios } = await montar()
    expect((await editar.executar(ADMIN, ana.id, { perfil: 'PROFESSOR' })).professorId).toBeUndefined()
    await expect(editar.executar(ADMIN, ana.id, { perfil: 'ALUNO' })).rejects.toMatchObject({ status: 400 })
    await editar.executar(ADMIN, ana.id, { perfil: 'ALUNO', professorId: paulo.id })
    expect((await usuarios.buscarPorId(ana.id))?.professorId).toBe(paulo.id)
  })

  it('um professor com alunos não é excluído nem muda de perfil: os alunos ficariam sem responsável (409)', async () => {
    const { editar, excluir } = await montar()
    const conflito = { status: 409, codigo: 'PROFESSOR_COM_ALUNOS' }
    await expect(excluir.executar(ADMIN, carla.id)).rejects.toMatchObject(conflito)
    await expect(editar.executar(ADMIN, carla.id, { perfil: 'ADMINISTRADOR' })).rejects.toMatchObject(conflito)
    await editar.executar(ADMIN, bruno.id, { professorId: paulo.id })
    await excluir.executar(ADMIN, carla.id)
  })
})

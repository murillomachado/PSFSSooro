import type { PaginaDeUsuarios, Problema, UsuarioResposta } from '@psfssooro/contracts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SENHA_DEMO } from '../seed/semear.ts'
import { type Ambiente, type ClienteAutenticado, criarAmbiente } from './ambiente.ts'

const URL_USUARIOS = '/api/usuarios'
const ANA = 'aluno.ana'
const NOVO_ALUNO = { nome: 'Fábio Rocha', usuario: 'aluno.fabio', senha: 'senha1234', perfil: 'ALUNO' }

describe('API de usuários: permissões por perfil', () => {
  let ambiente: Ambiente
  let admin: ClienteAutenticado
  let professor: ClienteAutenticado
  let aluno: ClienteAutenticado

  beforeAll(async () => {
    ambiente = await criarAmbiente()
    admin = ambiente.como(await ambiente.entrar('admin'))
    professor = ambiente.como(await ambiente.entrar('prof.paulo'))
    aluno = ambiente.como(await ambiente.entrar(ANA))
  })
  afterAll(async () => {
    await ambiente.banco.destroy()
  })

  const pagina = (resposta: { body: unknown }): PaginaDeUsuarios => resposta.body as PaginaDeUsuarios
  const problema = (resposta: { body: unknown }): Problema => resposta.body as Problema

  describe('listar (RN4)', () => {
    it('o administrador vê todos os usuários, sem expor a senha', async () => {
      const resposta = await admin.get(URL_USUARIOS)
      expect(resposta.status).toBe(200)
      expect(pagina(resposta)).toMatchObject({ total: 6, pagina: 1, limite: 20 })
      expect(JSON.stringify(resposta.body)).not.toMatch(/senha/i)
    })

    it('o professor vê só alunos, mesmo pedindo outro perfil', async () => {
      const todos = pagina(await professor.get(URL_USUARIOS))
      expect(todos.total).toBe(3)
      expect(todos.itens.every((usuario) => usuario.perfil === 'ALUNO')).toBe(true)
      expect(pagina(await professor.get(`${URL_USUARIOS}?perfil=PROFESSOR`)).total).toBe(0)
    })

    it('o aluno não acessa a lista, e quem não está logado recebe 401', async () => {
      expect((await aluno.get(URL_USUARIOS)).status).toBe(403)
      expect((await request(ambiente.app).get(URL_USUARIOS)).status).toBe(401)
    })

    it('filtra por situação e por busca, e pagina', async () => {
      expect(pagina(await admin.get(`${URL_USUARIOS}?ativo=false`)).itens.map((u) => u.usuario)).toEqual([
        'aluno.inativo',
      ])
      expect(pagina(await admin.get(`${URL_USUARIOS}?busca=CARLA`)).itens.map((u) => u.usuario)).toEqual(['prof.carla'])
      const segunda = pagina(await admin.get(`${URL_USUARIOS}?limite=4&pagina=2`))
      expect(segunda).toMatchObject({ total: 6, pagina: 2, limite: 4 })
      expect(segunda.itens).toHaveLength(2)
    })

    it('recusa parâmetros inválidos com 400', async () => {
      const resposta = await admin.get(`${URL_USUARIOS}?pagina=0&limite=500&ativo=talvez`)
      expect(resposta.status).toBe(400)
      expect(
        problema(resposta)
          .campos?.map((campo) => campo.campo)
          .sort(),
      ).toEqual(['ativo', 'limite', 'pagina'])
    })
  })

  describe('detalhe', () => {
    it('o professor vê um aluno; um professor ou administrador ele não vê, e recebe 404', async () => {
      const idDaAna = await ambiente.idDe(ANA)
      expect((await professor.get(`${URL_USUARIOS}/${idDaAna}`)).status).toBe(200)
      const doAdmin = await professor.get(`${URL_USUARIOS}/${await ambiente.idDe('admin')}`)
      expect(doAdmin.status).toBe(404)
      expect(problema(doAdmin).codigo).toBe('USUARIO_NAO_ENCONTRADO')
    })

    it('recusa um identificador que não é UUID', async () => {
      expect((await admin.get(`${URL_USUARIOS}/123`)).status).toBe(400)
    })
  })

  describe('cadastrar (RF1, RN1, RN4)', () => {
    it('o administrador cadastra um professor, que nasce ativo e já consegue entrar', async () => {
      const dados = { nome: 'Marta Lopes', usuario: 'prof.marta', senha: 'outrasenha9', perfil: 'PROFESSOR' }
      const resposta = await admin.post(URL_USUARIOS).send(dados)
      expect(resposta.status).toBe(201)
      expect(resposta.body as UsuarioResposta).toMatchObject({
        usuario: 'prof.marta',
        perfil: 'PROFESSOR',
        ativo: true,
      })
      const entrada = await request(ambiente.app)
        .post('/api/auth/login')
        .send({ usuario: 'prof.marta', senha: 'outrasenha9' })
      expect(entrada.status).toBe(200)
    })

    it('o professor cadastra alunos, mas não professores nem administradores', async () => {
      expect((await professor.post(URL_USUARIOS).send(NOVO_ALUNO)).status).toBe(201)
      const naoPermitido = await professor
        .post(URL_USUARIOS)
        .send({ ...NOVO_ALUNO, usuario: 'prof.x', perfil: 'PROFESSOR' })
      expect(naoPermitido.status).toBe(403)
      expect(problema(naoPermitido).codigo).toBe('PERFIL_NAO_PERMITIDO')
    })

    it('o aluno não cadastra ninguém', async () => {
      expect((await aluno.post(URL_USUARIOS).send({ ...NOVO_ALUNO, usuario: 'aluno.y' })).status).toBe(403)
    })

    it('recusa um nome de usuário repetido, mesmo em maiúsculas, com 409', async () => {
      const repetido = await admin.post(URL_USUARIOS).send({ ...NOVO_ALUNO, usuario: 'ALUNO.ANA' })
      expect(repetido.status).toBe(409)
      expect(problema(repetido).codigo).toBe('USUARIO_JA_EXISTE')
    })

    it('recusa dados inválidos com 400 e a lista dos campos', async () => {
      const resposta = await admin
        .post(URL_USUARIOS)
        .send({ nome: 'A', usuario: 'x y', senha: '123', perfil: 'DIRETOR' })
      expect(resposta.status).toBe(400)
      const campos = problema(resposta).campos?.map((campo) => campo.campo) ?? []
      expect(campos.toSorted((a, b) => a.localeCompare(b))).toEqual(['nome', 'perfil', 'senha', 'usuario'])
    })
  })

  describe('editar (RF1, RN1, RN4)', () => {
    it('o administrador e o professor corrigem os dados de um aluno', async () => {
      const url = `${URL_USUARIOS}/${await ambiente.idDe('aluno.bruno')}`
      expect((await admin.put(url).send({ nome: 'Bruno Lima Souza' })).body).toMatchObject({ nome: 'Bruno Lima Souza' })
      expect((await professor.put(url).send({ nome: 'Bruno Lima' })).body).toMatchObject({ nome: 'Bruno Lima' })
    })

    it('o professor não edita outro professor (404) e não troca o perfil de um aluno (403)', async () => {
      const deOutroProfessor = `${URL_USUARIOS}/${await ambiente.idDe('prof.carla')}`
      expect((await professor.put(deOutroProfessor).send({ nome: 'X Y' })).status).toBe(404)
      const trocaDePerfil = await professor
        .put(`${URL_USUARIOS}/${await ambiente.idDe(ANA)}`)
        .send({ perfil: 'PROFESSOR' })
      expect(trocaDePerfil.status).toBe(403)
    })

    it('recusa trocar o nome de usuário por um que já existe', async () => {
      const resposta = await admin.put(`${URL_USUARIOS}/${await ambiente.idDe(ANA)}`).send({ usuario: 'prof.carla' })
      expect(resposta.status).toBe(409)
    })

    it('o último administrador ativo não muda de perfil', async () => {
      const resposta = await admin.put(`${URL_USUARIOS}/${await ambiente.idDe('admin')}`).send({ perfil: 'PROFESSOR' })
      expect(resposta.status).toBe(422)
      expect(problema(resposta).codigo).toBe('ULTIMO_ADMINISTRADOR')
    })
  })

  describe('ativar e inativar (RF2)', () => {
    it('o administrador inativa e reativa um usuário', async () => {
      const url = `${URL_USUARIOS}/${await ambiente.idDe('aluno.bruno')}/situacao`
      expect((await admin.patch(url).send({ ativo: false })).body).toMatchObject({ ativo: false })
      expect((await admin.patch(url).send({ ativo: true })).body).toMatchObject({ ativo: true })
    })

    it('o professor e o aluno não mudam a situação de ninguém', async () => {
      const url = `${URL_USUARIOS}/${await ambiente.idDe(ANA)}/situacao`
      expect((await professor.patch(url).send({ ativo: false })).status).toBe(403)
      expect((await aluno.patch(url).send({ ativo: false })).status).toBe(403)
    })

    it('o administrador não inativa a si mesmo', async () => {
      const resposta = await admin
        .patch(`${URL_USUARIOS}/${await ambiente.idDe('admin')}/situacao`)
        .send({ ativo: false })
      expect(resposta.status).toBe(422)
      expect(problema(resposta).codigo).toBe('NAO_INATIVAR_A_SI_MESMO')
    })

    it('exige um booleano de verdade', async () => {
      const url = `${URL_USUARIOS}/${await ambiente.idDe(ANA)}/situacao`
      expect((await admin.patch(url).send({ ativo: 'false' })).status).toBe(400)
    })
  })

  it('a senha de demonstração continua valendo para quem não foi alterado', async () => {
    const entrada = await request(ambiente.app).post('/api/auth/login').send({ usuario: ANA, senha: SENHA_DEMO })
    expect(entrada.status).toBe(200)
  })
})

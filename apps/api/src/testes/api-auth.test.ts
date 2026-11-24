import type { LoginResposta, Problema, UsuarioResposta } from '@psfssooro/contracts'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { SENHA_DEMO } from '../seed/semear.ts'
import { type Ambiente, criarAmbiente } from './ambiente.ts'

const URL_LOGIN = '/api/auth/login'
const URL_ME = '/api/auth/me'

describe('login e sessão (RF6)', () => {
  let ambiente: Ambiente
  const login = (usuario: string, senha: string) => request(ambiente.app).post(URL_LOGIN).send({ usuario, senha })

  beforeAll(async () => {
    ambiente = await criarAmbiente()
  })
  afterAll(async () => {
    await ambiente.banco.destroy()
  })

  it.each([
    ['michael.scott', 'ADMINISTRADOR'],
    ['dwight.schrute', 'PROFESSOR'],
    ['pam.beesly', 'ALUNO'],
  ])('%s entra com usuário e senha e recebe o token e o perfil %s', async (usuario, perfil) => {
    const resposta = await login(usuario, SENHA_DEMO)
    const corpo = resposta.body as LoginResposta
    expect(resposta.status).toBe(200)
    expect(corpo.token.split('.')).toHaveLength(3)
    expect(corpo.usuario).toMatchObject({ usuario, perfil, ativo: true })
    expect(JSON.stringify(corpo)).not.toContain('senhaHash')
  })

  it('ignora maiúsculas e espaços no nome de usuário', async () => {
    expect((await login('  MICHAEL.SCOTT ', SENHA_DEMO)).status).toBe(200)
  })

  it('responde igual para senha errada e para usuário inexistente', async () => {
    const errada = await login('michael.scott', 'senha-errada')
    const inexistente = await login('fantasma', SENHA_DEMO)
    expect(errada.status).toBe(401)
    expect(inexistente.status).toBe(401)
    expect(errada.body).toEqual(inexistente.body)
    expect((errada.body as Problema).codigo).toBe('CREDENCIAIS_INVALIDAS')
  })

  it('recusa com 403 o usuário inativo que acerta a senha, e com 401 o que erra', async () => {
    const certa = await login('ryan.howard', SENHA_DEMO)
    expect(certa.status).toBe(403)
    expect((certa.body as Problema).codigo).toBe('USUARIO_INATIVO')
    expect((await login('ryan.howard', 'senha-errada')).status).toBe(401)
  })

  it('exige usuário e senha, listando os campos com problema', async () => {
    const resposta = await login('', '')
    const problema = resposta.body as Problema
    expect(resposta.status).toBe(400)
    expect(problema.campos?.map((campo) => campo.campo).sort()).toEqual(['senha', 'usuario'])
  })

  it('GET /auth/me devolve o usuário do token e recusa token ausente ou adulterado', async () => {
    const token = await ambiente.entrar('dwight.schrute')
    const logado = await ambiente.como(token).get(URL_ME)
    expect(logado.status).toBe(200)
    expect(logado.body).toMatchObject({ usuario: 'dwight.schrute', perfil: 'PROFESSOR' })
    expect((await request(ambiente.app).get(URL_ME)).status).toBe(401)
    expect((await ambiente.como(`${token}x`).get(URL_ME)).status).toBe(401)
  })
})

describe('RN8: usuário inativo não acessa o sistema', () => {
  let ambiente: Ambiente

  beforeEach(async () => {
    ambiente = await criarAmbiente()
  })
  afterEach(async () => {
    await ambiente.banco.destroy()
  })

  it('quem é inativado perde o acesso na hora, mesmo com o token ainda válido, e volta ao ser reativado', async () => {
    const admin = ambiente.como(await ambiente.entrar('michael.scott'))
    const tokenDaPam = await ambiente.entrar('pam.beesly')
    const urlDaSituacao = `/api/usuarios/${await ambiente.idDe('pam.beesly')}/situacao`
    expect((await ambiente.como(tokenDaPam).get(URL_ME)).status).toBe(200)

    expect((await admin.patch(urlDaSituacao).send({ ativo: false })).status).toBe(200)
    expect((await ambiente.como(tokenDaPam).get(URL_ME)).status).toBe(401)
    const tentativa = await request(ambiente.app).post(URL_LOGIN).send({ usuario: 'pam.beesly', senha: SENHA_DEMO })
    expect(tentativa.status).toBe(403)

    expect((await admin.patch(urlDaSituacao).send({ ativo: true })).status).toBe(200)
    const volta = await ambiente.como(tokenDaPam).get(URL_ME)
    expect(volta.status).toBe(200)
    expect((volta.body as UsuarioResposta).ativo).toBe(true)
  })
})

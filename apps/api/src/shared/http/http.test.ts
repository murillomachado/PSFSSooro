import express, { type Express } from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { Conflito } from '../errors/erros.ts'
import { autenticar } from './autenticar.ts'
import { autorizar } from './autorizar.ts'
import { idDaRota } from './locais.ts'
import { criarTratadorDeErros, rotaNaoEncontrada } from './tratar-erros.ts'
import { validar } from './validar.ts'

const TOKEN_DO_PROFESSOR = 'token-do-professor'
const AUTORIZACAO = 'Authorization'
const PROBLEM_JSON = /application\/problem\+json/
const ID = '4b1c9f3e-9d2a-4b7e-8f10-1a2b3c4d5e6f'

const registrar = vi.fn<(erro: unknown) => void>()
let app: Express

beforeEach(() => {
  registrar.mockClear()
  const verificador = { verificar: (token: string) => (token === TOKEN_DO_PROFESSOR ? 'u1' : undefined) }
  const provedor = {
    buscarAtor: (id: string) => Promise.resolve(id === 'u1' ? { id, perfil: 'PROFESSOR' as const } : undefined),
  }
  const protegida = [autenticar(verificador, provedor)]
  app = express()
  app.use(express.json({ limit: '1kb' }))
  app.get('/professor', ...protegida, autorizar('PROFESSOR', 'ADMINISTRADOR'), (_req, res) => {
    res.json({ ok: true })
  })
  app.get('/admin', ...protegida, autorizar('ADMINISTRADOR'), (_req, res) => {
    res.json({ ok: true })
  })
  app.post(
    '/itens/:id',
    validar({
      corpo: z.object({ idade: z.number('Informe a idade') }),
      consulta: z.object({ pagina: z.string().transform(Number) }),
      parametros: z.object({ id: z.uuid('Identificador inválido') }),
    }),
    (req, res) => {
      res.json({ corpo: req.body as unknown, pagina: res.locals.consulta as unknown, id: idDaRota(res) })
    },
  )
  app.get('/conflito', () => {
    throw new Conflito('Já existe.', 'JA_EXISTE')
  })
  app.get('/quebra', () => {
    throw new Error('detalhe interno que não pode vazar')
  })
  app.use(rotaNaoEncontrada)
  app.use(criarTratadorDeErros(registrar))
})

describe('autenticar', () => {
  it('recusa a requisição sem token, com token inválido ou de usuário que não existe mais', async () => {
    const respostas = await Promise.all([
      request(app).get('/professor'),
      request(app).get('/professor').set(AUTORIZACAO, 'Bearer lixo'),
      request(app).get('/professor').set(AUTORIZACAO, 'Basic abc'),
    ])
    expect(respostas.map((resposta) => resposta.status)).toEqual([401, 401, 401])
    // RFC 9110: toda resposta 401 diz como se autenticar.
    expect(respostas.map((resposta) => resposta.headers['www-authenticate'])).toEqual(['Bearer', 'Bearer', 'Bearer'])
  })

  it('deixa passar com um token válido', async () => {
    const resposta = await request(app).get('/professor').set(AUTORIZACAO, `Bearer ${TOKEN_DO_PROFESSOR}`)
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ ok: true })
  })
})

describe('autorizar', () => {
  it('recusa com 403 o perfil que não está na lista da rota', async () => {
    const resposta = await request(app).get('/admin').set(AUTORIZACAO, `Bearer ${TOKEN_DO_PROFESSOR}`).expect(403)
    expect(resposta.body).toMatchObject({ status: 403, codigo: 'SEM_PERMISSAO' })
  })
})

describe('validar', () => {
  const rota = `/itens/${ID}?pagina=3`

  it('entrega o corpo, a consulta e os parâmetros já convertidos', async () => {
    const resposta = await request(app).post(rota).send({ idade: 30 }).expect(200)
    expect(resposta.body).toEqual({ corpo: { idade: 30 }, pagina: { pagina: 3 }, id: ID })
  })

  it('responde 400 com todos os campos inválidos de uma vez, de corpo, consulta e parâmetros', async () => {
    const resposta = await request(app).post('/itens/123').send({ idade: 'trinta' }).expect(400)
    expect(resposta.headers['content-type']).toMatch(PROBLEM_JSON)
    expect(resposta.body).toMatchObject({ status: 400, codigo: 'ENTRADA_INVALIDA' })
    const campos = (resposta.body as { campos: { campo: string }[] }).campos.map((c) => c.campo)
    expect(campos).toEqual(expect.arrayContaining(['idade', 'pagina', 'id']))
  })
})

describe('tratamento de erros', () => {
  it('traduz um erro de domínio para problem+json com o status e o código dele (RFC 9457)', async () => {
    const resposta = await request(app).get('/conflito').expect(409)
    expect(resposta.headers['content-type']).toMatch(PROBLEM_JSON)
    expect(resposta.body).toEqual({
      type: 'about:blank',
      title: 'Conflito',
      status: 409,
      detail: 'Já existe.',
      codigo: 'JA_EXISTE',
    })
  })

  it('esconde o detalhe de um erro inesperado e o manda para o registro', async () => {
    const resposta = await request(app).get('/quebra').expect(500)
    expect(JSON.stringify(resposta.body)).not.toContain('detalhe interno')
    expect(resposta.body).toMatchObject({ status: 500, codigo: 'ERRO_INTERNO' })
    expect(registrar).toHaveBeenCalledOnce()
  })

  it('responde 404 no mesmo formato para uma rota que não existe', async () => {
    const resposta = await request(app).get('/nao-existe').expect(404)
    expect(resposta.body).toMatchObject({ codigo: 'ROTA_NAO_ENCONTRADA' })
  })

  it('responde 400 para JSON malformado e 413 para corpo grande demais, sem registrar como erro', async () => {
    const malformado = await request(app)
      .post(`/itens/${ID}`)
      .set('Content-Type', 'application/json')
      .send('{ não é json')
      .expect(400)
    expect(malformado.body).toMatchObject({ codigo: 'REQUISICAO_INVALIDA' })
    const grande = await request(app)
      .post(`/itens/${ID}`)
      .send({ texto: 'x'.repeat(5000) })
      .expect(413)
    expect(grande.body).toMatchObject({ codigo: 'CORPO_GRANDE_DEMAIS' })
    expect(registrar).not.toHaveBeenCalled()
  })
})

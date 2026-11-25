import type { AvaliacaoResposta, FaixaImcResposta, PaginaDeAvaliacoes, Problema } from '@psfssooro/contracts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Ambiente, type ClienteAutenticado, criarAmbiente } from './ambiente.ts'

const URL_AVALIACOES = '/api/avaliacoes'
const HOJE = new Date().toISOString().slice(0, 10)

// Na semente, kevin.malone é aluno de dwight.schrute; pam.beesly e ryan.howard são de jim.halpert (RN6).
describe('API de avaliações: IMC, permissões por perfil e exclusão de usuários', () => {
  let ambiente: Ambiente
  let admin: ClienteAutenticado
  let dwight: ClienteAutenticado
  let jim: ClienteAutenticado
  let pam: ClienteAutenticado
  let idPam: string
  let idKevin: string
  let idDwight: string
  let idJim: string

  beforeAll(async () => {
    ambiente = await criarAmbiente()
    admin = ambiente.como(await ambiente.entrar('michael.scott'))
    dwight = ambiente.como(await ambiente.entrar('dwight.schrute'))
    jim = ambiente.como(await ambiente.entrar('jim.halpert'))
    pam = ambiente.como(await ambiente.entrar('pam.beesly'))
    idPam = await ambiente.idDe('pam.beesly')
    idKevin = await ambiente.idDe('kevin.malone')
    idDwight = await ambiente.idDe('dwight.schrute')
    idJim = await ambiente.idDe('jim.halpert')
  })
  afterAll(async () => {
    await ambiente.banco.destroy()
  })

  const avaliacao = (resposta: { body: unknown }): AvaliacaoResposta => resposta.body as AvaliacaoResposta
  const pagina = (resposta: { body: unknown }): PaginaDeAvaliacoes => resposta.body as PaginaDeAvaliacoes
  const problema = (resposta: { body: unknown }): Problema => resposta.body as Problema
  const nova = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    alunoId: idKevin,
    dataAvaliacao: HOJE,
    alturaM: 1.75,
    pesoKg: 72,
    ...extra,
  })

  describe('registrar (RF3, RF4, RN9)', () => {
    it('o professor registra; o IMC e a classificação vêm calculados pela API', async () => {
      const resposta = await dwight.post(URL_AVALIACOES).send(nova())
      expect(resposta.status).toBe(201)
      expect(avaliacao(resposta)).toMatchObject({
        aluno: { id: idKevin, nome: 'Kevin Malone' },
        professor: { id: idDwight, nome: 'Dwight Schrute' },
        alturaM: 1.75,
        pesoKg: 72,
        imc: 23.5,
        classificacao: { codigo: 'PESO_NORMAL', descricao: 'Peso normal' },
      })
    })

    it('ignora um IMC enviado pelo cliente: quem calcula é a API', async () => {
      const resposta = await dwight.post(URL_AVALIACOES).send(nova({ imc: 10, classificacao: 'ABAIXO_DO_PESO' }))
      expect(avaliacao(resposta)).toMatchObject({ imc: 23.5, classificacao: { codigo: 'PESO_NORMAL' } })
    })

    it.each([
      [1.75, 53, 17.3, 'Abaixo do peso'],
      [1.75, 57, 18.6, 'Peso normal'],
      [1.75, 80, 26.1, 'Sobrepeso'],
      [1.75, 95, 31, 'Obesidade grau I'],
      [1.75, 110, 35.9, 'Obesidade grau II'],
      [1.75, 130, 42.4, 'Obesidade grau III'],
    ])('altura %s m e peso %s kg dão IMC %s: %s', async (alturaM, pesoKg, imc, descricao) => {
      const resposta = await admin.post(URL_AVALIACOES).send(nova({ alturaM, pesoKg, professorId: idDwight }))
      expect(avaliacao(resposta)).toMatchObject({ imc, classificacao: { descricao } })
    })

    it('o administrador escolhe o professor; o professor não registra em nome de outro (403)', async () => {
      const doAdmin = await admin.post(URL_AVALIACOES).send(nova({ professorId: idJim }))
      expect(avaliacao(doAdmin).professor.id).toBe(idJim)
      expect((await admin.post(URL_AVALIACOES).send(nova())).status).toBe(400)
      expect((await dwight.post(URL_AVALIACOES).send(nova({ professorId: idJim }))).status).toBe(403)
    })

    it('o aluno não registra (403)', async () => {
      expect((await pam.post(URL_AVALIACOES).send(nova({ alunoId: idPam }))).status).toBe(403)
    })

    it('recusa medidas e datas inválidas (400) e data futura (422)', async () => {
      const invalida = await dwight.post(URL_AVALIACOES).send(nova({ alturaM: 0.3, pesoKg: 5, dataAvaliacao: 'ontem' }))
      expect(invalida.status).toBe(400)
      expect(
        problema(invalida)
          .campos?.map((campo) => campo.campo)
          .toSorted((a, b) => a.localeCompare(b)),
      ).toEqual(['alturaM', 'dataAvaliacao', 'pesoKg'])
      expect((await dwight.post(URL_AVALIACOES).send(nova({ alturaM: 1.755 }))).status).toBe(400)
      const futura = await dwight.post(URL_AVALIACOES).send(nova({ dataAvaliacao: '2999-01-01' }))
      expect(futura.status).toBe(422)
      expect(problema(futura).codigo).toBe('DATA_FUTURA')
    })

    it('não registra para aluno inativo (422) nem para quem não é aluno (404)', async () => {
      const inativo = await jim.post(URL_AVALIACOES).send(nova({ alunoId: await ambiente.idDe('ryan.howard') }))
      expect(inativo.status).toBe(422)
      expect(problema(inativo).codigo).toBe('ALUNO_INATIVO')
      expect((await dwight.post(URL_AVALIACOES).send(nova({ alunoId: idJim }))).status).toBe(404)
    })

    it('o professor só avalia os seus alunos: o de outro professor é "não encontrado" (RN6)', async () => {
      const resposta = await dwight.post(URL_AVALIACOES).send(nova({ alunoId: idPam }))
      expect(resposta.status).toBe(404)
      expect(problema(resposta).codigo).toBe('ALUNO_NAO_ENCONTRADO')
    })
  })

  describe('consultar (RF5, RN3, RN6, RN7)', () => {
    it('qualquer perfil lê a tabela de faixas do IMC, em ordem e com o IMC onde cada uma começa', async () => {
      const resposta = await pam.get(`${URL_AVALIACOES}/faixas`)
      expect(resposta.status).toBe(200)
      const faixas = resposta.body as FaixaImcResposta[]
      expect(faixas.map((f) => f.minimo)).toEqual([0, 18.5, 25, 30, 35, 40])
      expect(faixas[1]).toEqual({ codigo: 'PESO_NORMAL', descricao: 'Peso normal', minimo: 18.5 })
      expect((await request(ambiente.app).get(`${URL_AVALIACOES}/faixas`)).status).toBe(401)
    })

    it('o professor lista as avaliações dos seus alunos, inclusive as feitas por colegas, e só elas (RN6)', async () => {
      const alunosDoDwight = ['Andy Bernard', 'Angela Martin', 'Kevin Malone']
      const todas = pagina(await dwight.get(`${URL_AVALIACOES}?limite=100`))
      expect(new Set(todas.itens.map((item) => item.aluno.nome))).toEqual(new Set(alunosDoDwight))
      expect(todas.itens.some((item) => item.professor.id === idJim)).toBe(true)
      expect(pagina(await dwight.get(`${URL_AVALIACOES}?alunoId=${idPam}`)).total).toBe(0)
      const doJim = pagina(await jim.get(`${URL_AVALIACOES}?limite=100`))
      expect(doJim.itens.some((item) => alunosDoDwight.includes(item.aluno.nome))).toBe(false)
    })

    it('com filtro por aluno, professor e período (RF5)', async () => {
      const dePam = pagina(await jim.get(`${URL_AVALIACOES}?alunoId=${idPam}`))
      expect(dePam.itens.every((item) => item.aluno.id === idPam)).toBe(true)
      expect(dePam.total).toBe(6)
      const deJim = pagina(await admin.get(`${URL_AVALIACOES}?professorId=${idJim}`))
      expect(deJim.itens.every((item) => item.professor.id === idJim)).toBe(true)
      const periodo = pagina(await admin.get(`${URL_AVALIACOES}?alunoId=${idPam}&de=2026-09-01&ate=2026-09-30`))
      expect(periodo.itens.map((item) => item.dataAvaliacao)).toEqual(['2026-09-05'])
    })

    it('o aluno vê só as próprias, mesmo pedindo as de outro aluno (RN7)', async () => {
      const minhas = pagina(await pam.get(`${URL_AVALIACOES}?alunoId=${idKevin}`))
      expect(minhas.total).toBe(6)
      expect(minhas.itens.every((item) => item.aluno.id === idPam)).toBe(true)
      expect(minhas.itens.map((item) => item.dataAvaliacao)).toEqual([
        '2026-10-05',
        '2026-09-05',
        '2026-08-05',
        '2026-07-05',
        '2026-06-05',
        '2026-05-05',
      ])
    })

    it('a avaliação de um aluno abre para o professor dele (200), e não para outro aluno ou professor (404)', async () => {
      const doKevin = pagina(await admin.get(`${URL_AVALIACOES}?alunoId=${idKevin}`)).itens[0]
      expect((await pam.get(`${URL_AVALIACOES}/${doKevin?.id}`)).status).toBe(404)
      expect((await jim.get(`${URL_AVALIACOES}/${doKevin?.id}`)).status).toBe(404)
      expect((await dwight.get(`${URL_AVALIACOES}/${doKevin?.id}`)).status).toBe(200)
    })

    it('exige login e recusa filtro inválido', async () => {
      expect((await ambiente.como('invalido').get(URL_AVALIACOES)).status).toBe(401)
      expect((await admin.get(`${URL_AVALIACOES}?alunoId=abc&de=hoje`)).status).toBe(400)
    })
  })

  describe('editar e excluir (RN2, RN5)', () => {
    it('o professor corrige a própria avaliação, e o IMC é recalculado; a de um colega no seu aluno dá 403', async () => {
      const criada = avaliacao(await dwight.post(URL_AVALIACOES).send(nova()))
      const editada = await dwight.put(`${URL_AVALIACOES}/${criada.id}`).send({ pesoKg: 95 })
      expect(editada.status).toBe(200)
      expect(avaliacao(editada)).toMatchObject({ pesoKg: 95, imc: 31, classificacao: { codigo: 'OBESIDADE_I' } })
      expect((await jim.put(`${URL_AVALIACOES}/${criada.id}`).send({ pesoKg: 70 })).status).toBe(404)
      const doJimNoKevin = pagina(await admin.get(`${URL_AVALIACOES}?alunoId=${idKevin}&professorId=${idJim}`)).itens[0]
      expect((await dwight.put(`${URL_AVALIACOES}/${doJimNoKevin?.id}`).send({ pesoKg: 70 })).status).toBe(403)
    })

    it('o administrador edita qualquer uma; o aluno não edita nem exclui', async () => {
      const criada = avaliacao(await dwight.post(URL_AVALIACOES).send(nova()))
      const trocada = await admin.put(`${URL_AVALIACOES}/${criada.id}`).send({ professorId: idJim })
      expect(avaliacao(trocada).professor.id).toBe(idJim)
      expect((await pam.put(`${URL_AVALIACOES}/${criada.id}`).send({ pesoKg: 60 })).status).toBe(403)
      expect((await pam.delete(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(403)
    })

    it('só o administrador exclui, e depois a avaliação some (404)', async () => {
      const criada = avaliacao(await dwight.post(URL_AVALIACOES).send(nova()))
      expect((await dwight.delete(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(403)
      expect((await admin.delete(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(204)
      expect((await admin.get(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(404)
    })
  })

  describe('excluir e reclassificar usuários (RN1, D8)', () => {
    const NOVO = { nome: 'Fábio Rocha', usuario: 'aluno.fabio', senha: 'senha1234', perfil: 'ALUNO' }

    it('exclui um usuário sem avaliações (204) e recusa quem tem (409), sem apagar o histórico', async () => {
      const criado = (await admin.post('/api/usuarios').send({ ...NOVO, professorId: idDwight })).body as { id: string }
      expect((await admin.delete(`/api/usuarios/${criado.id}`)).status).toBe(204)
      expect((await admin.get(`/api/usuarios/${criado.id}`)).status).toBe(404)

      const recusa = await admin.delete(`/api/usuarios/${idPam}`)
      expect(recusa.status).toBe(409)
      expect(problema(recusa).codigo).toBe('USUARIO_COM_AVALIACOES')
      expect(pagina(await admin.get(`${URL_AVALIACOES}?alunoId=${idPam}`)).total).toBe(6)
    })

    it('só o administrador exclui; ninguém exclui a si mesmo', async () => {
      expect((await dwight.delete(`/api/usuarios/${idPam}`)).status).toBe(403)
      const idAdmin = await ambiente.idDe('michael.scott')
      expect((await admin.delete(`/api/usuarios/${idAdmin}`)).status).toBe(422)
    })

    it('quem tem avaliações não troca de perfil (409)', async () => {
      const resposta = await admin.put(`/api/usuarios/${idPam}`).send({ perfil: 'PROFESSOR' })
      expect(resposta.status).toBe(409)
    })
  })
})

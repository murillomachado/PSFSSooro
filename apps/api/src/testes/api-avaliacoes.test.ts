import type { AvaliacaoResposta, PaginaDeAvaliacoes, Problema } from '@psfssooro/contracts'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Ambiente, type ClienteAutenticado, criarAmbiente } from './ambiente.ts'

const URL_AVALIACOES = '/api/avaliacoes'
const HOJE = new Date().toISOString().slice(0, 10)

describe('API de avaliações: IMC, permissões por perfil e exclusão de usuários', () => {
  let ambiente: Ambiente
  let admin: ClienteAutenticado
  let paulo: ClienteAutenticado
  let carla: ClienteAutenticado
  let ana: ClienteAutenticado
  let idAna: string
  let idBruno: string
  let idPaulo: string
  let idCarla: string

  beforeAll(async () => {
    ambiente = await criarAmbiente()
    admin = ambiente.como(await ambiente.entrar('admin'))
    paulo = ambiente.como(await ambiente.entrar('prof.paulo'))
    carla = ambiente.como(await ambiente.entrar('prof.carla'))
    ana = ambiente.como(await ambiente.entrar('aluno.ana'))
    idAna = await ambiente.idDe('aluno.ana')
    idBruno = await ambiente.idDe('aluno.bruno')
    idPaulo = await ambiente.idDe('prof.paulo')
    idCarla = await ambiente.idDe('prof.carla')
  })
  afterAll(async () => {
    await ambiente.banco.destroy()
  })

  const avaliacao = (resposta: { body: unknown }): AvaliacaoResposta => resposta.body as AvaliacaoResposta
  const pagina = (resposta: { body: unknown }): PaginaDeAvaliacoes => resposta.body as PaginaDeAvaliacoes
  const problema = (resposta: { body: unknown }): Problema => resposta.body as Problema
  const nova = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    alunoId: idBruno,
    dataAvaliacao: HOJE,
    alturaM: 1.75,
    pesoKg: 72,
    ...extra,
  })

  describe('registrar (RF3, RF4, RN9)', () => {
    it('o professor registra; o IMC e a classificação vêm calculados pela API', async () => {
      const resposta = await paulo.post(URL_AVALIACOES).send(nova())
      expect(resposta.status).toBe(201)
      expect(avaliacao(resposta)).toMatchObject({
        aluno: { id: idBruno, nome: 'Bruno Lima' },
        professor: { id: idPaulo, nome: 'Paulo Ferreira' },
        alturaM: 1.75,
        pesoKg: 72,
        imc: 23.5,
        classificacao: { codigo: 'PESO_NORMAL', descricao: 'Peso normal' },
      })
    })

    it('ignora um IMC enviado pelo cliente: quem calcula é a API', async () => {
      const resposta = await paulo.post(URL_AVALIACOES).send(nova({ imc: 10, classificacao: 'ABAIXO_DO_PESO' }))
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
      const resposta = await admin.post(URL_AVALIACOES).send(nova({ alturaM, pesoKg, professorId: idPaulo }))
      expect(avaliacao(resposta)).toMatchObject({ imc, classificacao: { descricao } })
    })

    it('o administrador escolhe o professor; o professor não registra em nome de outro (403)', async () => {
      const doAdmin = await admin.post(URL_AVALIACOES).send(nova({ professorId: idCarla }))
      expect(avaliacao(doAdmin).professor.id).toBe(idCarla)
      expect((await admin.post(URL_AVALIACOES).send(nova())).status).toBe(400)
      expect((await paulo.post(URL_AVALIACOES).send(nova({ professorId: idCarla }))).status).toBe(403)
    })

    it('o aluno não registra (403)', async () => {
      expect((await ana.post(URL_AVALIACOES).send(nova({ alunoId: idAna }))).status).toBe(403)
    })

    it('recusa medidas e datas inválidas (400) e data futura (422)', async () => {
      const invalida = await paulo.post(URL_AVALIACOES).send(nova({ alturaM: 0.3, pesoKg: 5, dataAvaliacao: 'ontem' }))
      expect(invalida.status).toBe(400)
      expect(
        problema(invalida)
          .campos?.map((campo) => campo.campo)
          .toSorted((a, b) => a.localeCompare(b)),
      ).toEqual(['alturaM', 'dataAvaliacao', 'pesoKg'])
      expect((await paulo.post(URL_AVALIACOES).send(nova({ alturaM: 1.755 }))).status).toBe(400)
      const futura = await paulo.post(URL_AVALIACOES).send(nova({ dataAvaliacao: '2999-01-01' }))
      expect(futura.status).toBe(422)
      expect(problema(futura).codigo).toBe('DATA_FUTURA')
    })

    it('não registra para aluno inativo (422) nem para quem não é aluno (404)', async () => {
      const inativo = await paulo.post(URL_AVALIACOES).send(nova({ alunoId: await ambiente.idDe('aluno.inativo') }))
      expect(inativo.status).toBe(422)
      expect(problema(inativo).codigo).toBe('ALUNO_INATIVO')
      expect((await paulo.post(URL_AVALIACOES).send(nova({ alunoId: idCarla }))).status).toBe(404)
    })
  })

  describe('consultar (RF5, RN3, RN6, RN7)', () => {
    it('professor e administrador listam todas, com filtro por aluno, professor e período', async () => {
      const todas = pagina(await paulo.get(URL_AVALIACOES))
      expect(todas.total).toBeGreaterThanOrEqual(5)
      const deAna = pagina(await paulo.get(`${URL_AVALIACOES}?alunoId=${idAna}`))
      expect(deAna.itens.every((item) => item.aluno.id === idAna)).toBe(true)
      expect(deAna.total).toBe(3)
      const deCarla = pagina(await admin.get(`${URL_AVALIACOES}?professorId=${idCarla}`))
      expect(deCarla.itens.every((item) => item.professor.id === idCarla)).toBe(true)
      const periodo = pagina(await admin.get(`${URL_AVALIACOES}?alunoId=${idAna}&de=2026-09-01&ate=2026-09-30`))
      expect(periodo.itens.map((item) => item.dataAvaliacao)).toEqual(['2026-09-14'])
    })

    it('o aluno vê só as próprias, mesmo pedindo as de outro aluno (RN7)', async () => {
      const minhas = pagina(await ana.get(`${URL_AVALIACOES}?alunoId=${idBruno}`))
      expect(minhas.total).toBe(3)
      expect(minhas.itens.every((item) => item.aluno.id === idAna)).toBe(true)
      expect(minhas.itens.map((item) => item.dataAvaliacao)).toEqual(['2026-10-19', '2026-09-14', '2026-08-10'])
    })

    it('o aluno não abre a avaliação de outro (404); o professor abre (200)', async () => {
      const doBruno = pagina(await admin.get(`${URL_AVALIACOES}?alunoId=${idBruno}`)).itens[0]
      expect((await ana.get(`${URL_AVALIACOES}/${doBruno?.id}`)).status).toBe(404)
      expect((await paulo.get(`${URL_AVALIACOES}/${doBruno?.id}`)).status).toBe(200)
    })

    it('exige login e recusa filtro inválido', async () => {
      expect((await ambiente.como('invalido').get(URL_AVALIACOES)).status).toBe(401)
      expect((await admin.get(`${URL_AVALIACOES}?alunoId=abc&de=hoje`)).status).toBe(400)
    })
  })

  describe('editar e excluir (RN2, RN5)', () => {
    it('o professor corrige a própria avaliação, e o IMC é recalculado; a de outro dá 403', async () => {
      const criada = avaliacao(await paulo.post(URL_AVALIACOES).send(nova()))
      const editada = await paulo.put(`${URL_AVALIACOES}/${criada.id}`).send({ pesoKg: 95 })
      expect(editada.status).toBe(200)
      expect(avaliacao(editada)).toMatchObject({ pesoKg: 95, imc: 31, classificacao: { codigo: 'OBESIDADE_I' } })
      expect((await carla.put(`${URL_AVALIACOES}/${criada.id}`).send({ pesoKg: 70 })).status).toBe(403)
    })

    it('o administrador edita qualquer uma; o aluno não edita nem exclui', async () => {
      const criada = avaliacao(await paulo.post(URL_AVALIACOES).send(nova()))
      const trocada = await admin.put(`${URL_AVALIACOES}/${criada.id}`).send({ professorId: idCarla })
      expect(avaliacao(trocada).professor.id).toBe(idCarla)
      expect((await ana.put(`${URL_AVALIACOES}/${criada.id}`).send({ pesoKg: 60 })).status).toBe(403)
      expect((await ana.delete(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(403)
    })

    it('só o administrador exclui, e depois a avaliação some (404)', async () => {
      const criada = avaliacao(await paulo.post(URL_AVALIACOES).send(nova()))
      expect((await paulo.delete(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(403)
      expect((await admin.delete(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(204)
      expect((await admin.get(`${URL_AVALIACOES}/${criada.id}`)).status).toBe(404)
    })
  })

  describe('excluir e reclassificar usuários (RN1, D8)', () => {
    const NOVO = { nome: 'Fábio Rocha', usuario: 'aluno.fabio', senha: 'senha1234', perfil: 'ALUNO' }

    it('exclui um usuário sem avaliações (204) e recusa quem tem (409), sem apagar o histórico', async () => {
      const criado = (await admin.post('/api/usuarios').send(NOVO)).body as { id: string }
      expect((await admin.delete(`/api/usuarios/${criado.id}`)).status).toBe(204)
      expect((await admin.get(`/api/usuarios/${criado.id}`)).status).toBe(404)

      const recusa = await admin.delete(`/api/usuarios/${idAna}`)
      expect(recusa.status).toBe(409)
      expect(problema(recusa).codigo).toBe('USUARIO_COM_AVALIACOES')
      expect(pagina(await admin.get(`${URL_AVALIACOES}?alunoId=${idAna}`)).total).toBe(3)
    })

    it('só o administrador exclui; ninguém exclui a si mesmo', async () => {
      expect((await paulo.delete(`/api/usuarios/${idAna}`)).status).toBe(403)
      const idAdmin = await ambiente.idDe('admin')
      expect((await admin.delete(`/api/usuarios/${idAdmin}`)).status).toBe(422)
    })

    it('quem tem avaliações não troca de perfil (409)', async () => {
      const resposta = await admin.put(`/api/usuarios/${idAna}`).send({ perfil: 'PROFESSOR' })
      expect(resposta.status).toBe(409)
    })
  })
})

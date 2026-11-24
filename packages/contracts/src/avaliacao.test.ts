import { describe, expect, it } from 'vitest'
import { criarAvaliacaoSchema, editarAvaliacaoSchema, listarAvaliacoesQuerySchema } from './index.ts'

const ALUNO = '4b1c9f3e-9d2a-4b7e-8f10-1a2b3c4d5e6f'
const valida = { alunoId: ALUNO, dataAvaliacao: '2026-11-20', alturaM: 1.75, pesoKg: 72.4 }

describe('criarAvaliacaoSchema', () => {
  it('aceita uma avaliação válida; o professor é opcional', () => {
    expect(criarAvaliacaoSchema.parse(valida)).toEqual(valida)
  })

  it('nunca aceita IMC nem classificação do cliente: a API calcula', () => {
    const resultado = criarAvaliacaoSchema.parse({ ...valida, imc: 99, classificacao: 'PESO_NORMAL' })
    expect(resultado).not.toHaveProperty('imc')
    expect(resultado).not.toHaveProperty('classificacao')
  })

  it.each([
    ['altura abaixo do limite', { alturaM: 0.4 }, 'alturaM'],
    ['altura acima do limite', { alturaM: 2.6 }, 'alturaM'],
    ['altura com três casas', { alturaM: 1.755 }, 'alturaM'],
    ['peso abaixo do limite', { pesoKg: 9.9 }, 'pesoKg'],
    ['peso acima do limite', { pesoKg: 401 }, 'pesoKg'],
    ['peso como texto', { pesoKg: '72,4' }, 'pesoKg'],
    ['data impossível', { dataAvaliacao: '2026-02-31' }, 'dataAvaliacao'],
    ['data fora do formato', { dataAvaliacao: '20/11/2026' }, 'dataAvaliacao'],
    ['aluno que não é um UUID', { alunoId: '123' }, 'alunoId'],
  ])('recusa %s', (_descricao, alteracao, campo) => {
    const resultado = criarAvaliacaoSchema.safeParse({ ...valida, ...alteracao })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.path).toEqual([campo])
  })

  it('recusa campo ausente, em vez de assumir zero', () => {
    expect(criarAvaliacaoSchema.safeParse({ ...valida, pesoKg: undefined }).success).toBe(false)
  })
})

describe('editarAvaliacaoSchema e listarAvaliacoesQuerySchema', () => {
  it('na edição, tudo é opcional, mas o que vem precisa ser válido', () => {
    expect(editarAvaliacaoSchema.parse({})).toEqual({})
    expect(editarAvaliacaoSchema.parse({ pesoKg: 70 })).toEqual({ pesoKg: 70 })
    expect(editarAvaliacaoSchema.safeParse({ alturaM: 3 }).success).toBe(false)
  })

  it('na listagem, aplica a paginação padrão e aceita os filtros', () => {
    expect(listarAvaliacoesQuerySchema.parse({})).toEqual({ pagina: 1, limite: 20 })
    const filtros = { alunoId: ALUNO, de: '2026-01-01', ate: '2026-12-31', pagina: '2' }
    expect(listarAvaliacoesQuerySchema.parse(filtros)).toEqual({ ...filtros, pagina: 2, limite: 20 })
    expect(listarAvaliacoesQuerySchema.safeParse({ de: 'ontem' }).success).toBe(false)
  })
})

describe('mensagens de campos ausentes', () => {
  it('cada campo obrigatório que falta tem a própria mensagem, em português', () => {
    const resultado = criarAvaliacaoSchema.safeParse({})
    expect(resultado.error?.issues.map((problema) => problema.message)).toEqual([
      'Escolha o aluno',
      'Informe uma data válida (AAAA-MM-DD)',
      'Informe a altura',
      'Informe o peso',
    ])
    expect(criarAvaliacaoSchema.safeParse(undefined).error?.issues.map((p) => p.message)).toEqual([
      'Envie os dados em JSON',
    ])
  })
})

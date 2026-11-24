import { z } from 'zod'
import { paginaSchema, paginacaoQuerySchema } from './paginacao.ts'

/** Os valores chegam com no máximo duas casas decimais (1,75 m; 72,40 kg). */
const temAteDuasCasas = (valor: number): boolean => Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6

const alturaM = z
  .number('Informe a altura')
  .min(0.5, 'A altura mínima é 0,50 m')
  .max(2.5, 'A altura máxima é 2,50 m')
  .refine(temAteDuasCasas, 'Use até duas casas decimais')

const pesoKg = z
  .number('Informe o peso')
  .min(10, 'O peso mínimo é 10 kg')
  .max(400, 'O peso máximo é 400 kg')
  .refine(temAteDuasCasas, 'Use até duas casas decimais')

const dia = z.iso.date('Informe uma data válida (AAAA-MM-DD)')

/** O IMC e a classificação nunca vêm do cliente: a API calcula. */
export const criarAvaliacaoSchema = z.object({
  alunoId: z.uuid('Escolha o aluno'),
  /** Só o administrador informa. Para o professor, o avaliador é ele mesmo. */
  professorId: z.uuid('Escolha o professor').optional(),
  dataAvaliacao: dia,
  alturaM,
  pesoKg,
})

export const editarAvaliacaoSchema = z.object({
  alunoId: z.uuid('Escolha o aluno').optional(),
  professorId: z.uuid('Escolha o professor').optional(),
  dataAvaliacao: dia.optional(),
  alturaM: alturaM.optional(),
  pesoKg: pesoKg.optional(),
})

export const listarAvaliacoesQuerySchema = paginacaoQuerySchema.extend({
  alunoId: z.uuid('Identificador do aluno inválido').optional(),
  professorId: z.uuid('Identificador do professor inválido').optional(),
  de: dia.optional(),
  ate: dia.optional(),
})

const pessoaSchema = z.object({ id: z.string(), nome: z.string() })

export const avaliacaoRespostaSchema = z.object({
  id: z.string(),
  aluno: pessoaSchema,
  professor: pessoaSchema,
  dataAvaliacao: z.string(),
  alturaM: z.number(),
  pesoKg: z.number(),
  /** IMC com uma casa decimal, já arredondado. */
  imc: z.number(),
  classificacao: z.object({ codigo: z.string(), descricao: z.string() }),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
})

export const paginaDeAvaliacoesSchema = paginaSchema(avaliacaoRespostaSchema)

export type CriarAvaliacaoEntrada = z.infer<typeof criarAvaliacaoSchema>
export type EditarAvaliacaoEntrada = z.infer<typeof editarAvaliacaoSchema>
export type ListarAvaliacoesQuery = z.infer<typeof listarAvaliacoesQuerySchema>
/** Uma faixa da tabela de classificação do IMC: ela começa em `minimo` e vai até onde a próxima começa. */
export const faixaImcRespostaSchema = z.object({ codigo: z.string(), descricao: z.string(), minimo: z.number() })

export type AvaliacaoResposta = z.infer<typeof avaliacaoRespostaSchema>
export type FaixaImcResposta = z.infer<typeof faixaImcRespostaSchema>
export type PaginaDeAvaliacoes = z.infer<typeof paginaDeAvaliacoesSchema>

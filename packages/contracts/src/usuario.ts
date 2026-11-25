import { z } from 'zod'
import { paginaSchema, paginacaoQuerySchema } from './paginacao.ts'
import { CORPO_JSON } from './erro.ts'
import { perfilSchema } from './perfil.ts'

const nome = z
  .string('Informe o nome')
  .trim()
  .min(2, 'Informe o nome (mínimo de 2 caracteres)')
  .max(100, 'O nome é longo demais')

const usuario = z
  .string('Informe o usuário')
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,30}$/, 'Use de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado')

const senha = z
  .string('Informe a senha')
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .max(128, 'A senha é longa demais')

const booleanoDeTexto = z.enum(['true', 'false'], 'Use true ou false').transform((texto) => texto === 'true')

export const loginSchema = z.object(
  {
    usuario: z.string('Informe o usuário').trim().toLowerCase().min(1, 'Informe o usuário'),
    senha: z.string('Informe a senha').min(1, 'Informe a senha'),
  },
  CORPO_JSON,
)

/** O professor responsável pelo aluno (RN6). Só o administrador informa; o professor que cadastra é o responsável. */
const professorId = z.uuid('Escolha o professor responsável')

export const criarUsuarioSchema = z.object(
  { nome, usuario, senha, perfil: perfilSchema, professorId: professorId.optional() },
  CORPO_JSON,
)

export const editarUsuarioSchema = z.object(
  {
    nome: nome.optional(),
    usuario: usuario.optional(),
    senha: senha.optional(),
    perfil: perfilSchema.optional(),
    professorId: professorId.optional(),
  },
  CORPO_JSON,
)

export const situacaoSchema = z.object({ ativo: z.boolean('Informe se o usuário está ativo') }, CORPO_JSON)

export const idSchema = z.object({ id: z.uuid('Identificador inválido') })

export const listarUsuariosQuerySchema = paginacaoQuerySchema.extend({
  perfil: perfilSchema.optional(),
  ativo: booleanoDeTexto.optional(),
  busca: z.string('A busca precisa ser um texto').trim().max(100, 'A busca é longa demais').optional(),
  /** Os alunos de um professor. */
  professorId: z.uuid('Identificador do professor inválido').optional(),
})

export const usuarioRespostaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  usuario: z.string(),
  perfil: perfilSchema,
  ativo: z.boolean(),
  /** O professor responsável, só para alunos. */
  professorId: z.string().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
})

export const paginaDeUsuariosSchema = paginaSchema(usuarioRespostaSchema)

export const loginRespostaSchema = z.object({ token: z.string(), usuario: usuarioRespostaSchema })

export type LoginEntrada = z.infer<typeof loginSchema>
export type CriarUsuarioEntrada = z.infer<typeof criarUsuarioSchema>
export type EditarUsuarioEntrada = z.infer<typeof editarUsuarioSchema>
export type SituacaoEntrada = z.infer<typeof situacaoSchema>
export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>
export type UsuarioResposta = z.infer<typeof usuarioRespostaSchema>
export type PaginaDeUsuarios = z.infer<typeof paginaDeUsuariosSchema>
export type LoginResposta = z.infer<typeof loginRespostaSchema>

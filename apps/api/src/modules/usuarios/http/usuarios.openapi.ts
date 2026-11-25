import {
  criarUsuarioSchema,
  editarUsuarioSchema,
  idSchema,
  listarUsuariosQuerySchema,
  paginaDeUsuariosSchema,
  situacaoSchema,
  usuarioRespostaSchema,
} from '@psfssooro/contracts'
import { type Caminhos, operacao } from '../../../shared/http/openapi.ts'

const TAG = 'Usuários'
const EQUIPE = 'administrador e professor (o professor só vê e cadastra os próprios alunos)'
const UM_USUARIO = { status: 200, descricao: 'O usuário', schema: usuarioRespostaSchema }

/** A documentação de /api/usuarios, ao lado das rotas que ela descreve. */
export const CAMINHOS_DE_USUARIOS: Caminhos = {
  '/api/usuarios': {
    get: operacao({
      resumo: 'Listar usuários, com busca e filtros, inclusive pelo professor responsável (RN4, RN6)',
      tag: TAG,
      perfis: EQUIPE,
      consulta: listarUsuariosQuerySchema,
      sucesso: { status: 200, descricao: 'Uma página de usuários', schema: paginaDeUsuariosSchema },
      erros: [400, 401, 403],
    }),
    post: operacao({
      resumo: 'Cadastrar um usuário; todo aluno tem um professor responsável (RF1, RN1, RN4, RN6)',
      tag: TAG,
      perfis: EQUIPE,
      corpo: criarUsuarioSchema,
      sucesso: { ...UM_USUARIO, status: 201, descricao: 'O usuário criado' },
      erros: [400, 401, 403, 404, 409, 422],
    }),
  },
  '/api/usuarios/{id}': {
    get: operacao({
      resumo: 'Ver um usuário',
      tag: TAG,
      perfis: EQUIPE,
      caminho: idSchema,
      sucesso: UM_USUARIO,
      erros: [400, 401, 403, 404],
    }),
    put: operacao({
      resumo: 'Editar um usuário; o administrador transfere o aluno de professor (RF1, RN1, RN4, RN6)',
      tag: TAG,
      perfis: EQUIPE,
      caminho: idSchema,
      corpo: editarUsuarioSchema,
      sucesso: UM_USUARIO,
      erros: [400, 401, 403, 404, 409, 422],
    }),
    delete: operacao({
      resumo: 'Excluir um usuário sem avaliações nem alunos (RN1)',
      tag: TAG,
      perfis: 'administrador',
      caminho: idSchema,
      sucesso: { status: 204, descricao: 'Excluído' },
      erros: [400, 401, 403, 404, 409, 422],
    }),
  },
  '/api/usuarios/{id}/situacao': {
    patch: operacao({
      resumo: 'Ativar ou inativar um usuário (RF2, RN8)',
      tag: TAG,
      perfis: 'administrador',
      caminho: idSchema,
      corpo: situacaoSchema,
      sucesso: UM_USUARIO,
      erros: [400, 401, 403, 404, 422],
    }),
  },
}

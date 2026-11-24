import { loginRespostaSchema, loginSchema, usuarioRespostaSchema } from '@psfssooro/contracts'
import { type Caminhos, operacao } from '../../../shared/http/openapi.ts'

const TAG = 'Autenticação'

/** A documentação de /api/auth, ao lado das rotas que ela descreve. */
export const CAMINHOS_DE_AUTH: Caminhos = {
  '/api/auth/login': {
    post: operacao({
      resumo: 'Entrar com usuário e senha (RF6)',
      tag: TAG,
      perfis: '',
      corpo: loginSchema,
      sucesso: { status: 200, descricao: 'O token JWT e quem entrou', schema: loginRespostaSchema },
      erros: [400, 401, 403],
    }),
  },
  '/api/auth/me': {
    get: operacao({
      resumo: 'Quem está logado',
      tag: TAG,
      perfis: 'todos',
      sucesso: { status: 200, descricao: 'O usuário do token', schema: usuarioRespostaSchema },
      erros: [401],
    }),
  },
}

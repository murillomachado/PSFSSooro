import {
  avaliacaoRespostaSchema,
  criarAvaliacaoSchema,
  editarAvaliacaoSchema,
  faixaImcRespostaSchema,
  idSchema,
  listarAvaliacoesQuerySchema,
  paginaDeAvaliacoesSchema,
} from '@psfssooro/contracts'
import { z } from 'zod'
import { type Caminhos, operacao } from '../../../shared/http/openapi.ts'

const TAG = 'Avaliações'
const TODOS = 'todos (o aluno só vê as próprias)'
const EQUIPE = 'administrador e professor'
const UMA_AVALIACAO = {
  status: 200,
  descricao: 'A avaliação, com o IMC e a classificação',
  schema: avaliacaoRespostaSchema,
}

/** A documentação de /api/avaliacoes, ao lado das rotas que ela descreve. */
export const CAMINHOS_DE_AVALIACOES: Caminhos = {
  '/api/avaliacoes': {
    get: operacao({
      resumo: 'Consultar avaliações, com filtro por aluno, professor e período (RF5, RN3, RN6, RN7)',
      tag: TAG,
      perfis: TODOS,
      consulta: listarAvaliacoesQuerySchema,
      sucesso: { status: 200, descricao: 'Uma página de avaliações', schema: paginaDeAvaliacoesSchema },
      erros: [400, 401],
    }),
    post: operacao({
      resumo: 'Registrar uma avaliação: a API calcula o IMC e a classificação (RF3, RF4, RN2, RN5, RN9)',
      tag: TAG,
      perfis: `${EQUIPE} (o administrador informa o professor)`,
      corpo: criarAvaliacaoSchema,
      sucesso: { ...UMA_AVALIACAO, status: 201 },
      erros: [400, 401, 403, 404, 422],
    }),
  },
  '/api/avaliacoes/faixas': {
    get: operacao({
      resumo: 'A tabela de classificação do IMC',
      tag: TAG,
      perfis: 'todos',
      sucesso: { status: 200, descricao: 'As faixas, em ordem', schema: z.array(faixaImcRespostaSchema) },
      erros: [401],
    }),
  },
  '/api/avaliacoes/{id}': {
    get: operacao({
      resumo: 'Ver uma avaliação',
      tag: TAG,
      perfis: TODOS,
      caminho: idSchema,
      sucesso: UMA_AVALIACAO,
      erros: [400, 401, 404],
    }),
    put: operacao({
      resumo: 'Editar uma avaliação: o IMC é recalculado (RN2, RN5)',
      tag: TAG,
      perfis: `${EQUIPE} (o professor, só as que realizou)`,
      caminho: idSchema,
      corpo: editarAvaliacaoSchema,
      sucesso: UMA_AVALIACAO,
      erros: [400, 401, 403, 404, 422],
    }),
    delete: operacao({
      resumo: 'Excluir uma avaliação (RN2)',
      tag: TAG,
      perfis: 'administrador',
      caminho: idSchema,
      sucesso: { status: 204, descricao: 'Excluída' },
      erros: [400, 401, 403, 404],
    }),
  },
}

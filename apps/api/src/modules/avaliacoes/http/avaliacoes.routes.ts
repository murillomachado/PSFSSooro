import {
  criarAvaliacaoSchema,
  editarAvaliacaoSchema,
  idSchema,
  listarAvaliacoesQuerySchema,
} from '@psfssooro/contracts'
import { Router } from 'express'
import { autorizar } from '../../../shared/http/autorizar.ts'
import { validar } from '../../../shared/http/validar.ts'
import type { AvaliacoesController } from './avaliacoes.controller.ts'

/** As rotas de /api/avaliacoes. Consultar vale para os três perfis (o aluno só vê as suas); escrever, não. */
export function criarRotasDeAvaliacoes(controller: AvaliacoesController): Router {
  const rotas = Router()
  const adminOuProfessor = autorizar('ADMINISTRADOR', 'PROFESSOR')

  rotas.get('/', validar({ consulta: listarAvaliacoesQuerySchema }), controller.listar)
  // Antes de /:id, senão "faixas" seria lido como um id.
  rotas.get('/faixas', controller.faixas)
  rotas.get('/:id', validar({ parametros: idSchema }), controller.obter)
  rotas.post('/', adminOuProfessor, validar({ corpo: criarAvaliacaoSchema }), controller.registrar)
  rotas.put(
    '/:id',
    adminOuProfessor,
    validar({ parametros: idSchema, corpo: editarAvaliacaoSchema }),
    controller.editar,
  )
  rotas.delete('/:id', autorizar('ADMINISTRADOR'), validar({ parametros: idSchema }), controller.excluir)
  return rotas
}

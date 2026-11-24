import {
  criarUsuarioSchema,
  editarUsuarioSchema,
  idSchema,
  listarUsuariosQuerySchema,
  situacaoSchema,
} from '@psfssooro/contracts'
import { Router } from 'express'
import { autorizar } from '../../../shared/http/autorizar.ts'
import { validar } from '../../../shared/http/validar.ts'
import type { UsuariosController } from './usuarios.controller.ts'

/** As rotas de /api/usuarios. A autenticação é aplicada na montagem do app; aqui ficam perfil e validação. */
export function criarRotasDeUsuarios(controller: UsuariosController): Router {
  const rotas = Router()
  const adminOuProfessor = autorizar('ADMINISTRADOR', 'PROFESSOR')

  rotas.get('/', adminOuProfessor, validar({ consulta: listarUsuariosQuerySchema }), controller.listar)
  rotas.get('/:id', adminOuProfessor, validar({ parametros: idSchema }), controller.obter)
  rotas.post('/', adminOuProfessor, validar({ corpo: criarUsuarioSchema }), controller.criar)
  rotas.put('/:id', adminOuProfessor, validar({ parametros: idSchema, corpo: editarUsuarioSchema }), controller.editar)
  rotas.patch(
    '/:id/situacao',
    autorizar('ADMINISTRADOR'),
    validar({ parametros: idSchema, corpo: situacaoSchema }),
    controller.alterarSituacao,
  )
  rotas.delete('/:id', autorizar('ADMINISTRADOR'), validar({ parametros: idSchema }), controller.excluir)
  return rotas
}

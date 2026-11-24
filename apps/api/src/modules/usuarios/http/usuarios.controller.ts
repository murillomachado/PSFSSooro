import type {
  CriarUsuarioEntrada,
  EditarUsuarioEntrada,
  ListarUsuariosQuery,
  SituacaoEntrada,
} from '@psfssooro/contracts'
import type { Request, Response } from 'express'
import { atorDe, idDaRota } from '../../../shared/http/locais.ts'
import type { AlterarSituacao } from '../application/alterar-situacao.ts'
import type { CriarUsuario } from '../application/criar-usuario.ts'
import type { EditarUsuario } from '../application/editar-usuario.ts'
import type { ListarUsuarios } from '../application/listar-usuarios.ts'
import type { ObterUsuario } from '../application/obter-usuario.ts'
import { paginaParaResposta, paraResposta } from './usuario.presenter.ts'

export interface CasosDeUsoDeUsuarios {
  readonly listar: ListarUsuarios
  readonly obter: ObterUsuario
  readonly criar: CriarUsuario
  readonly editar: EditarUsuario
  readonly alterarSituacao: AlterarSituacao
}

/** Só HTTP: lê a requisição já validada, chama o caso de uso e devolve a resposta. Nenhuma regra mora aqui. */
export class UsuariosController {
  constructor(private readonly casos: CasosDeUsoDeUsuarios) {}

  listar = async (_req: Request, res: Response): Promise<void> => {
    const pagina = await this.casos.listar.executar(atorDe(res), res.locals.consulta as ListarUsuariosQuery)
    res.json(paginaParaResposta(pagina))
  }

  obter = async (_req: Request, res: Response): Promise<void> => {
    res.json(paraResposta(await this.casos.obter.executar(atorDe(res), idDaRota(res))))
  }

  criar = async (req: Request, res: Response): Promise<void> => {
    const usuario = await this.casos.criar.executar(atorDe(res), req.body as CriarUsuarioEntrada)
    res.status(201).json(paraResposta(usuario))
  }

  editar = async (req: Request, res: Response): Promise<void> => {
    const usuario = await this.casos.editar.executar(atorDe(res), idDaRota(res), req.body as EditarUsuarioEntrada)
    res.json(paraResposta(usuario))
  }

  alterarSituacao = async (req: Request, res: Response): Promise<void> => {
    const { ativo } = req.body as SituacaoEntrada
    res.json(paraResposta(await this.casos.alterarSituacao.executar(atorDe(res), idDaRota(res), ativo)))
  }
}

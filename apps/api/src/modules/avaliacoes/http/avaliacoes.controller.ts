import type { CriarAvaliacaoEntrada, EditarAvaliacaoEntrada, ListarAvaliacoesQuery } from '@psfssooro/contracts'
import type { Request, Response } from 'express'
import { atorDe, idDaRota } from '../../../shared/http/locais.ts'
import type { ListarAvaliacoes, ObterAvaliacao } from '../application/consultar-avaliacoes.ts'
import type { EditarAvaliacao } from '../application/editar-avaliacao.ts'
import type { ExcluirAvaliacao } from '../application/excluir-avaliacao.ts'
import type { RegistrarAvaliacao } from '../application/registrar-avaliacao.ts'
import { FAIXAS_IMC } from '../domain/imc.ts'
import { faixasParaResposta, paginaParaResposta, paraResposta } from './avaliacao.presenter.ts'

export interface CasosDeUsoDeAvaliacoes {
  readonly listar: ListarAvaliacoes
  readonly obter: ObterAvaliacao
  readonly registrar: RegistrarAvaliacao
  readonly editar: EditarAvaliacao
  readonly excluir: ExcluirAvaliacao
}

/** Só HTTP: lê a requisição já validada, chama o caso de uso e devolve a resposta. */
export class AvaliacoesController {
  constructor(private readonly casos: CasosDeUsoDeAvaliacoes) {}

  faixas = (_req: Request, res: Response): void => {
    res.json(faixasParaResposta(FAIXAS_IMC))
  }

  listar = async (_req: Request, res: Response): Promise<void> => {
    const pagina = await this.casos.listar.executar(atorDe(res), res.locals.consulta as ListarAvaliacoesQuery)
    res.json(paginaParaResposta(pagina))
  }

  obter = async (_req: Request, res: Response): Promise<void> => {
    res.json(paraResposta(await this.casos.obter.executar(atorDe(res), idDaRota(res))))
  }

  registrar = async (req: Request, res: Response): Promise<void> => {
    const avaliacao = await this.casos.registrar.executar(atorDe(res), req.body as CriarAvaliacaoEntrada)
    res.status(201).json(paraResposta(avaliacao))
  }

  editar = async (req: Request, res: Response): Promise<void> => {
    const avaliacao = await this.casos.editar.executar(atorDe(res), idDaRota(res), req.body as EditarAvaliacaoEntrada)
    res.json(paraResposta(avaliacao))
  }

  excluir = async (_req: Request, res: Response): Promise<void> => {
    await this.casos.excluir.executar(atorDe(res), idDaRota(res))
    res.status(204).end()
  }
}

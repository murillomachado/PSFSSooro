import type { LoginEntrada, LoginResposta } from '@psfssooro/contracts'
import type { Request, Response } from 'express'
import { atorDe } from '../../../shared/http/locais.ts'
import { apagarSessao, gravarSessao, type OpcoesDaSessao } from '../../../shared/http/sessao.ts'
import { paraResposta } from '../../usuarios/http/usuario.presenter.ts'
import type { AutenticarUsuario } from '../application/autenticar-usuario.ts'
import type { ObterSessao } from '../application/obter-sessao.ts'

export class AuthController {
  constructor(
    private readonly autenticarUsuario: AutenticarUsuario,
    private readonly obterSessao: ObterSessao,
    private readonly sessao: OpcoesDaSessao,
  ) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { token, usuario } = await this.autenticarUsuario.executar(req.body as LoginEntrada)
    // A Web usa o cookie; o token também vai no corpo para clientes da API (curl, Swagger).
    gravarSessao(res, token, this.sessao)
    const resposta: LoginResposta = { token, usuario: paraResposta(usuario) }
    res.json(resposta)
  }

  logout = (_req: Request, res: Response): void => {
    apagarSessao(res, this.sessao)
    res.status(204).end()
  }

  me = async (_req: Request, res: Response): Promise<void> => {
    res.json(paraResposta(await this.obterSessao.executar(atorDe(res))))
  }
}

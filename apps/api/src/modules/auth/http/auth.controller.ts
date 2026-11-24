import type { LoginEntrada, LoginResposta } from '@psfssooro/contracts'
import type { Request, Response } from 'express'
import { atorDe } from '../../../shared/http/locais.ts'
import { paraResposta } from '../../usuarios/http/usuario.presenter.ts'
import type { AutenticarUsuario } from '../application/autenticar-usuario.ts'
import type { ObterSessao } from '../application/obter-sessao.ts'

export class AuthController {
  constructor(
    private readonly autenticarUsuario: AutenticarUsuario,
    private readonly obterSessao: ObterSessao,
  ) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { token, usuario } = await this.autenticarUsuario.executar(req.body as LoginEntrada)
    const resposta: LoginResposta = { token, usuario: paraResposta(usuario) }
    res.json(resposta)
  }

  me = async (_req: Request, res: Response): Promise<void> => {
    res.json(paraResposta(await this.obterSessao.executar(atorDe(res))))
  }
}

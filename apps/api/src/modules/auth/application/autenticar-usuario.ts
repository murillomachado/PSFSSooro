import type { LoginEntrada } from '@psfssooro/contracts'
import { NaoAutenticado, SemPermissao } from '../../../shared/errors/erros.ts'
import type { GeradorDeToken, HasherDeSenha } from '../../../shared/security/portas.ts'
import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import type { Usuario } from '../../usuarios/domain/usuario.ts'

export interface ResultadoDoLogin {
  readonly token: string
  readonly usuario: Usuario
}

/** Login com usuário e senha (RF6). Usuário inativo não entra (RN8). */
export class AutenticarUsuario {
  private hashFalso: Promise<string> | undefined

  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: HasherDeSenha,
    private readonly tokens: GeradorDeToken,
  ) {}

  async executar(entrada: LoginEntrada): Promise<ResultadoDoLogin> {
    const usuario = await this.usuarios.buscarPorUsuario(entrada.usuario)
    // Mesmo sem usuário, a senha é conferida contra um hash falso: o tempo de resposta e a mensagem
    // são iguais para "usuário inexistente" e "senha errada", e ninguém descobre quem tem conta.
    const hash = usuario?.senhaHash ?? (await this.obterHashFalso())
    const senhaCorreta = await this.hasher.conferir(entrada.senha, hash)
    if (usuario === undefined || !senhaCorreta) {
      throw new NaoAutenticado('Usuário ou senha inválidos.', 'CREDENCIAIS_INVALIDAS')
    }
    // Só quem acerta a senha fica sabendo que a conta está inativa.
    if (!usuario.ativo) {
      throw new SemPermissao('Este usuário está inativo. Procure a academia.', 'USUARIO_INATIVO')
    }
    return { token: this.tokens.gerar(usuario.id), usuario }
  }

  private obterHashFalso(): Promise<string> {
    this.hashFalso ??= this.hasher.gerar('senha-que-nao-pertence-a-ninguem')
    return this.hashFalso
  }
}

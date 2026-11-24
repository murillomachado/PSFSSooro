import { randomUUID } from 'node:crypto'
import type { Express } from 'express'
import { criarApp } from './app.ts'
import type { Env } from './config/env.ts'
import { AutenticarUsuario } from './modules/auth/application/autenticar-usuario.ts'
import { ObterSessao } from './modules/auth/application/obter-sessao.ts'
import { AuthController } from './modules/auth/http/auth.controller.ts'
import { criarRotasDeAuth } from './modules/auth/http/auth.routes.ts'
import { AlterarSituacao } from './modules/usuarios/application/alterar-situacao.ts'
import { CriarUsuario } from './modules/usuarios/application/criar-usuario.ts'
import { EditarUsuario } from './modules/usuarios/application/editar-usuario.ts'
import { ListarUsuarios } from './modules/usuarios/application/listar-usuarios.ts'
import { ObterUsuario } from './modules/usuarios/application/obter-usuario.ts'
import { UsuariosController } from './modules/usuarios/http/usuarios.controller.ts'
import { criarRotasDeUsuarios } from './modules/usuarios/http/usuarios.routes.ts'
import { TypeOrmUsuarioRepository } from './modules/usuarios/infra/typeorm-usuario.repository.ts'
import type { DataSource } from './shared/database/data-source.ts'
import { autenticar, type ProvedorDeAtor } from './shared/http/autenticar.ts'
import { HasherScrypt } from './shared/security/hasher-scrypt.ts'
import { relogioDoSistema } from './shared/security/relogio.ts'
import { TokenJwt } from './shared/security/token-jwt.ts'

/**
 * Raiz de composição: o único lugar que escolhe as implementações (SQLite, scrypt, JWT, relógio
 * do sistema) e as entrega pelo construtor. Os casos de uso só conhecem as interfaces.
 */
export function montarApp(env: Env, banco: DataSource): Express {
  const hasher = new HasherScrypt()
  const tokens = new TokenJwt(env.segredoJwt, env.expiracaoDoTokenEmSegundos)
  const usuarios = new TypeOrmUsuarioRepository(banco)

  const provedorDeAtor: ProvedorDeAtor = {
    buscarAtor: async (usuarioId) => {
      const usuario = await usuarios.buscarPorId(usuarioId)
      return usuario?.ativo === true ? { id: usuario.id, perfil: usuario.perfil } : undefined
    },
  }
  const autenticarRequisicao = autenticar(tokens, provedorDeAtor)

  const authController = new AuthController(new AutenticarUsuario(usuarios, hasher, tokens), new ObterSessao(usuarios))
  const usuariosController = new UsuariosController({
    listar: new ListarUsuarios(usuarios),
    obter: new ObterUsuario(usuarios),
    criar: new CriarUsuario(usuarios, hasher, relogioDoSistema, randomUUID),
    editar: new EditarUsuario(usuarios, hasher, relogioDoSistema),
    alterarSituacao: new AlterarSituacao(usuarios, relogioDoSistema),
  })

  return criarApp({
    origemCors: env.origemCors,
    autenticar: autenticarRequisicao,
    rotasDeAuth: criarRotasDeAuth(authController, autenticarRequisicao),
    rotasDeUsuarios: criarRotasDeUsuarios(usuariosController),
    registrarErro: (erro) => {
      console.error(erro)
    },
  })
}

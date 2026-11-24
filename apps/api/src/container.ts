import { randomUUID } from 'node:crypto'
import type { Express } from 'express'
import { criarApp } from './app.ts'
import type { Env } from './config/env.ts'
import { AutenticarUsuario } from './modules/auth/application/autenticar-usuario.ts'
import { ObterSessao } from './modules/auth/application/obter-sessao.ts'
import { CAMINHOS_DE_AUTH } from './modules/auth/http/auth.openapi.ts'
import { AuthController } from './modules/auth/http/auth.controller.ts'
import { criarRotasDeAuth } from './modules/auth/http/auth.routes.ts'
import { ListarAvaliacoes, ObterAvaliacao } from './modules/avaliacoes/application/consultar-avaliacoes.ts'
import { EditarAvaliacao } from './modules/avaliacoes/application/editar-avaliacao.ts'
import { ExcluirAvaliacao } from './modules/avaliacoes/application/excluir-avaliacao.ts'
import { RegistrarAvaliacao } from './modules/avaliacoes/application/registrar-avaliacao.ts'
import { AvaliacoesController } from './modules/avaliacoes/http/avaliacoes.controller.ts'
import { CAMINHOS_DE_AVALIACOES } from './modules/avaliacoes/http/avaliacoes.openapi.ts'
import { criarRotasDeAvaliacoes } from './modules/avaliacoes/http/avaliacoes.routes.ts'
import { TypeOrmAvaliacaoRepository } from './modules/avaliacoes/infra/typeorm-avaliacao.repository.ts'
import { AlterarSituacao } from './modules/usuarios/application/alterar-situacao.ts'
import { CriarUsuario } from './modules/usuarios/application/criar-usuario.ts'
import { EditarUsuario } from './modules/usuarios/application/editar-usuario.ts'
import { ExcluirUsuario } from './modules/usuarios/application/excluir-usuario.ts'
import { ListarUsuarios } from './modules/usuarios/application/listar-usuarios.ts'
import { ObterUsuario } from './modules/usuarios/application/obter-usuario.ts'
import { UsuariosController } from './modules/usuarios/http/usuarios.controller.ts'
import { CAMINHOS_DE_USUARIOS } from './modules/usuarios/http/usuarios.openapi.ts'
import { criarRotasDeUsuarios } from './modules/usuarios/http/usuarios.routes.ts'
import { TypeOrmUsuarioRepository } from './modules/usuarios/infra/typeorm-usuario.repository.ts'
import type { DataSource } from './shared/database/data-source.ts'
import { autenticar, type ProvedorDeAtor } from './shared/http/autenticar.ts'
import { criarRotasDaDocumentacao, documentoOpenApi } from './shared/http/documentacao.ts'
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
  const avaliacoes = new TypeOrmAvaliacaoRepository(banco)
  const vinculos = { possuiAvaliacoes: (id: string) => avaliacoes.usuarioPossuiAvaliacoes(id) }

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
    editar: new EditarUsuario(usuarios, hasher, relogioDoSistema, vinculos),
    alterarSituacao: new AlterarSituacao(usuarios, relogioDoSistema),
    excluir: new ExcluirUsuario(usuarios, vinculos),
  })
  const avaliacoesController = new AvaliacoesController({
    listar: new ListarAvaliacoes(avaliacoes, usuarios),
    obter: new ObterAvaliacao(avaliacoes, usuarios),
    registrar: new RegistrarAvaliacao(avaliacoes, usuarios, relogioDoSistema, randomUUID),
    editar: new EditarAvaliacao(avaliacoes, usuarios, relogioDoSistema),
    excluir: new ExcluirAvaliacao(avaliacoes),
  })

  return criarApp({
    origemCors: env.origemCors,
    autenticar: autenticarRequisicao,
    rotasDeAuth: criarRotasDeAuth(authController, autenticarRequisicao),
    rotasDeUsuarios: criarRotasDeUsuarios(usuariosController),
    rotasDeAvaliacoes: criarRotasDeAvaliacoes(avaliacoesController),
    rotasDaDocumentacao: criarRotasDaDocumentacao(
      documentoOpenApi([CAMINHOS_DE_AUTH, CAMINHOS_DE_USUARIOS, CAMINHOS_DE_AVALIACOES]),
    ),
    registrarErro: (erro) => {
      console.error(erro)
    },
  })
}

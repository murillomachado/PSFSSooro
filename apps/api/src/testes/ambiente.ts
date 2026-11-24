import { randomUUID } from 'node:crypto'
import type { LoginResposta } from '@psfssooro/contracts'
import type { Express } from 'express'
import request, { type Test } from 'supertest'
import type { Env } from '../config/env.ts'
import { montarApp } from '../container.ts'
import { TypeOrmAvaliacaoRepository } from '../modules/avaliacoes/infra/typeorm-avaliacao.repository.ts'
import { TypeOrmUsuarioRepository } from '../modules/usuarios/infra/typeorm-usuario.repository.ts'
import { SENHA_DEMO, semear } from '../seed/semear.ts'
import { criarBancoEmMemoria } from '../shared/database/banco-em-memoria.ts'
import type { DataSource } from '../shared/database/data-source.ts'
import { HasherScrypt } from '../shared/security/hasher-scrypt.ts'
import { relogioDoSistema } from '../shared/security/relogio.ts'

export const ENV_DE_TESTE: Env = {
  ambiente: 'test',
  porta: 0,
  caminhoDoBanco: ':memory:',
  segredoJwt: 'um-segredo-de-teste-com-mais-de-trinta-e-dois-caracteres',
  expiracaoDoTokenEmSegundos: 3600,
  origemCors: 'http://localhost:3000',
  cookieSeguro: false,
}

/** Chamadas HTTP já autenticadas com um token. */
export interface ClienteAutenticado {
  get(url: string): Test
  post(url: string): Test
  put(url: string): Test
  patch(url: string): Test
  delete(url: string): Test
}

export interface Ambiente {
  readonly app: Express
  readonly banco: DataSource
  /** Faz login com a senha de demonstração e devolve o token. */
  entrar(usuario: string): Promise<string>
  /** O id de um usuário do seed. */
  idDe(usuario: string): Promise<string>
  como(token: string): ClienteAutenticado
}

/** A API inteira, com um SQLite em memória, as migrations de verdade e os usuários de demonstração. */
export async function criarAmbiente(): Promise<Ambiente> {
  const banco = await criarBancoEmMemoria()
  const usuarios = new TypeOrmUsuarioRepository(banco)
  const avaliacoes = new TypeOrmAvaliacaoRepository(banco)
  await semear({ usuarios, avaliacoes, hasher: new HasherScrypt(), relogio: relogioDoSistema, gerarId: randomUUID })
  const app = montarApp(ENV_DE_TESTE, banco)

  const como = (token: string): ClienteAutenticado => {
    const autenticar = (teste: Test): Test => teste.set('Authorization', `Bearer ${token}`)
    return {
      get: (url) => autenticar(request(app).get(url)),
      post: (url) => autenticar(request(app).post(url)),
      put: (url) => autenticar(request(app).put(url)),
      patch: (url) => autenticar(request(app).patch(url)),
      delete: (url) => autenticar(request(app).delete(url)),
    }
  }

  return {
    app,
    banco,
    como,
    entrar: async (usuario) => {
      const resposta = await request(app).post('/api/auth/login').send({ usuario, senha: SENHA_DEMO })
      return (resposta.body as LoginResposta).token
    },
    idDe: async (usuario) => {
      const encontrado = await usuarios.buscarPorUsuario(usuario)
      if (encontrado === undefined) throw new Error(`Usuário de demonstração inexistente: ${usuario}`)
      return encontrado.id
    },
  }
}

import { randomUUID } from 'node:crypto'
import type { Ator } from '../../../shared/security/ator.ts'
import type { HasherDeSenha, Relogio } from '../../../shared/security/portas.ts'
import type { VinculosDoUsuario } from '../application/vinculos.ts'
import type { Usuario } from '../domain/usuario.ts'
import { MemoriaUsuarioRepository } from '../infra/memoria-usuario.repository.ts'

export const AGORA = '2026-11-25T10:00:00.000Z'
export const DEPOIS = '2026-11-26T09:30:00.000Z'

export const relogioFixo = (instante = AGORA): Relogio => ({ agora: () => new Date(instante) })

/** Hasher de teste: previsível e instantâneo. O scrypt de verdade tem os seus próprios testes. */
export const hasherFalso: HasherDeSenha = {
  gerar: (senha) => Promise.resolve(`hash(${senha})`),
  conferir: (senha, hash) => Promise.resolve(hash === `hash(${senha})`),
}

export const ADMIN: Ator = { id: 'admin-1', perfil: 'ADMINISTRADOR' }
export const PROFESSOR: Ator = { id: 'professor-1', perfil: 'PROFESSOR' }
export const ALUNO: Ator = { id: 'aluno-1', perfil: 'ALUNO' }

export function novoUsuario(parcial: Partial<Usuario> = {}): Usuario {
  return {
    id: randomUUID(),
    nome: 'Ana Souza',
    usuario: 'aluno.ana',
    senhaHash: 'hash(senha1234)',
    perfil: 'ALUNO',
    ativo: true,
    criadoEm: AGORA,
    atualizadoEm: AGORA,
    ...parcial,
  }
}

/** O administrador que está fazendo a ação, gravado no repositório com o mesmo id do ator ADMIN. */
export const administrador = (parcial: Partial<Usuario> = {}): Usuario =>
  novoUsuario({ id: ADMIN.id, nome: 'Administrador', usuario: 'admin', perfil: 'ADMINISTRADOR', ...parcial })

/** Nenhum usuário tem avaliações: o caso comum dos testes de usuários. */
export const semVinculos: VinculosDoUsuario = { possuiAvaliacoes: () => Promise.resolve(false) }

export async function repositorioCom(...usuarios: Usuario[]): Promise<MemoriaUsuarioRepository> {
  const repositorio = new MemoriaUsuarioRepository()
  for (const usuario of usuarios) await repositorio.salvar(usuario)
  return repositorio
}

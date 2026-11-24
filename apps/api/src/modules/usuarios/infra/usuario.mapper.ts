import { perfilSchema } from '@psfssooro/contracts'
import type { Usuario } from '../domain/usuario.ts'
import { UsuarioEntity } from './usuario.entity.ts'

/** Converte a linha do banco no tipo do domínio. Um perfil fora da lista (banco adulterado) falha na hora. */
export function paraDominio(entidade: UsuarioEntity): Usuario {
  return {
    id: entidade.id,
    nome: entidade.nome,
    usuario: entidade.usuario,
    senhaHash: entidade.senhaHash,
    perfil: perfilSchema.parse(entidade.perfil),
    ativo: entidade.ativo,
    criadoEm: entidade.criadoEm,
    atualizadoEm: entidade.atualizadoEm,
  }
}

export function paraPersistencia(usuario: Usuario): UsuarioEntity {
  return Object.assign(new UsuarioEntity(), usuario)
}

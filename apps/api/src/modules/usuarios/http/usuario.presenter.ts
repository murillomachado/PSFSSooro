import type { PaginaDeUsuarios, UsuarioResposta } from '@psfssooro/contracts'
import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { Usuario } from '../domain/usuario.ts'

/** O que a API devolve de um usuário. O hash da senha nunca sai daqui. */
export function paraResposta(usuario: Usuario): UsuarioResposta {
  return {
    id: usuario.id,
    nome: usuario.nome,
    usuario: usuario.usuario,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    criadoEm: usuario.criadoEm,
    atualizadoEm: usuario.atualizadoEm,
  }
}

export function paginaParaResposta(pagina: PaginaDe<Usuario>): PaginaDeUsuarios {
  return { ...pagina, itens: pagina.itens.map(paraResposta) }
}

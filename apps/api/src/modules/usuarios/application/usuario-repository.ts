import type { Perfil } from '@psfssooro/contracts'
import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { Usuario } from '../domain/usuario.ts'

export interface FiltrosDeUsuario {
  /** Perfis que a consulta pode devolver. Já vem restrito ao que o ator enxerga. */
  readonly perfis: readonly Perfil[]
  readonly ativo?: boolean
  /** Trecho do nome ou do nome de usuário. */
  readonly busca?: string
  readonly pagina: number
  readonly limite: number
}

/** O que os casos de uso precisam para guardar e achar usuários. Quem implementa é a camada infra/. */
export interface UsuarioRepository {
  buscarPorId(id: string): Promise<Usuario | undefined>
  /** Busca pelo nome de usuário do login, sempre em minúsculas. */
  buscarPorUsuario(usuario: string): Promise<Usuario | undefined>
  /** Os usuários que existem entre os ids pedidos (ids desconhecidos são ignorados). */
  buscarPorIds(ids: readonly string[]): Promise<Usuario[]>
  listar(filtros: FiltrosDeUsuario): Promise<PaginaDe<Usuario>>
  /** Cria o usuário, ou atualiza se o id já existe. */
  salvar(usuario: Usuario): Promise<void>
  excluir(id: string): Promise<void>
  contarAdministradoresAtivos(): Promise<number>
}

import { LIMITE_MAXIMO, type Perfil } from '@psfssooro/contracts'
import type { FiltrosDaLista } from './services/usuarios.service.ts'

/**
 * As chaves das consultas de usuários. Ficam fora dos hooks (que só rodam no navegador) porque o
 * servidor usa as mesmas para entregar a página com os dados já carregados.
 */
export const CHAVE_DE_USUARIOS = 'usuarios'

export const chavesDeUsuarios = {
  lista: (filtros: FiltrosDaLista) => [CHAVE_DE_USUARIOS, 'lista', filtros] as const,
  um: (id: string) => [CHAVE_DE_USUARIOS, 'um', id] as const,
  escolha: (perfil: Perfil, somenteAtivos: boolean) => [CHAVE_DE_USUARIOS, 'escolha', perfil, somenteAtivos] as const,
}

/** Os filtros de uma lista de seleção (aluno ou professor), até o máximo de uma página da API. */
export const filtrosParaEscolha = (perfil: Perfil, somenteAtivos: boolean): FiltrosDaLista => ({
  pagina: 1,
  limite: LIMITE_MAXIMO,
  perfil,
  ...(somenteAtivos ? { ativo: true } : {}),
})

/** Os filtros com que a lista abre: a primeira página, sem filtro nenhum. */
export const PRIMEIRA_PAGINA: FiltrosDaLista = { pagina: 1 }

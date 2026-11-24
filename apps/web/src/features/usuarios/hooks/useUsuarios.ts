'use client'

import type { CriarUsuarioEntrada, EditarUsuarioEntrada, Perfil } from '@psfssooro/contracts'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  alterarSituacao,
  criarUsuario,
  editarUsuario,
  excluirUsuario,
  type FiltrosDaLista,
  listarUsuarios,
  obterUsuario,
} from '../services/usuarios.service.ts'

const CHAVE = 'usuarios'

export const useListaDeUsuarios = (filtros: FiltrosDaLista) =>
  useQuery({
    queryKey: [CHAVE, 'lista', filtros],
    queryFn: () => listarUsuarios(filtros),
    placeholderData: keepPreviousData,
  })

export const useUsuario = (id: string) =>
  useQuery({ queryKey: [CHAVE, 'um', id], queryFn: () => obterUsuario(id), gcTime: 0 })

/** Depois de qualquer mudança, as listas e os detalhes em cache são refeitos. */
function useMutacao<T>(funcao: (entrada: T) => Promise<unknown>) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: funcao,
    onSuccess: () => cliente.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export const useCriarUsuario = () => useMutacao((entrada: CriarUsuarioEntrada) => criarUsuario(entrada))

export const useEditarUsuario = (id: string) =>
  useMutacao((entrada: EditarUsuarioEntrada) => editarUsuario(id, entrada))

export const useAlterarSituacao = () =>
  useMutacao((alvo: { id: string; ativo: boolean }) => alterarSituacao(alvo.id, alvo.ativo))

export const useExcluirUsuario = () => useMutacao((id: string) => excluirUsuario(id))

/** Quem pode ser escolhido numa lista de seleção (aluno ou professor), até o máximo de uma página da API. */
export const useUsuariosParaEscolha = (perfil: Perfil, somenteAtivos: boolean, habilitado = true) =>
  useQuery({
    queryKey: [CHAVE, 'escolha', perfil, somenteAtivos],
    queryFn: () => listarUsuarios({ pagina: 1, limite: 100, perfil, ...(somenteAtivos ? { ativo: true } : {}) }),
    enabled: habilitado,
  })

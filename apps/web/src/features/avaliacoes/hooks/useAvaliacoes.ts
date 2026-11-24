'use client'

import type { CriarAvaliacaoEntrada, EditarAvaliacaoEntrada } from '@psfssooro/contracts'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  criarAvaliacao,
  editarAvaliacao,
  excluirAvaliacao,
  type FiltrosDeAvaliacoes,
  listarAvaliacoes,
  obterAvaliacao,
} from '../services/avaliacoes.service.ts'

const CHAVE = 'avaliacoes'

export const useListaDeAvaliacoes = (filtros: FiltrosDeAvaliacoes) =>
  useQuery({
    queryKey: [CHAVE, 'lista', filtros],
    queryFn: () => listarAvaliacoes(filtros),
    placeholderData: keepPreviousData,
  })

export const useAvaliacao = (id: string) =>
  useQuery({ queryKey: [CHAVE, 'uma', id], queryFn: () => obterAvaliacao(id), gcTime: 0 })

/** Depois de qualquer mudança, as listas e os detalhes em cache são refeitos. */
function useMutacao<T>(funcao: (entrada: T) => Promise<unknown>) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: funcao,
    onSuccess: () => cliente.invalidateQueries({ queryKey: [CHAVE] }),
  })
}

export const useCriarAvaliacao = () => useMutacao((entrada: CriarAvaliacaoEntrada) => criarAvaliacao(entrada))

export const useEditarAvaliacao = (id: string) =>
  useMutacao((entrada: EditarAvaliacaoEntrada) => editarAvaliacao(id, entrada))

export const useExcluirAvaliacao = () => useMutacao((id: string) => excluirAvaliacao(id))

'use client'

import type { CriarAvaliacaoEntrada, EditarAvaliacaoEntrada } from '@psfssooro/contracts'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  criarAvaliacao,
  editarAvaliacao,
  excluirAvaliacao,
  type FiltrosDeAvaliacoes,
  listarAvaliacoes,
  listarFaixasImc,
  obterAvaliacao,
} from '../services/avaliacoes.service.ts'
import { CHAVE_DE_AVALIACOES, chavesDeAvaliacoes, filtrosDoHistorico } from '../chaves.ts'

export const useListaDeAvaliacoes = (filtros: FiltrosDeAvaliacoes) =>
  useQuery({
    queryKey: chavesDeAvaliacoes.lista(filtros),
    queryFn: () => listarAvaliacoes(filtros),
    placeholderData: keepPreviousData,
  })

/** A tabela de faixas não muda enquanto o sistema está no ar: é pedida uma vez só. */
export const useFaixasImc = () =>
  useQuery({
    queryKey: chavesDeAvaliacoes.faixas(),
    queryFn: () => listarFaixasImc(),
    staleTime: Number.POSITIVE_INFINITY,
  })

/** Todo o histórico de um aluno (até o teto de paginação da API), para o gráfico de evolução. */
export const useHistoricoDoAluno = (alunoId: string) =>
  useQuery({
    queryKey: chavesDeAvaliacoes.lista(filtrosDoHistorico(alunoId)),
    queryFn: () => listarAvaliacoes(filtrosDoHistorico(alunoId)),
  })

export const useAvaliacao = (id: string) =>
  useQuery({ queryKey: chavesDeAvaliacoes.uma(id), queryFn: () => obterAvaliacao(id), gcTime: 0 })

/** Depois de qualquer mudança, as listas e os detalhes em cache são refeitos. */
function useMutacao<T>(funcao: (entrada: T) => Promise<unknown>) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: funcao,
    onSuccess: () => cliente.invalidateQueries({ queryKey: [CHAVE_DE_AVALIACOES] }),
  })
}

export const useCriarAvaliacao = () => useMutacao((entrada: CriarAvaliacaoEntrada) => criarAvaliacao(entrada))

export const useEditarAvaliacao = (id: string) =>
  useMutacao((entrada: EditarAvaliacaoEntrada) => editarAvaliacao(id, entrada))

export const useExcluirAvaliacao = () => useMutacao((id: string) => excluirAvaliacao(id))

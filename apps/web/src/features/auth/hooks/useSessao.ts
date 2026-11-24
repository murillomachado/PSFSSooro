'use client'

import type { LoginEntrada, UsuarioResposta } from '@psfssooro/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { aoPerderASessaoFazer } from '@/lib/http-client.ts'
import { entrar, obterSessao, sairDaSessao } from '../services/auth.service.ts'

const CHAVE_DA_SESSAO = ['sessao'] as const

export interface Sessao {
  /** Enquanto a API não responde quem está logado, ainda não se sabe se há sessão. */
  readonly carregando: boolean
  readonly usuario: UsuarioResposta | undefined
  readonly sair: () => void
}

/** A sessão da pessoa logada: pergunta à API quem é (o cookie vai sozinho) e sabe sair. */
export function useSessao(): Sessao {
  const roteador = useRouter()
  const clienteDeConsultas = useQueryClient()
  const consulta = useQuery({ queryKey: CHAVE_DA_SESSAO, queryFn: obterSessao, retry: false })

  const sair = useCallback(() => {
    // Mesmo que a API não responda, a tela volta ao login; o cookie expira sozinho.
    void sairDaSessao()
      .catch(() => undefined)
      .finally(() => {
        clienteDeConsultas.clear()
        roteador.replace('/login')
      })
  }, [clienteDeConsultas, roteador])

  return { carregando: consulta.isPending, usuario: consulta.data, sair }
}

/**
 * Quando a API recusa a sessão (401), ela acabou: sai e volta ao login. Só o layout da área
 * autenticada chama isto, uma vez; páginas que só leem a sessão usam `useSessao`.
 */
export function useSairAoPerderASessao(sair: () => void): void {
  useEffect(() => {
    aoPerderASessaoFazer(sair)
    return () => {
      aoPerderASessaoFazer(undefined)
    }
  }, [sair])
}

/** Faz o login: a API grava o cookie; aqui o usuário entra na sessão e a tela vai para o início. */
export function useEntrar() {
  const roteador = useRouter()
  const clienteDeConsultas = useQueryClient()
  return useMutation({
    mutationFn: (entrada: LoginEntrada) => entrar(entrada),
    onSuccess: ({ usuario }) => {
      clienteDeConsultas.setQueryData(CHAVE_DA_SESSAO, usuario)
      roteador.replace('/inicio')
    },
  })
}

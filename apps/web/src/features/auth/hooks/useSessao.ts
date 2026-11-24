'use client'

import type { LoginEntrada, UsuarioResposta } from '@psfssooro/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { aoPerderASessaoFazer } from '@/lib/http-client.ts'
import { tokenStorage } from '@/lib/tokenStorage.ts'
import { entrar, obterSessao } from '../services/auth.service.ts'

const CHAVE_DA_SESSAO = ['sessao'] as const

export interface Sessao {
  /** Enquanto o app confere o token guardado, ainda não se sabe se há sessão. */
  readonly carregando: boolean
  readonly usuario: UsuarioResposta | undefined
  readonly sair: () => void
}

/** A sessão da pessoa logada: lê o token guardado, confirma na API quem é e sabe sair. */
export function useSessao(): Sessao {
  const roteador = useRouter()
  const clienteDeConsultas = useQueryClient()
  // O token só existe no navegador: lê-lo depois da montagem evita divergência com o HTML do servidor.
  const [temToken, definirTemToken] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    definirTemToken(tokenStorage.obter() !== undefined)
  }, [])

  const consulta = useQuery({
    queryKey: CHAVE_DA_SESSAO,
    queryFn: obterSessao,
    enabled: temToken === true,
    retry: false,
  })

  const sair = useCallback(() => {
    tokenStorage.limpar()
    clienteDeConsultas.clear()
    roteador.replace('/login')
  }, [clienteDeConsultas, roteador])

  return { carregando: temToken === undefined || (temToken && consulta.isPending), usuario: consulta.data, sair }
}

/**
 * Quando a API recusa o token (401), a sessão acabou: sai e volta ao login. Só o layout da área
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

/** Faz o login: guarda o token, põe o usuário na sessão e vai para o início. */
export function useEntrar() {
  const roteador = useRouter()
  const clienteDeConsultas = useQueryClient()
  return useMutation({
    mutationFn: (entrada: LoginEntrada) => entrar(entrada),
    onSuccess: ({ token, usuario }) => {
      tokenStorage.salvar(token)
      clienteDeConsultas.setQueryData(CHAVE_DA_SESSAO, usuario)
      roteador.replace('/inicio')
    },
  })
}

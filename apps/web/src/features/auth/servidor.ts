import type { UsuarioResposta } from '@psfssooro/contracts'
import { cache } from 'react'
import { clienteDaRequisicao } from '@/lib/servidor.ts'
import { obterSessao } from './services/auth.service.ts'

/** Quem está logado, perguntado à API pelo servidor da Web; uma vez só por requisição. */
export const sessaoNoServidor = cache(async (): Promise<UsuarioResposta | undefined> => {
  try {
    return await obterSessao(await clienteDaRequisicao())
  } catch {
    return undefined
  }
})

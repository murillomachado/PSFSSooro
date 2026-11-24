import { cookies } from 'next/headers'
import { cache } from 'react'
import { type ClienteHttp, clienteDoServidor } from './http-client.ts'

/**
 * O cliente HTTP desta requisição, com o cookie da sessão que chegou junto. Só roda no servidor;
 * o `cache` do React faz o layout e a página dividirem o mesmo cliente na mesma requisição.
 */
export const clienteDaRequisicao = cache(async (): Promise<ClienteHttp> => {
  const sessao = (await cookies()).get('sessao')?.value
  return clienteDoServidor(sessao)
})

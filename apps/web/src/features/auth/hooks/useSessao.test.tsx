// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/lib/http-client.ts'
import { tokenStorage } from '@/lib/tokenStorage.ts'
import { useSairAoPerderASessao, useSessao } from './useSessao.ts'

const substituir = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: substituir }) }))

function Vigia() {
  const { sair } = useSessao()
  useSairAoPerderASessao(sair)
  return null
}

function SoLeASessao() {
  useSessao()
  return null
}

const respostaDe = (status: number) => (config: Parameters<NonNullable<typeof http.defaults.adapter>>[0]) =>
  Promise.reject(Object.assign(new Error('401'), { isAxiosError: true, config, response: { status, data: {} } }))

describe('sessão perdida', () => {
  beforeEach(() => {
    window.localStorage.clear()
    substituir.mockReset()
  })
  afterEach(cleanup)

  it('um 401 leva ao login mesmo depois de outra tela que só lê a sessão ser desmontada', async () => {
    tokenStorage.salvar('vencido')
    const cliente = new QueryClient()
    const embrulho = (filhos: React.ReactNode) => <QueryClientProvider client={cliente}>{filhos}</QueryClientProvider>
    render(embrulho(<Vigia />))
    const outra = render(embrulho(<SoLeASessao />))
    outra.unmount()

    await http.get('/usuarios', { adapter: respostaDe(401) as never }).catch(() => undefined)

    expect(tokenStorage.obter()).toBeUndefined()
    expect(substituir).toHaveBeenCalledWith('/login')
  })
})

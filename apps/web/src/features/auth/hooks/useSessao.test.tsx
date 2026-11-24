// @vitest-environment jsdom
import type { InternalAxiosRequestConfig } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/lib/http-client.ts'
import { obterSessao, sairDaSessao } from '../services/auth.service.ts'
import { useSairAoPerderASessao, useSessao } from './useSessao.ts'

const substituir = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: substituir }) }))
vi.mock('../services/auth.service.ts', () => ({ entrar: vi.fn(), obterSessao: vi.fn(), sairDaSessao: vi.fn() }))

function Vigia() {
  const { sair } = useSessao()
  useSairAoPerderASessao(sair)
  return null
}

function SoLeASessao() {
  useSessao()
  return null
}

const respostaDe = (status: number) => (config: InternalAxiosRequestConfig) =>
  Promise.reject(Object.assign(new Error('401'), { isAxiosError: true, config, response: { status, data: {} } }))

describe('sessão perdida', () => {
  beforeEach(() => {
    substituir.mockReset()
    vi.mocked(obterSessao).mockReset().mockRejectedValue(new Error('401'))
    vi.mocked(sairDaSessao).mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('um 401 leva ao login mesmo depois de outra tela que só lê a sessão ser desmontada', async () => {
    const cliente = new QueryClient()
    const embrulho = (filhos: React.ReactNode) => <QueryClientProvider client={cliente}>{filhos}</QueryClientProvider>
    render(embrulho(<Vigia />))
    const outra = render(embrulho(<SoLeASessao />))
    outra.unmount()

    await http.get('/usuarios', { adapter: respostaDe(401) as never }).catch(() => undefined)

    // Sair pede à API que apague o cookie e volta ao login.
    await waitFor(() => {
      expect(substituir).toHaveBeenCalledWith('/login')
    })
    expect(sairDaSessao).toHaveBeenCalled()
  })
})

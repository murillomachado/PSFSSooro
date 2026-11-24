// @vitest-environment jsdom
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obterSessao } from '@/features/auth/services/auth.service.ts'
import { tokenStorage } from '@/lib/tokenStorage.ts'
import { sistema } from '@/theme/sistema.ts'
import LayoutAutenticado from './layout.tsx'

const substituir = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: substituir }), usePathname: () => '/inicio' }))
vi.mock('@/features/auth/services/auth.service.ts', () => ({ entrar: vi.fn(), obterSessao: vi.fn() }))

const PAULO = {
  id: '2',
  nome: 'Paulo Ferreira',
  usuario: 'prof.paulo',
  perfil: 'PROFESSOR' as const,
  ativo: true,
  criadoEm: 'x',
  atualizadoEm: 'x',
}

function montar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ChakraProvider value={sistema}>
        <LayoutAutenticado>
          <p>conteúdo protegido</p>
        </LayoutAutenticado>
      </ChakraProvider>
    </QueryClientProvider>,
  )
}

describe('área autenticada', () => {
  beforeEach(() => {
    window.localStorage.clear()
    substituir.mockReset()
    vi.mocked(obterSessao).mockReset()
  })
  afterEach(cleanup)

  it('sem token, manda para o login e não mostra o conteúdo', async () => {
    montar()
    await waitFor(() => {
      expect(substituir).toHaveBeenCalledWith('/login')
    })
    expect(screen.queryByText('conteúdo protegido')).toBeNull()
    expect(obterSessao).not.toHaveBeenCalled()
  })

  it('com token válido, mostra quem está logado e o menu do perfil, e Sair apaga a sessão', async () => {
    tokenStorage.salvar('tok')
    vi.mocked(obterSessao).mockResolvedValue(PAULO)
    montar()
    expect(await screen.findByText('conteúdo protegido')).toBeDefined()
    expect(screen.getByText('Paulo Ferreira')).toBeDefined()
    expect(screen.getByText('Professor')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Alunos' })).toBeDefined()
    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: 'Menu do usuário' }))
    await usuario.click(await screen.findByRole('menuitem', { name: 'Sair' }))
    expect(tokenStorage.obter()).toBeUndefined()
    expect(substituir).toHaveBeenCalledWith('/login')
  })

  it('com token recusado pela API, volta para o login', async () => {
    tokenStorage.salvar('vencido')
    vi.mocked(obterSessao).mockRejectedValue(new Error('401'))
    montar()
    await waitFor(() => {
      expect(substituir).toHaveBeenCalledWith('/login')
    })
    expect(screen.queryByText('conteúdo protegido')).toBeNull()
  })
})

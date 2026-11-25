// @vitest-environment jsdom
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obterSessao, sairDaSessao } from '@/features/auth/services/auth.service.ts'
import { sistema } from '@/theme/sistema.ts'
import { AreaAutenticada } from './AreaAutenticada.tsx'

const substituir = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: substituir }), usePathname: () => '/inicio' }))
vi.mock('@/features/auth/services/auth.service.ts', () => ({
  entrar: vi.fn(),
  obterSessao: vi.fn(),
  sairDaSessao: vi.fn(),
}))

const PAULO = {
  id: '2',
  nome: 'Paulo Ferreira',
  usuario: 'prof.paulo',
  perfil: 'PROFESSOR' as const,
  ativo: true,
  professorId: null,
  criadoEm: 'x',
  atualizadoEm: 'x',
}

function montar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ChakraProvider value={sistema}>
        <AreaAutenticada>
          <p>conteúdo protegido</p>
        </AreaAutenticada>
      </ChakraProvider>
    </QueryClientProvider>,
  )
}

describe('área autenticada', () => {
  beforeEach(() => {
    substituir.mockReset()
    vi.mocked(obterSessao).mockReset()
    vi.mocked(sairDaSessao).mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('sem sessão válida (a API recusa o cookie), volta para o login e não mostra o conteúdo', async () => {
    vi.mocked(obterSessao).mockRejectedValue(new Error('401'))
    montar()
    await waitFor(() => {
      expect(substituir).toHaveBeenCalledWith('/login')
    })
    expect(screen.queryByText('conteúdo protegido')).toBeNull()
  })

  it('com sessão, mostra quem está logado e o menu do perfil, e Sair encerra a sessão na API', async () => {
    vi.mocked(obterSessao).mockResolvedValue(PAULO)
    montar()
    expect(await screen.findByText('conteúdo protegido')).toBeDefined()
    expect(screen.getByText('Paulo Ferreira')).toBeDefined()
    expect(screen.getByText('Professor')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Alunos' })).toBeDefined()
    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: 'Menu do usuário' }))
    await usuario.click(await screen.findByRole('menuitem', { name: 'Sair' }))
    await waitFor(() => {
      expect(substituir).toHaveBeenCalledWith('/login')
    })
    expect(sairDaSessao).toHaveBeenCalledOnce()
  })
})

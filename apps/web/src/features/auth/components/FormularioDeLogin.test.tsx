// @vitest-environment jsdom
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '@/lib/tokenStorage.ts'
import { entrar } from '../services/auth.service.ts'
import { FormularioDeLogin } from './FormularioDeLogin.tsx'

const substituir = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: substituir }) }))
vi.mock('../services/auth.service.ts', () => ({ entrar: vi.fn(), obterSessao: vi.fn() }))

const USUARIO = {
  id: '1',
  nome: 'Administrador',
  usuario: 'admin',
  perfil: 'ADMINISTRADOR' as const,
  ativo: true,
  criadoEm: 'x',
  atualizadoEm: 'x',
}

function montar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ChakraProvider value={defaultSystem}>
        <FormularioDeLogin />
      </ChakraProvider>
    </QueryClientProvider>,
  )
}

async function preencherEEnviar(usuario: string, senha: string) {
  const pessoa = userEvent.setup()
  if (usuario !== '') await pessoa.type(screen.getByLabelText('Usuário'), usuario)
  if (senha !== '') await pessoa.type(screen.getByLabelText('Senha'), senha)
  await pessoa.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('FormularioDeLogin (RF6)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.mocked(entrar).mockReset()
    substituir.mockReset()
  })
  afterEach(cleanup)

  it('avisa os campos obrigatórios sem chamar a API', async () => {
    montar()
    await preencherEEnviar('', '')
    expect(await screen.findByText('Informe o usuário')).toBeDefined()
    expect(screen.getByText('Informe a senha')).toBeDefined()
    expect(entrar).not.toHaveBeenCalled()
  })

  it('com credenciais válidas, guarda o token e vai para o início', async () => {
    vi.mocked(entrar).mockResolvedValue({ token: 'tok', usuario: USUARIO })
    montar()
    await preencherEEnviar('admin', 'senha1234')
    await waitFor(() => {
      expect(substituir).toHaveBeenCalledWith('/inicio')
    })
    expect(tokenStorage.obter()).toBe('tok')
    expect(entrar).toHaveBeenCalledWith({ usuario: 'admin', senha: 'senha1234' })
  })

  it('com credenciais erradas, mostra a mensagem da API e não guarda token', async () => {
    const problema = {
      type: 'x',
      title: 'x',
      status: 401,
      detail: 'Usuário ou senha inválidos.',
      codigo: 'CREDENCIAIS',
    }
    const resposta = { status: 401, data: problema } as AxiosResponse
    vi.mocked(entrar).mockRejectedValue(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, resposta))
    montar()
    await preencherEEnviar('admin', 'errada123')
    expect((await screen.findByRole('alert')).textContent).toContain('Usuário ou senha inválidos.')
    expect(tokenStorage.obter()).toBeUndefined()
    expect(substituir).not.toHaveBeenCalled()
  })
})

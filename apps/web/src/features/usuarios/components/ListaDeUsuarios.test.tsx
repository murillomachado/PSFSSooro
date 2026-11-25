// @vitest-environment jsdom
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UsuarioResposta } from '@psfssooro/contracts'
import { AxiosError, type AxiosResponse } from 'axios'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderizar, USUARIO_EXEMPLO } from '@/testes/renderizar.tsx'
import { alterarSituacao, excluirUsuario, listarUsuarios } from '../services/usuarios.service.ts'
import { ListaDeUsuarios } from './ListaDeUsuarios.tsx'

vi.mock('next/link', () => ({
  default: ({ href, children, ...resto }: { href: string; children: ReactNode }) => (
    <a href={href} {...resto}>
      {children}
    </a>
  ),
}))
vi.mock('../services/usuarios.service.ts', () => ({
  listarUsuarios: vi.fn(),
  alterarSituacao: vi.fn(),
  excluirUsuario: vi.fn(),
}))

const BRUNO = { ...USUARIO_EXEMPLO, id: '22222222-2222-4222-8222-222222222222', nome: 'Bruno Lima', ativo: false }

function pagina(itens: UsuarioResposta[] = [USUARIO_EXEMPLO, BRUNO], extra = {}) {
  return { itens, total: itens.length, pagina: 1, limite: 20, ...extra }
}

describe('ListaDeUsuarios (RF2, RN1, RN4)', () => {
  beforeEach(() => {
    // A lista de professores (da coluna e do filtro de responsável) vem vazia, salvo onde o teste diz.
    vi.mocked(listarUsuarios)
      .mockReset()
      .mockImplementation((filtros) => Promise.resolve(filtros.perfil === 'PROFESSOR' ? pagina([]) : pagina()))
    vi.mocked(alterarSituacao).mockReset().mockResolvedValue(USUARIO_EXEMPLO)
    vi.mocked(excluirUsuario).mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('lista os usuários com perfil e situação, e o administrador vê as ações de situação e exclusão', async () => {
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    expect(await screen.findByText('Ana Souza')).toBeDefined()
    expect(screen.getByText('Ativo')).toBeDefined()
    expect(screen.getByText('Inativo')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Inativar' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ativar' })).toBeDefined()
    expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(2)
  })

  it('o administrador vê e filtra o professor responsável de cada aluno (RN6)', async () => {
    const idDaCarla = USUARIO_EXEMPLO.professorId ?? ''
    const carla: UsuarioResposta = { ...USUARIO_EXEMPLO, id: idDaCarla, nome: 'Carla Professora', perfil: 'PROFESSOR' }
    vi.mocked(listarUsuarios).mockImplementation((filtros) =>
      Promise.resolve(filtros.perfil === 'PROFESSOR' ? pagina([{ ...carla, professorId: null }]) : pagina()),
    )
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    expect(await screen.findAllByText('Carla Professora')).not.toHaveLength(0)
    const pessoa = userEvent.setup()
    await pessoa.selectOptions(screen.getByLabelText('Professor responsável'), 'Carla Professora')
    await pessoa.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(listarUsuarios).toHaveBeenCalledWith(expect.objectContaining({ professorId: USUARIO_EXEMPLO.professorId }))
    })
  })

  it('o professor só edita: não vê ativar, inativar nem excluir, nem o filtro de perfil', async () => {
    renderizar(<ListaDeUsuarios perfilDoAtor="PROFESSOR" />)
    expect(await screen.findByText('Ana Souza')).toBeDefined()
    expect(screen.getAllByRole('link', { name: 'Editar' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Inativar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Excluir' })).toBeNull()
    expect(screen.queryByLabelText('Perfil')).toBeNull()
    expect(screen.queryByLabelText('Professor responsável')).toBeNull()
  })

  it('inativa um usuário ativo e ativa um inativo', async () => {
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    const pessoa = userEvent.setup()
    await pessoa.click(await screen.findByRole('button', { name: 'Inativar' }))
    await waitFor(() => {
      expect(alterarSituacao).toHaveBeenCalledWith(USUARIO_EXEMPLO.id, false)
    })
    await pessoa.click(screen.getByRole('button', { name: 'Ativar' }))
    await waitFor(() => {
      expect(alterarSituacao).toHaveBeenCalledWith(BRUNO.id, true)
    })
  })

  it('exclui só depois de confirmar', async () => {
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    const pessoa = userEvent.setup()
    await pessoa.click((await screen.findAllByRole('button', { name: 'Excluir' }))[0] as HTMLElement)
    expect(excluirUsuario).not.toHaveBeenCalled()
    const dialogo = await screen.findByRole('alertdialog')
    expect(dialogo.textContent).toContain('Excluir Ana Souza?')
    const botoes = dialogo.querySelectorAll('button')
    await pessoa.click(botoes[botoes.length - 1] as HTMLElement)
    await waitFor(() => {
      expect(excluirUsuario).toHaveBeenCalledWith(USUARIO_EXEMPLO.id)
    })
  })

  it('quando a API recusa a exclusão (usuário com avaliações), mostra o motivo', async () => {
    const problema = {
      type: 'x',
      title: 'x',
      status: 409,
      detail: 'Este usuário tem avaliações vinculadas.',
      codigo: 'USUARIO_COM_AVALIACOES',
    }
    vi.mocked(excluirUsuario).mockRejectedValue(
      new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, { status: 409, data: problema } as AxiosResponse),
    )
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    const pessoa = userEvent.setup()
    await pessoa.click((await screen.findAllByRole('button', { name: 'Excluir' }))[0] as HTMLElement)
    const dialogo = await screen.findByRole('alertdialog')
    const botoes = dialogo.querySelectorAll('button')
    await pessoa.click(botoes[botoes.length - 1] as HTMLElement)
    expect(await screen.findByText('Este usuário tem avaliações vinculadas.')).toBeDefined()
  })

  it('filtra por busca, perfil e situação, voltando à primeira página', async () => {
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    const pessoa = userEvent.setup()
    await screen.findByText('Ana Souza')
    await pessoa.type(screen.getByLabelText('Buscar por nome ou usuário'), ' ana ')
    await pessoa.selectOptions(screen.getByLabelText('Perfil'), 'ALUNO')
    await pessoa.selectOptions(screen.getByLabelText('Situação'), 'false')
    await pessoa.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(listarUsuarios).toHaveBeenLastCalledWith({ pagina: 1, busca: 'ana', perfil: 'ALUNO', ativo: false })
    })
  })

  it('pagina a lista e mostra o estado vazio', async () => {
    vi.mocked(listarUsuarios).mockResolvedValue(pagina([USUARIO_EXEMPLO], { total: 45 }))
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    await screen.findByText(/Página 1 de 3/)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Próxima' }))
    await waitFor(() => {
      expect(listarUsuarios).toHaveBeenLastCalledWith({ pagina: 2 })
    })
    vi.mocked(listarUsuarios).mockResolvedValue(pagina([], { total: 0 }))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(await screen.findByText('Nenhum usuário encontrado.')).toBeDefined()
  })

  it('se a página pedida ficou sem itens (excluiu o último dela), volta para a última que existe', async () => {
    vi.mocked(listarUsuarios).mockResolvedValue(pagina([USUARIO_EXEMPLO], { total: 25 }))
    renderizar(<ListaDeUsuarios perfilDoAtor="ADMINISTRADOR" />)
    await screen.findByText(/Página 1 de 2/)
    vi.mocked(listarUsuarios).mockResolvedValue(pagina([], { total: 20, pagina: 2 }))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Próxima' }))
    await waitFor(() => {
      expect(listarUsuarios).toHaveBeenLastCalledWith({ pagina: 1 })
    })
  })
})

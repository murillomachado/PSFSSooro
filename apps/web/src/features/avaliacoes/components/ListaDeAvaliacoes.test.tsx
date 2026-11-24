// @vitest-environment jsdom
import type { AvaliacaoResposta } from '@psfssooro/contracts'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarUsuarios } from '@/features/usuarios/services/usuarios.service.ts'
import { renderizar, USUARIO_EXEMPLO } from '@/testes/renderizar.tsx'
import { excluirAvaliacao, listarAvaliacoes } from '../services/avaliacoes.service.ts'
import { ListaDeAvaliacoes } from './ListaDeAvaliacoes.tsx'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: string }) => <a href={href}>{children}</a>,
}))
vi.mock('../services/avaliacoes.service.ts', () => ({ listarAvaliacoes: vi.fn(), excluirAvaliacao: vi.fn() }))
vi.mock('@/features/usuarios/services/usuarios.service.ts', () => ({ listarUsuarios: vi.fn() }))

const PAULO = '22222222-2222-4222-8222-222222222222'
const CARLA = '33333333-3333-4333-8333-333333333333'

const doPaulo: AvaliacaoResposta = {
  id: 'a1',
  aluno: { id: USUARIO_EXEMPLO.id, nome: 'Ana Souza' },
  professor: { id: PAULO, nome: 'Paulo Ferreira' },
  dataAvaliacao: '2026-10-19',
  alturaM: 1.65,
  pesoKg: 70,
  imc: 25.7,
  classificacao: { codigo: 'SOBREPESO', descricao: 'Sobrepeso' },
  criadoEm: 'x',
  atualizadoEm: 'x',
}
const daCarla: AvaliacaoResposta = {
  ...doPaulo,
  id: 'a2',
  professor: { id: CARLA, nome: 'Carla Mendes' },
  dataAvaliacao: '2026-09-14',
  pesoKg: 65,
  imc: 23.9,
  classificacao: { codigo: 'PESO_NORMAL', descricao: 'Peso normal' },
}

const pagina = (itens: AvaliacaoResposta[] = [doPaulo, daCarla]) => ({
  itens,
  total: itens.length,
  pagina: 1,
  limite: 20,
})
const ADMIN = { id: 'admin', perfil: 'ADMINISTRADOR' } as const
const PROFESSOR = { id: PAULO, perfil: 'PROFESSOR' } as const
const ALUNO = { id: USUARIO_EXEMPLO.id, perfil: 'ALUNO' } as const

describe('ListaDeAvaliacoes (RF5, RN2, RN3, RN5, RN6, RN7)', () => {
  beforeEach(() => {
    vi.mocked(listarAvaliacoes).mockReset().mockResolvedValue(pagina())
    vi.mocked(excluirAvaliacao).mockReset().mockResolvedValue(undefined)
    vi.mocked(listarUsuarios)
      .mockReset()
      .mockResolvedValue({ itens: [USUARIO_EXEMPLO], total: 1, pagina: 1, limite: 100 })
  })
  afterEach(cleanup)

  it('mostra data, aluno, professor, medidas, IMC e a classificação de cada avaliação', async () => {
    renderizar(<ListaDeAvaliacoes ator={ADMIN} />)
    expect(await screen.findByText('19/10/2026')).toBeDefined()
    expect(screen.getAllByText('1,65 m')).toHaveLength(2)
    expect(screen.getByText('70 kg')).toBeDefined()
    expect(screen.getByText('25,7')).toBeDefined()
    expect(screen.getByText('Sobrepeso')).toBeDefined()
    expect(screen.getByText('Peso normal')).toBeDefined()
  })

  it('o administrador edita todas e exclui, mas só depois de confirmar', async () => {
    renderizar(<ListaDeAvaliacoes ator={ADMIN} />)
    expect(await screen.findAllByRole('link', { name: 'Editar' })).toHaveLength(2)
    const pessoa = userEvent.setup()
    await pessoa.click(screen.getAllByRole('button', { name: 'Excluir' })[0] as HTMLElement)
    expect(excluirAvaliacao).not.toHaveBeenCalled()
    const dialogo = await screen.findByRole('alertdialog')
    const botoes = dialogo.querySelectorAll('button')
    await pessoa.click(botoes[botoes.length - 1] as HTMLElement)
    await waitFor(() => {
      expect(excluirAvaliacao).toHaveBeenCalledWith('a1')
    })
  })

  it('o professor edita só as que realizou, não exclui, e filtra "somente as minhas"', async () => {
    renderizar(<ListaDeAvaliacoes ator={PROFESSOR} />)
    await screen.findByText('19/10/2026')
    const links = screen.getAllByRole('link', { name: 'Editar' })
    expect(links).toHaveLength(1)
    expect(links[0]?.getAttribute('href')).toBe('/avaliacoes/a1/editar')
    expect(screen.queryByRole('button', { name: 'Excluir' })).toBeNull()
    await userEvent.setup().selectOptions(screen.getByLabelText('Professor'), PAULO)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(listarAvaliacoes).toHaveBeenLastCalledWith({ pagina: 1, professorId: PAULO })
    })
  })

  it('o aluno só consulta: sem ações, sem escolher aluno nem professor, só o período', async () => {
    renderizar(<ListaDeAvaliacoes ator={ALUNO} />)
    await screen.findByText('19/10/2026')
    expect(screen.queryByRole('link', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Excluir' })).toBeNull()
    expect(screen.queryByLabelText('Aluno')).toBeNull()
    expect(screen.queryByLabelText('Professor')).toBeNull()
    expect(screen.getByLabelText('De')).toBeDefined()
    expect(listarUsuarios).not.toHaveBeenCalled()
  })

  it('filtra por aluno e por período, voltando à primeira página', async () => {
    renderizar(<ListaDeAvaliacoes ator={ADMIN} />)
    await screen.findByText('19/10/2026')
    const pessoa = userEvent.setup()
    await pessoa.selectOptions(await screen.findByLabelText('Aluno'), USUARIO_EXEMPLO.id)
    await pessoa.type(screen.getByLabelText('De'), '2026-09-01')
    await pessoa.type(screen.getByLabelText('Até'), '2026-09-30')
    await pessoa.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => {
      expect(listarAvaliacoes).toHaveBeenLastCalledWith({
        pagina: 1,
        alunoId: USUARIO_EXEMPLO.id,
        de: '2026-09-01',
        ate: '2026-09-30',
      })
    })
  })

  it('mostra o estado vazio', async () => {
    vi.mocked(listarAvaliacoes).mockResolvedValue(pagina([]))
    renderizar(<ListaDeAvaliacoes ator={ALUNO} />)
    expect(await screen.findByText('Nenhuma avaliação encontrada.')).toBeDefined()
  })
})

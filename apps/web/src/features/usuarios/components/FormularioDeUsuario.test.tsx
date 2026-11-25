// @vitest-environment jsdom
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderizar, USUARIO_EXEMPLO } from '@/testes/renderizar.tsx'
import { FormularioDeUsuario } from './FormularioDeUsuario.tsx'

const TODOS = ['ADMINISTRADOR', 'PROFESSOR', 'ALUNO'] as const

function montar(props: Partial<Parameters<typeof FormularioDeUsuario>[0]> = {}) {
  const aoEnviar = vi.fn()
  renderizar(
    <FormularioDeUsuario perfisPermitidos={TODOS} enviando={false} erro={undefined} aoEnviar={aoEnviar} {...props} />,
  )
  return aoEnviar
}

describe('FormularioDeUsuario (RF1, RN4)', () => {
  afterEach(cleanup)

  it('no cadastro, exige os campos e a senha de 8 caracteres antes de enviar', async () => {
    const aoEnviar = montar()
    const pessoa = userEvent.setup()
    await pessoa.type(screen.getByLabelText('Senha'), '123')
    await pessoa.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText(/pelo menos 8 caracteres/)).toBeDefined()
    expect(screen.getByText(/Informe o nome/)).toBeDefined()
    expect(aoEnviar).not.toHaveBeenCalled()
  })

  it('o administrador escolhe o perfil e envia o cadastro completo', async () => {
    const aoEnviar = montar()
    const pessoa = userEvent.setup()
    await pessoa.type(screen.getByLabelText('Nome'), 'Marta Lopes')
    await pessoa.type(screen.getByLabelText('Usuário (login)'), 'prof.marta')
    await pessoa.type(screen.getByLabelText('Senha'), 'senha1234')
    await pessoa.selectOptions(screen.getByLabelText('Perfil'), 'PROFESSOR')
    await pessoa.click(screen.getByRole('button', { name: 'Cadastrar' }))
    await waitFor(() => {
      expect(aoEnviar).toHaveBeenCalledWith({
        nome: 'Marta Lopes',
        usuario: 'prof.marta',
        senha: 'senha1234',
        perfil: 'PROFESSOR',
      })
    })
  })

  it('o professor não escolhe perfil: só cadastra aluno', async () => {
    const aoEnviar = montar({ perfisPermitidos: ['ALUNO'] })
    expect(screen.queryByLabelText('Perfil')).toBeNull()
    const pessoa = userEvent.setup()
    await pessoa.type(screen.getByLabelText('Nome'), 'Fábio Rocha')
    await pessoa.type(screen.getByLabelText('Usuário (login)'), 'aluno.fabio')
    await pessoa.type(screen.getByLabelText('Senha'), 'senha1234')
    await pessoa.click(screen.getByRole('button', { name: 'Cadastrar' }))
    await waitFor(() => {
      expect(aoEnviar).toHaveBeenCalledWith(expect.objectContaining({ perfil: 'ALUNO' }))
    })
  })

  it('o administrador escolhe o professor responsável de um aluno, obrigatório só para alunos (RN6)', async () => {
    const professorId = USUARIO_EXEMPLO.professorId ?? ''
    const aoEnviar = montar({ professores: [{ valor: professorId, texto: 'Carla' }] })
    const pessoa = userEvent.setup()
    await pessoa.type(screen.getByLabelText('Nome'), 'Fábio Rocha')
    await pessoa.type(screen.getByLabelText('Usuário (login)'), 'aluno.fabio')
    await pessoa.type(screen.getByLabelText('Senha'), 'senha1234')
    await pessoa.selectOptions(screen.getByLabelText('Perfil'), 'ALUNO')
    await pessoa.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Escolha o professor responsável')).toBeDefined()
    expect(aoEnviar).not.toHaveBeenCalled()
    await pessoa.selectOptions(screen.getByLabelText('Professor responsável'), 'Carla')
    await pessoa.click(screen.getByRole('button', { name: 'Cadastrar' }))
    await waitFor(() => {
      expect(aoEnviar).toHaveBeenCalledWith(expect.objectContaining({ perfil: 'ALUNO', professorId }))
    })
    await pessoa.selectOptions(screen.getByLabelText('Perfil'), 'PROFESSOR')
    expect(screen.queryByLabelText('Professor responsável')).toBeNull()
  })

  it('na edição, é o mesmo formulário preenchido, e senha em branco mantém a atual', async () => {
    const aoEnviar = montar({ usuario: USUARIO_EXEMPLO })
    expect(screen.getByLabelText<HTMLInputElement>('Nome').value).toBe('Ana Souza')
    expect(screen.getByLabelText<HTMLInputElement>('Usuário (login)').value).toBe('aluno.ana')
    const pessoa = userEvent.setup()
    await pessoa.clear(screen.getByLabelText('Nome'))
    await pessoa.type(screen.getByLabelText('Nome'), 'Ana Maria')
    await pessoa.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => {
      expect(aoEnviar).toHaveBeenCalledWith({ nome: 'Ana Maria', usuario: 'aluno.ana', perfil: 'ALUNO' })
    })
  })

  it('mostra o erro devolvido pela API', () => {
    montar({ erro: 'Este nome de usuário já está em uso.' })
    expect(screen.getByRole('alert').textContent).toContain('já está em uso')
  })
})

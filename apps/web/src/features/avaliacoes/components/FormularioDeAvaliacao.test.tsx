// @vitest-environment jsdom
import type { AvaliacaoResposta } from '@psfssooro/contracts'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderizar } from '@/testes/renderizar.tsx'
import { hoje } from '../apresentacao.ts'
import { FormularioDeAvaliacao } from './FormularioDeAvaliacao.tsx'

const ANA = '11111111-1111-4111-8111-111111111111'
const PAULO = '22222222-2222-4222-8222-222222222222'
const CARLA = '33333333-3333-4333-8333-333333333333'
const ALUNOS = [{ valor: ANA, texto: 'Ana Souza' }]
const PROFESSORES = [
  { valor: PAULO, texto: 'Paulo Ferreira' },
  { valor: CARLA, texto: 'Carla Mendes' },
]

const EXISTENTE: AvaliacaoResposta = {
  id: '44444444-4444-4444-8444-444444444444',
  aluno: { id: ANA, nome: 'Ana Souza' },
  professor: { id: PAULO, nome: 'Paulo Ferreira' },
  dataAvaliacao: '2026-10-19',
  alturaM: 1.65,
  pesoKg: 70,
  imc: 25.7,
  classificacao: { codigo: 'SOBREPESO', descricao: 'Sobrepeso' },
  criadoEm: 'x',
  atualizadoEm: 'x',
}

function montar(props: Partial<Parameters<typeof FormularioDeAvaliacao>[0]> = {}) {
  const aoEnviar = vi.fn()
  renderizar(
    <FormularioDeAvaliacao
      perfilDoAtor="PROFESSOR"
      alunos={ALUNOS}
      professores={PROFESSORES}
      enviando={false}
      erro={undefined}
      aoEnviar={aoEnviar}
      {...props}
    />,
  )
  return aoEnviar
}

async function preencherMedidas(altura: string, peso: string) {
  const pessoa = userEvent.setup()
  await pessoa.type(screen.getByLabelText('Altura (m)'), altura)
  await pessoa.type(screen.getByLabelText('Peso (kg)'), peso)
  return pessoa
}

describe('FormularioDeAvaliacao (RF3, RN2, RN5)', () => {
  afterEach(cleanup)

  it('o professor registra: escolhe o aluno, não escolhe avaliador, e a data já vem com hoje', async () => {
    const aoEnviar = montar()
    expect(screen.queryByLabelText('Professor avaliador')).toBeNull()
    expect(screen.getByLabelText<HTMLInputElement>('Data da avaliação').value).toBe(hoje())
    const pessoa = await preencherMedidas('1.75', '72')
    await pessoa.selectOptions(screen.getByLabelText('Aluno'), ANA)
    await pessoa.click(screen.getByRole('button', { name: 'Registrar avaliação' }))
    await waitFor(() => {
      expect(aoEnviar).toHaveBeenCalledWith({ alunoId: ANA, dataAvaliacao: hoje(), alturaM: 1.75, pesoKg: 72 })
    })
  })

  it('o administrador escolhe também o professor avaliador, e precisa escolher', async () => {
    const aoEnviar = montar({ perfilDoAtor: 'ADMINISTRADOR' })
    const pessoa = await preencherMedidas('1.75', '72')
    await pessoa.selectOptions(screen.getByLabelText('Aluno'), ANA)
    await pessoa.click(screen.getByRole('button', { name: 'Registrar avaliação' }))
    expect(await screen.findByText('Escolha o professor')).toBeDefined()
    expect(aoEnviar).not.toHaveBeenCalled()
    await pessoa.selectOptions(screen.getByLabelText('Professor avaliador'), CARLA)
    await pessoa.click(screen.getByRole('button', { name: 'Registrar avaliação' }))
    await waitFor(() => {
      expect(aoEnviar).toHaveBeenCalledWith(expect.objectContaining({ alunoId: ANA, professorId: CARLA }))
    })
  })

  it('valida aluno, altura e peso antes de enviar, com as mensagens da especificação', async () => {
    const aoEnviar = montar()
    const pessoa = await preencherMedidas('0.3', '5')
    await pessoa.click(screen.getByRole('button', { name: 'Registrar avaliação' }))
    expect(await screen.findByText('Escolha o aluno')).toBeDefined()
    expect(screen.getByText('A altura mínima é 0,50 m')).toBeDefined()
    expect(screen.getByText('O peso mínimo é 10 kg')).toBeDefined()
    expect(aoEnviar).not.toHaveBeenCalled()
  })

  it('exige altura e peso preenchidos', async () => {
    montar()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Registrar avaliação' }))
    expect(await screen.findByText('Informe a altura')).toBeDefined()
    expect(screen.getByText('Informe o peso')).toBeDefined()
  })

  it('na edição é o mesmo formulário preenchido; o professor vê o aluno, mas não o troca', async () => {
    const aoEnviar = montar({ avaliacao: EXISTENTE })
    expect(screen.getByText('Aluno: Ana Souza')).toBeDefined()
    expect(screen.queryByLabelText('Aluno')).toBeNull()
    expect(screen.getByLabelText<HTMLInputElement>('Altura (m)').value).toBe('1.65')
    const pessoa = userEvent.setup()
    await pessoa.clear(screen.getByLabelText('Peso (kg)'))
    await pessoa.type(screen.getByLabelText('Peso (kg)'), '90')
    await pessoa.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => {
      expect(aoEnviar).toHaveBeenCalledWith(
        expect.objectContaining({ alunoId: ANA, professorId: PAULO, pesoKg: 90, alturaM: 1.65 }),
      )
    })
  })

  it('o administrador, ao editar, ainda vê o aluno da avaliação mesmo que ele esteja inativo hoje', () => {
    montar({ avaliacao: EXISTENTE, perfilDoAtor: 'ADMINISTRADOR', alunos: [], professores: [] })
    expect(screen.getByRole('option', { name: 'Ana Souza' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Paulo Ferreira' })).toBeDefined()
  })

  it('mostra o erro devolvido pela API', () => {
    montar({ erro: 'Não é possível registrar avaliação para um aluno inativo.' })
    expect(screen.getByRole('alert').textContent).toContain('aluno inativo')
  })
})

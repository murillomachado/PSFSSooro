import { expect, test } from '@playwright/test'
import { entrarComSucesso, linhaCom } from './apoio.ts'

const hoje = (): string => new Date().toISOString().slice(0, 10)

test.describe('RF3, RF4, RF5, RN2, RN3, RN5, RN6, RN7 e RN9: avaliações', () => {
  test('o professor registra: o IMC e a classificação saem calculados (RF3, RF4)', async ({ page }) => {
    await entrarComSucesso(page, 'prof.paulo')
    await page.getByRole('link', { name: 'Avaliações' }).click()
    await page.getByRole('link', { name: 'Nova avaliação' }).click()
    await expect(page.getByLabel('Professor avaliador')).toHaveCount(0)
    await page.getByLabel('Aluno', { exact: true }).selectOption({ label: 'Bruno Lima' })
    await page.getByLabel('Altura (m)').fill('1.75')
    await page.getByLabel('Peso (kg)').fill('95')
    await page.getByRole('button', { name: 'Registrar avaliação' }).click()

    const nova = linhaCom(page, 'Bruno Lima').first()
    await expect(nova).toContainText('31,0')
    await expect(nova).toContainText('Obesidade grau I')
    await expect(nova).toContainText('Paulo Ferreira')

    // RN5: corrige a própria avaliação e o IMC é recalculado.
    await nova.getByRole('link', { name: 'Editar' }).click()
    await page.getByLabel('Peso (kg)').fill('72')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(linhaCom(page, 'Bruno Lima').first()).toContainText('23,5')
    await expect(linhaCom(page, 'Bruno Lima').first()).toContainText('Peso normal')
  })

  test('o formulário valida os campos e só oferece alunos ativos (RN9)', async ({ page }) => {
    await entrarComSucesso(page, 'prof.paulo')
    await page.goto('/avaliacoes/nova')
    const opcoes = page.getByLabel('Aluno', { exact: true }).locator('option')
    await expect(opcoes.filter({ hasText: 'Ana Souza' })).toHaveCount(1)
    await expect(opcoes.filter({ hasText: 'Diego Inativo' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Registrar avaliação' }).click()
    await expect(page.getByText('Escolha o aluno')).toBeVisible()
    await expect(page.getByText('Informe a altura')).toBeVisible()
    await expect(page.getByText('Informe o peso')).toBeVisible()
    await page.getByLabel('Altura (m)').fill('0.3')
    await page.getByLabel('Peso (kg)').fill('5')
    await page.getByRole('button', { name: 'Registrar avaliação' }).click()
    await expect(page.getByText('A altura mínima é 0,50 m')).toBeVisible()
    await expect(page.getByText('O peso mínimo é 10 kg')).toBeVisible()
  })

  test('o professor edita só as suas avaliações; nas de outro professor não há botão (RN5)', async ({ page }) => {
    await entrarComSucesso(page, 'prof.carla')
    await page.goto('/avaliacoes')
    await expect(linhaCom(page, 'Paulo Ferreira').first()).toBeVisible()
    await expect(linhaCom(page, 'Paulo Ferreira').first().getByRole('link', { name: 'Editar' })).toHaveCount(0)
    await expect(linhaCom(page, 'Carla Mendes').first().getByRole('link', { name: 'Editar' })).toBeVisible()
  })

  test('o administrador registra escolhendo o professor, edita, filtra e exclui (RN2, RN3, RF5)', async ({ page }) => {
    await entrarComSucesso(page, 'admin')
    await page.goto('/avaliacoes/nova')
    await page.getByLabel('Aluno', { exact: true }).selectOption({ label: 'Ana Souza' })
    await page.getByLabel('Altura (m)').fill('1.65')
    await page.getByLabel('Peso (kg)').fill('48')
    await page.getByRole('button', { name: 'Registrar avaliação' }).click()
    await expect(page.getByText('Escolha o professor')).toBeVisible()

    await page.getByLabel('Professor avaliador').selectOption({ label: 'Carla Mendes' })
    await page.getByLabel('Data da avaliação').fill('2999-01-01')
    await page.getByRole('button', { name: 'Registrar avaliação' }).click()
    await expect(page.getByText('A data da avaliação não pode ser futura.')).toBeVisible()

    await page.getByLabel('Data da avaliação').fill(hoje())
    await page.getByRole('button', { name: 'Registrar avaliação' }).click()
    await expect(page).toHaveURL(/\/avaliacoes$/)

    await page.getByLabel('Aluno', { exact: true }).selectOption({ label: 'Ana Souza' })
    await page.getByLabel('Professor', { exact: true }).selectOption({ label: 'Carla Mendes' })
    await page.getByRole('button', { name: 'Filtrar' }).click()
    const nova = page.locator('tbody tr', { hasText: 'Abaixo do peso' })
    await expect(nova).toHaveCount(1)
    await expect(nova).toContainText('17,6')

    await nova.getByRole('button', { name: 'Excluir' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir' }).click()
    await expect(nova).toHaveCount(0)
  })

  test('o aluno só vê as próprias avaliações, sem ações e sem escolher aluno (RN7)', async ({ page }) => {
    await entrarComSucesso(page, 'aluno.ana')
    await page.getByRole('link', { name: 'Minhas avaliações' }).click()
    await expect(page.locator('tbody tr').first()).toBeVisible()
    const alunos = await page.locator('tbody tr td:nth-child(2)').allInnerTexts()
    expect(new Set(alunos)).toEqual(new Set(['Ana Souza']))
    await expect(page.getByRole('link', { name: 'Editar' })).toHaveCount(0)
    await expect(page.getByLabel('Aluno', { exact: true })).toHaveCount(0)
    await page.goto('/avaliacoes/nova')
    await expect(page).toHaveURL(/\/inicio$/)
  })
})

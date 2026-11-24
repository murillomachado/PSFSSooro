import { expect, test } from '@playwright/test'
import { entrar, entrarComSucesso, sair } from './apoio.ts'

test.describe('RF6 e RN8: autenticação', () => {
  test('entra como administrador, professor e aluno, e cada um vê o seu menu', async ({ page }) => {
    await entrarComSucesso(page, 'michael.scott')
    await expect(page.getByRole('link', { name: 'Usuários' })).toBeVisible()
    await sair(page)

    await entrarComSucesso(page, 'dwight.schrute')
    await expect(page.getByRole('link', { name: 'Alunos' })).toBeVisible()
    await sair(page)

    await entrarComSucesso(page, 'pam.beesly')
    await expect(page.getByRole('link', { name: 'Minhas avaliações' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Usuários|Alunos/ })).toHaveCount(0)
  })

  test('senha errada mostra o erro e não entra', async ({ page }) => {
    await entrar(page, 'michael.scott', 'senha-errada')
    await expect(page.getByText('Usuário ou senha inválidos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('campos em branco são avisados', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Informe o usuário')).toBeVisible()
    await expect(page.getByText('Informe a senha')).toBeVisible()
  })

  test('usuário inativo não acessa o sistema (RN8)', async ({ page }) => {
    await entrar(page, 'ryan.howard')
    await expect(page.getByText('Este usuário está inativo. Procure a academia.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('sem sessão, as telas internas levam ao login; depois de sair, a sessão acabou', async ({ page }) => {
    await page.goto('/avaliacoes')
    await expect(page).toHaveURL(/\/login$/)
    await entrarComSucesso(page, 'michael.scott')
    await page.reload()
    await expect(page.getByRole('heading', { name: /Olá, Michael Scott/ })).toBeVisible()
    await sair(page)
    await page.goto('/usuarios')
    await expect(page).toHaveURL(/\/login$/)
  })
})

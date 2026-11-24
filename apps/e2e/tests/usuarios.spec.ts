import { expect, test } from '@playwright/test'
import { entrarComSucesso, linhaCom, sufixo } from './apoio.ts'

test.describe('RF1, RF2, RN1 e RN4: usuários', () => {
  test('o administrador cadastra, edita, inativa, reativa e exclui um professor', async ({ page }) => {
    const nome = `Marta ${sufixo()}`
    const login = `prof.${sufixo()}`
    await entrarComSucesso(page, 'michael.scott')
    await page.getByRole('link', { name: 'Usuários' }).click()
    await page.getByRole('link', { name: 'Novo cadastro' }).click()
    await expect(page.getByRole('heading', { name: 'Novo cadastro' })).toBeVisible()
    await page.getByLabel('Nome', { exact: true }).fill(nome)
    await page.getByLabel('Usuário (login)').fill(login)
    await page.getByLabel('Senha', { exact: true }).fill('senha1234')
    await page.getByLabel('Perfil', { exact: true }).selectOption('PROFESSOR')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(linhaCom(page, nome)).toContainText('Professor')

    await linhaCom(page, nome).getByRole('link', { name: 'Editar' }).click()
    await page.getByLabel('Nome', { exact: true }).fill(`${nome} Silva`)
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(linhaCom(page, `${nome} Silva`)).toBeVisible()

    const linha = linhaCom(page, `${nome} Silva`)
    await linha.getByRole('button', { name: 'Inativar' }).click()
    await expect(linha).toContainText('Inativo')
    await linha.getByRole('button', { name: 'Ativar' }).click()
    await expect(linha).toContainText('Ativo')

    await linha.getByRole('button', { name: 'Excluir' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir' }).click()
    await expect(linha).toHaveCount(0)
  })

  test('um nome de usuário repetido é recusado com a mensagem da API', async ({ page }) => {
    await entrarComSucesso(page, 'michael.scott')
    await page.goto('/usuarios/novo')
    await page.getByLabel('Nome', { exact: true }).fill('Outro Admin')
    await page.getByLabel('Usuário (login)').fill('michael.scott')
    await page.getByLabel('Senha', { exact: true }).fill('senha1234')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.getByText('Já existe um usuário com este nome de usuário.')).toBeVisible()
  })

  test('não exclui quem tem avaliações: a tela mostra o motivo (RN1)', async ({ page }) => {
    await entrarComSucesso(page, 'michael.scott')
    await page.goto('/usuarios')
    const linha = linhaCom(page, 'Pam Beesly')
    await linha.getByRole('button', { name: 'Excluir' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir' }).click()
    await expect(page.getByText(/avaliações vinculadas/)).toBeVisible()
    await expect(linha).toBeVisible()
  })

  test('o professor só lista e cadastra alunos, e não vê situação nem exclusão (RN4)', async ({ page }) => {
    const nome = `Aluno ${sufixo()}`
    await entrarComSucesso(page, 'dwight.schrute')
    await page.getByRole('link', { name: 'Alunos' }).click()
    await expect(linhaCom(page, 'Pam Beesly')).toBeVisible()
    await expect(page.locator('tbody tr', { hasText: 'Professor' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Inativar|Excluir/ })).toHaveCount(0)

    await page.getByRole('link', { name: 'Novo cadastro' }).click()
    await expect(page.getByLabel('Perfil', { exact: true })).toHaveCount(0)
    await page.getByLabel('Nome', { exact: true }).fill(nome)
    await page.getByLabel('Usuário (login)').fill(`aluno.${sufixo()}`)
    await page.getByLabel('Senha', { exact: true }).fill('senha1234')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(linhaCom(page, nome)).toContainText('Aluno')
  })

  test('o aluno não acessa a área de usuários', async ({ page }) => {
    await entrarComSucesso(page, 'pam.beesly')
    await page.goto('/usuarios')
    await expect(page).toHaveURL(/\/inicio$/)
  })
})

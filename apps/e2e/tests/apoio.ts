import { expect, type Page } from '@playwright/test'

/** Entra pela tela de login com a senha de demonstração e espera chegar ao início. */
export async function entrar(pagina: Page, usuario: string, senha = 'senha1234'): Promise<void> {
  await pagina.goto('/login')
  await pagina.getByLabel('Usuário').fill(usuario)
  await pagina.getByLabel('Senha', { exact: true }).fill(senha)
  await pagina.getByRole('button', { name: 'Entrar' }).click()
}

export async function entrarComSucesso(pagina: Page, usuario: string): Promise<void> {
  await entrar(pagina, usuario)
  await expect(pagina).toHaveURL(/\/inicio$/)
}

export async function sair(pagina: Page): Promise<void> {
  await pagina.getByRole('button', { name: 'Menu do usuário' }).click()
  await pagina.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(pagina).toHaveURL(/\/login$/)
}

/** A linha da tabela que contém o texto (nome do usuário ou do aluno). */
export const linhaCom = (pagina: Page, texto: string) => pagina.locator('tbody tr', { hasText: texto })

/** Sufixo único por execução, para os cadastros não colidirem com os de outros testes. */
export const sufixo = (): string => Date.now().toString(36).slice(-5)

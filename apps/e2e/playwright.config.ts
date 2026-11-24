import path from 'node:path'
import { defineConfig } from '@playwright/test'

const RAIZ = path.join(import.meta.dirname, '../..')
const WEB = 'http://localhost:3000'

// Os testes rodam contra o sistema de verdade: a API compilada, com um banco SQLite novo e os
// usuários de demonstração, e o Web compilado. Rode `pnpm build` antes.
export default defineConfig({
  testDir: './tests',
  // Os testes compartilham o mesmo banco; em série, ficam previsíveis.
  workers: 1,
  fullyParallel: false,
  // Sem retry: o banco vale pela execução inteira, e repetir um teste a meio caminho duplicaria dados.
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: WEB,
    // Localmente dá para usar o Chrome instalado (E2E_CANAL=chrome); no CI, o Chromium do Playwright.
    ...(process.env.E2E_CANAL ? { channel: process.env.E2E_CANAL } : {}),
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node servidor-api.mjs',
      cwd: import.meta.dirname,
      url: 'http://localhost:3333/api/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @psfssooro/web start',
      cwd: RAIZ,
      url: WEB,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})

import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // O TypeORM 1 só aceita os decorators legados, e o Vitest só os transforma com esta opção.
  oxc: { decorator: { legacy: true } },
  resolve: {
    // Nos testes, o contracts vem do código-fonte: não depende do build e entra na cobertura.
    alias: {
      '@psfssooro/contracts': path.resolve(import.meta.dirname, 'packages/contracts/src/index.ts'),
      '@': path.resolve(import.meta.dirname, 'apps/web/src'),
    },
  },
  test: {
    include: ['{apps,packages}/**/*.test.{ts,tsx}'],
    // Antes de existir código de produto, uma suíte vazia não é erro.
    passWithNoTests: true,
    setupFiles: ['apps/web/src/testes/configurar.ts'],
    coverage: {
      provider: 'v8',
      // Todo o código de produto conta, inclusive arquivo que nenhum teste importa.
      include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.ts'],
      // Fora: os testes, as declarações de tipo e os pontos de entrada, que só ligam módulos já testados.
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/main.ts', '**/bin/**'],
      reporter: ['text', 'text-summary'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
})

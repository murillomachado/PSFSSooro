import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['{apps,packages}/**/*.test.{ts,tsx}'],
    // Antes de existir código de produto, uma suíte vazia não é erro.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      // Todo o código de produto conta, inclusive arquivo que nenhum teste importa.
      include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.ts'],
      // Fora: os testes e os pontos de entrada, que só ligam módulos já testados.
      exclude: ['**/*.test.{ts,tsx}', '**/main.ts'],
      reporter: ['text', 'text-summary'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
})

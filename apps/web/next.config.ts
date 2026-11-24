import path from 'node:path'
import type { NextConfig } from 'next'

const configuracao: NextConfig = {
  reactStrictMode: true,
  // No build da imagem Docker (NEXT_STANDALONE=1), gera uma pasta com só o que o servidor precisa.
  ...(process.env.NEXT_STANDALONE === '1' ? { output: 'standalone' as const } : {}),
  // Num monorepo, o rastreamento de arquivos parte da raiz para achar o pacote contracts.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
}

export default configuracao

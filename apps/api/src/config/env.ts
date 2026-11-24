import { z } from 'zod'

/** Inteiro vindo de variável de ambiente (texto), com limites e valor padrão. */
const inteiro = (padrao: number, minimo: number, maximo: number) =>
  z
    .string()
    .regex(/^\d+$/, 'precisa ser um número inteiro')
    .transform((texto) => Number(texto))
    .pipe(z.number().min(minimo, `mínimo ${minimo}`).max(maximo, `máximo ${maximo}`))
    .default(padrao)

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: inteiro(3333, 1, 65535),
  DATABASE_PATH: z.string().min(1).default('./academia.sqlite'),
  JWT_SECRET: z.string({ error: 'é obrigatório' }).min(32, 'precisa ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN_SECONDS: inteiro(28_800, 60, 604_800),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
})

export interface Env {
  readonly ambiente: 'development' | 'test' | 'production'
  readonly porta: number
  readonly caminhoDoBanco: string
  readonly segredoJwt: string
  readonly expiracaoDoTokenEmSegundos: number
  readonly origemCors: string
}

/** Lê e valida as variáveis de ambiente. A API não sobe com configuração faltando ou inválida. */
export function carregarEnv(origem: Readonly<Record<string, string | undefined>> = process.env): Env {
  const resultado = esquema.safeParse(origem)
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((problema) => `  - ${problema.path.join('.')}: ${problema.message}`)
    throw new Error(`Configuração inválida (veja o apps/api/.env.example):\n${problemas.join('\n')}`)
  }
  const dados = resultado.data
  return {
    ambiente: dados.NODE_ENV,
    porta: dados.PORT,
    caminhoDoBanco: dados.DATABASE_PATH,
    segredoJwt: dados.JWT_SECRET,
    expiracaoDoTokenEmSegundos: dados.JWT_EXPIRES_IN_SECONDS,
    origemCors: dados.CORS_ORIGIN,
  }
}

import { z } from 'zod'

export const LIMITE_PADRAO = 20
export const LIMITE_MAXIMO = 100

/** Número inteiro vindo de texto (query string). Sem z.coerce, que transformaria texto vazio em 0. */
const inteiroDeTexto = z
  .string('Informe um número inteiro')
  .regex(/^\d+$/, 'Informe um número inteiro')
  .transform((texto) => Number(texto))

export const paginacaoQuerySchema = z.object({
  pagina: inteiroDeTexto.pipe(z.number().min(1, 'A página começa em 1')).default(1),
  limite: inteiroDeTexto
    .pipe(z.number().min(1, 'O limite mínimo é 1').max(LIMITE_MAXIMO, `O limite máximo é ${LIMITE_MAXIMO}`))
    .default(LIMITE_PADRAO),
})

export function paginaSchema<T extends z.ZodType>(item: T) {
  return z.object({
    itens: z.array(item),
    total: z.number().int(),
    pagina: z.number().int(),
    limite: z.number().int(),
  })
}

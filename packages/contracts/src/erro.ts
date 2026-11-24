import { z } from 'zod'

/** Erro no formato da RFC 9457 (Problem Details), que a API devolve em toda resposta de erro. */
export const problemaSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  codigo: z.string(),
  campos: z.array(z.object({ campo: z.string(), mensagem: z.string() })).optional(),
})

export type Problema = z.infer<typeof problemaSchema>

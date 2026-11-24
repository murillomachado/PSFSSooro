import { z } from 'zod'

export const PERFIS = ['ADMINISTRADOR', 'PROFESSOR', 'ALUNO'] as const

export const perfilSchema = z.enum(PERFIS)

export type Perfil = z.infer<typeof perfilSchema>

import { z } from 'zod'

export const PERFIS = ['ADMINISTRADOR', 'PROFESSOR', 'ALUNO'] as const

export const perfilSchema = z.enum(PERFIS, 'Escolha o perfil: ADMINISTRADOR, PROFESSOR ou ALUNO')

export type Perfil = z.infer<typeof perfilSchema>

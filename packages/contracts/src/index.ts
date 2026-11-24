import { z } from 'zod'

// Rede de segurança: toda mensagem que um schema não define sai em português, na API e nos formulários.
z.config(z.locales.pt())

export * from './avaliacao.ts'
export * from './erro.ts'
export * from './paginacao.ts'
export * from './perfil.ts'
export * from './usuario.ts'

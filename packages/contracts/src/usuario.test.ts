import { describe, expect, it } from 'vitest'
import {
  criarUsuarioSchema,
  editarUsuarioSchema,
  idSchema,
  listarUsuariosQuerySchema,
  loginSchema,
  situacaoSchema,
} from './index.ts'

const cadastroValido = { nome: 'Ana Souza', usuario: 'aluno.ana', senha: 'senha1234', perfil: 'ALUNO' }

describe('criarUsuarioSchema', () => {
  it('aceita um cadastro válido e normaliza o usuário (sem espaços, em minúsculas)', () => {
    const resultado = criarUsuarioSchema.parse({ ...cadastroValido, nome: '  Ana Souza ', usuario: ' Aluno.ANA ' })
    expect(resultado).toEqual(cadastroValido)
  })

  it.each([
    ['nome curto', { nome: 'A' }, 'nome'],
    ['usuário com espaço', { usuario: 'ana souza' }, 'usuario'],
    ['usuário curto', { usuario: 'an' }, 'usuario'],
    ['senha curta', { senha: '1234567' }, 'senha'],
    ['perfil inexistente', { perfil: 'DIRETOR' }, 'perfil'],
  ])('recusa %s', (_descricao, alteracao, campo) => {
    const resultado = criarUsuarioSchema.safeParse({ ...cadastroValido, ...alteracao })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.path).toEqual([campo])
  })

  it('recusa campo ausente em vez de assumir um valor', () => {
    expect(criarUsuarioSchema.safeParse({ ...cadastroValido, senha: undefined }).success).toBe(false)
  })
})

describe('editarUsuarioSchema', () => {
  it('todos os campos são opcionais, mas os que vêm precisam ser válidos', () => {
    expect(editarUsuarioSchema.parse({})).toEqual({})
    expect(editarUsuarioSchema.parse({ nome: 'Ana Maria' })).toEqual({ nome: 'Ana Maria' })
    expect(editarUsuarioSchema.safeParse({ senha: 'curta' }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('normaliza o usuário e não impõe a regra de tamanho da senha de cadastro', () => {
    expect(loginSchema.parse({ usuario: ' ADMIN ', senha: 'x' })).toEqual({ usuario: 'admin', senha: 'x' })
  })

  it('recusa campos vazios', () => {
    expect(loginSchema.safeParse({ usuario: '', senha: '' }).error?.issues).toHaveLength(2)
  })
})

describe('situacaoSchema e idSchema', () => {
  it('a situação precisa ser um booleano de verdade', () => {
    expect(situacaoSchema.parse({ ativo: false })).toEqual({ ativo: false })
    expect(situacaoSchema.safeParse({ ativo: 'false' }).success).toBe(false)
  })

  it('o id precisa ser um UUID', () => {
    expect(idSchema.safeParse({ id: '4b1c9f3e-9d2a-4b7e-8f10-1a2b3c4d5e6f' }).success).toBe(true)
    expect(idSchema.safeParse({ id: '123' }).success).toBe(false)
  })
})

describe('listarUsuariosQuerySchema', () => {
  it('aplica a paginação padrão quando nada é informado', () => {
    expect(listarUsuariosQuerySchema.parse({})).toEqual({ pagina: 1, limite: 20 })
  })

  it('converte os números e os booleanos que chegam como texto na URL', () => {
    const resultado = listarUsuariosQuerySchema.parse({ pagina: '2', limite: '50', ativo: 'false', perfil: 'ALUNO' })
    expect(resultado).toEqual({ pagina: 2, limite: 50, ativo: false, perfil: 'ALUNO' })
  })

  it.each([
    ['página zero', { pagina: '0' }],
    ['página vazia, que um z.coerce transformaria em 0', { pagina: '' }],
    ['página não numérica', { pagina: 'abc' }],
    ['limite acima do máximo', { limite: '101' }],
    ['ativo fora de true e false', { ativo: 'talvez' }],
  ])('recusa %s', (_descricao, query) => {
    expect(listarUsuariosQuerySchema.safeParse(query).success).toBe(false)
  })
})

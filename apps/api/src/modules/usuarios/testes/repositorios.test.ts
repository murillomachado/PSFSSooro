import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { criarBancoEmMemoria } from '../../../shared/database/banco-em-memoria.ts'
import type { FiltrosDeUsuario, UsuarioRepository } from '../application/usuario-repository.ts'
import { MemoriaUsuarioRepository } from '../infra/memoria-usuario.repository.ts'
import { TypeOrmUsuarioRepository } from '../infra/typeorm-usuario.repository.ts'
import { administrador, novoUsuario } from './apoio.ts'

interface Ambiente {
  readonly repositorio: UsuarioRepository
  readonly encerrar: () => Promise<void>
}

const emMemoria = (): Promise<Ambiente> =>
  Promise.resolve({ repositorio: new MemoriaUsuarioRepository(), encerrar: () => Promise.resolve() })

const comTypeOrm = async (): Promise<Ambiente> => {
  const banco = await criarBancoEmMemoria()
  return { repositorio: new TypeOrmUsuarioRepository(banco), encerrar: () => banco.destroy() }
}

const TODOS = ['ADMINISTRADOR', 'PROFESSOR', 'ALUNO'] as const

// O que qualquer UsuarioRepository precisa cumprir. A mesma suíte roda contra o repositório em
// memória e contra o do TypeORM com SQLite e as migrations de verdade: é a prova de que um pode
// ficar no lugar do outro (Liskov), e de que os casos de uso não dependem do banco.
describe.each([
  ['em memória', emMemoria],
  ['TypeORM com SQLite', comTypeOrm],
])('contrato do UsuarioRepository: %s', (_nome, criar) => {
  let ambiente: Ambiente
  const repositorio = (): UsuarioRepository => ambiente.repositorio

  beforeEach(async () => {
    ambiente = await criar()
  })
  afterEach(async () => {
    await ambiente.encerrar()
  })

  it('guarda um usuário e o acha pelo id e pelo nome de usuário', async () => {
    const ana = novoUsuario({ usuario: 'aluno.ana' })
    await repositorio().salvar(ana)
    expect(await repositorio().buscarPorId(ana.id)).toEqual(ana)
    expect(await repositorio().buscarPorUsuario('aluno.ana')).toEqual(ana)
  })

  it('devolve undefined para o que não existe', async () => {
    expect(await repositorio().buscarPorId('inexistente')).toBeUndefined()
    expect(await repositorio().buscarPorUsuario('ninguem')).toBeUndefined()
  })

  it('atualiza um usuário que já existe, em vez de duplicar', async () => {
    const ana = novoUsuario()
    await repositorio().salvar(ana)
    await repositorio().salvar({ ...ana, nome: 'Ana Maria', ativo: false })
    expect(await repositorio().buscarPorId(ana.id)).toMatchObject({ nome: 'Ana Maria', ativo: false })
    expect((await repositorio().listar({ perfis: TODOS, pagina: 1, limite: 10 })).total).toBe(1)
  })

  it('recusa dois usuários com o mesmo nome de usuário com um conflito (409), e não com um erro do banco', async () => {
    await repositorio().salvar(novoUsuario({ usuario: 'aluno.ana' }))
    await expect(repositorio().salvar(novoUsuario({ usuario: 'aluno.ana' }))).rejects.toMatchObject({
      status: 409,
      codigo: 'USUARIO_JA_EXISTE',
    })
  })

  it('conta só os administradores ativos', async () => {
    await repositorio().salvar(administrador({ id: 'a1', usuario: 'admin1' }))
    await repositorio().salvar(administrador({ id: 'a2', usuario: 'admin2', ativo: false }))
    await repositorio().salvar(novoUsuario({ usuario: 'aluno.ana' }))
    expect(await repositorio().contarAdministradoresAtivos()).toBe(1)
  })

  describe('listar', () => {
    beforeEach(async () => {
      await repositorio().salvar(administrador({ nome: 'Zélia Admin', usuario: 'admin' }))
      await repositorio().salvar(novoUsuario({ nome: 'Carlos', usuario: 'prof.carlos', perfil: 'PROFESSOR' }))
      await repositorio().salvar(novoUsuario({ nome: 'Ana', usuario: 'aluno.ana' }))
      await repositorio().salvar(novoUsuario({ nome: 'Bruno', usuario: 'aluno.bruno', ativo: false }))
    })

    const nomes = async (filtros: Partial<FiltrosDeUsuario> = {}): Promise<string[]> => {
      const pagina = await repositorio().listar({ perfis: TODOS, pagina: 1, limite: 10, ...filtros })
      return pagina.itens.map((usuario) => usuario.nome)
    }

    it('ordena por nome e informa o total', async () => {
      expect(await nomes()).toEqual(['Ana', 'Bruno', 'Carlos', 'Zélia Admin'])
      expect((await repositorio().listar({ perfis: TODOS, pagina: 1, limite: 2 })).total).toBe(4)
    })

    it('mantém a ordem estável entre páginas quando há nomes repetidos', async () => {
      for (const usuario of ['ana.um', 'ana.dois', 'ana.tres']) {
        await repositorio().salvar(novoUsuario({ nome: 'Ana Repetida', usuario }))
      }
      const filtros = { perfis: ['ALUNO'] as const, busca: 'repetida', limite: 2 }
      const primeira = await repositorio().listar({ ...filtros, pagina: 1 })
      const segunda = await repositorio().listar({ ...filtros, pagina: 2 })
      const vistos = [...primeira.itens, ...segunda.itens].map((usuario) => usuario.usuario)
      expect(vistos.toSorted((a, b) => a.localeCompare(b))).toEqual(['ana.dois', 'ana.tres', 'ana.um'])
    })

    it('restringe aos perfis informados', async () => {
      expect(await nomes({ perfis: ['ALUNO'] })).toEqual(['Ana', 'Bruno'])
    })

    it('filtra pela situação', async () => {
      expect(await nomes({ ativo: false })).toEqual(['Bruno'])
      expect(await nomes({ ativo: true, perfis: ['ALUNO'] })).toEqual(['Ana'])
    })

    it('busca por um trecho do nome ou do nome de usuário, sem diferenciar maiúsculas', async () => {
      expect(await nomes({ busca: 'BRU' })).toEqual(['Bruno'])
      expect(await nomes({ busca: 'prof.' })).toEqual(['Carlos'])
    })

    it('pagina, com o total do conjunto filtrado', async () => {
      const segunda = await repositorio().listar({ perfis: TODOS, pagina: 2, limite: 3 })
      expect(segunda.itens.map((usuario) => usuario.nome)).toEqual(['Zélia Admin'])
      expect(segunda).toMatchObject({ total: 4, pagina: 2, limite: 3 })
    })
  })
})

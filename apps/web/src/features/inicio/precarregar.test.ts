import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { chavesDeAvaliacoes, filtrosDoHistorico, PRIMEIRA_PAGINA } from '@/features/avaliacoes/chaves.ts'
import { precarregarAvaliacoes } from '@/features/avaliacoes/precarregar.ts'
import { chavesDeUsuarios } from '@/features/usuarios/chaves.ts'
import { precarregarEscolha, precarregarUsuarios } from '@/features/usuarios/precarregar.ts'
import type { ClienteHttp } from '@/lib/http-client.ts'
import { USUARIO_EXEMPLO } from '@/testes/renderizar.tsx'
import { filtrosDoPainel } from './filtros.ts'
import { precarregarInicio } from './precarregar.ts'

/** Um cliente HTTP falso que responde com o caminho e os parâmetros pedidos, e anota cada chamada. */
function clienteFalso() {
  const chamadas: string[] = []
  const cliente = {
    get: (caminho: string, config?: { params?: unknown }) => {
      chamadas.push(caminho)
      return Promise.resolve({ data: { caminho, params: config?.params } })
    },
  } as unknown as ClienteHttp
  return { cliente, chamadas }
}

const PROFESSOR = { ...USUARIO_EXEMPLO, id: 'prof-1', perfil: 'PROFESSOR' as const }
const ALUNO = { ...USUARIO_EXEMPLO, id: 'aluno-1' }

describe('renderização no servidor: o cache sai com as mesmas chaves dos hooks', () => {
  it('para a equipe, a tela inicial leva os quatro indicadores', async () => {
    const consultas = new QueryClient()
    const { cliente } = clienteFalso()
    await precarregarInicio(consultas, cliente, PROFESSOR)
    expect(consultas.getQueryData(chavesDeUsuarios.lista(filtrosDoPainel.alunosAtivos))).toEqual({
      caminho: '/usuarios',
      params: { pagina: 1, limite: 1, perfil: 'ALUNO', ativo: true },
    })
    expect(consultas.getQueryData(chavesDeAvaliacoes.lista(filtrosDoPainel.feitasPor('prof-1')))).toEqual({
      caminho: '/avaliacoes',
      params: { pagina: 1, professorId: 'prof-1' },
    })
    expect(consultas.getQueryCache().getAll()).toHaveLength(4)
  })

  it('para o aluno, a tela inicial leva o histórico dele e as faixas do gráfico', async () => {
    const consultas = new QueryClient()
    const { cliente, chamadas } = clienteFalso()
    await precarregarInicio(consultas, cliente, ALUNO)
    expect(chamadas.toSorted((a, b) => a.localeCompare(b))).toEqual(['/avaliacoes', '/avaliacoes/faixas'])
    expect(consultas.getQueryData(chavesDeAvaliacoes.lista(filtrosDoHistorico('aluno-1')))).toBeDefined()
    expect(consultas.getQueryData(chavesDeAvaliacoes.faixas())).toBeDefined()
  })

  it('as listas e os filtros de escolha ficam nas chaves que as telas leem', async () => {
    const consultas = new QueryClient()
    const { cliente } = clienteFalso()
    await Promise.all([
      precarregarAvaliacoes(consultas, cliente, PRIMEIRA_PAGINA),
      precarregarUsuarios(consultas, cliente, PRIMEIRA_PAGINA),
      precarregarEscolha(consultas, cliente, 'ALUNO'),
    ])
    expect(consultas.getQueryData(chavesDeAvaliacoes.lista(PRIMEIRA_PAGINA))).toBeDefined()
    expect(consultas.getQueryData(chavesDeUsuarios.lista(PRIMEIRA_PAGINA))).toBeDefined()
    expect(consultas.getQueryData(chavesDeUsuarios.escolha('ALUNO', false))).toEqual({
      caminho: '/usuarios',
      params: { pagina: 1, limite: 100, perfil: 'ALUNO' },
    })
  })

  it('uma busca que falha no servidor não derruba a página: só fica fora do cache', async () => {
    const consultas = new QueryClient()
    const cliente = { get: () => Promise.reject(new Error('API fora do ar')) } as unknown as ClienteHttp
    await expect(precarregarAvaliacoes(consultas, cliente, PRIMEIRA_PAGINA)).resolves.toBeUndefined()
    expect(consultas.getQueryData(chavesDeAvaliacoes.lista(PRIMEIRA_PAGINA))).toBeUndefined()
  })
})

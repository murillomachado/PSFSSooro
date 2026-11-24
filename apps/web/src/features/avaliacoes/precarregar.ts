import type { QueryClient } from '@tanstack/react-query'
import type { ClienteHttp } from '@/lib/http-client.ts'
import { precarregar } from '@/lib/precarregar.ts'
import { chavesDeAvaliacoes, filtrosDoHistorico } from './chaves.ts'
import { type FiltrosDeAvaliacoes, listarAvaliacoes, listarFaixasImc } from './services/avaliacoes.service.ts'

/** No servidor: as consultas de avaliações que as telas fazem ao abrir, com as mesmas chaves dos hooks. */
export const precarregarAvaliacoes = (consultas: QueryClient, cliente: ClienteHttp, filtros: FiltrosDeAvaliacoes) =>
  precarregar(consultas, chavesDeAvaliacoes.lista(filtros), () => listarAvaliacoes(filtros, cliente))

/** O histórico e as faixas do IMC, para o gráfico de evolução de um aluno. */
export const precarregarEvolucao = (consultas: QueryClient, cliente: ClienteHttp, alunoId: string) =>
  Promise.all([
    precarregarAvaliacoes(consultas, cliente, filtrosDoHistorico(alunoId)),
    precarregar(consultas, chavesDeAvaliacoes.faixas(), () => listarFaixasImc(cliente)),
  ])

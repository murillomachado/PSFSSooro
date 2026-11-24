import type {
  AvaliacaoResposta,
  CriarAvaliacaoEntrada,
  EditarAvaliacaoEntrada,
  FaixaImcResposta,
  PaginaDeAvaliacoes,
} from '@psfssooro/contracts'
import { type ClienteHttp, http } from '@/lib/http-client.ts'

export interface FiltrosDeAvaliacoes {
  readonly pagina: number
  /** Itens por página; sem ele, vale o padrão da API. */
  readonly limite?: number
  readonly alunoId?: string
  readonly professorId?: string
  /** Primeiro dia do período (AAAA-MM-DD). */
  readonly de?: string
  /** Último dia do período (AAAA-MM-DD). */
  readonly ate?: string
}

export async function listarAvaliacoes(
  filtros: FiltrosDeAvaliacoes,
  cliente: ClienteHttp = http,
): Promise<PaginaDeAvaliacoes> {
  return (await cliente.get<PaginaDeAvaliacoes>('/avaliacoes', { params: filtros })).data
}

/** A tabela de classificação do IMC, como a API a define. */
export async function listarFaixasImc(cliente: ClienteHttp = http): Promise<FaixaImcResposta[]> {
  return (await cliente.get<FaixaImcResposta[]>('/avaliacoes/faixas')).data
}

export async function obterAvaliacao(id: string): Promise<AvaliacaoResposta> {
  return (await http.get<AvaliacaoResposta>(`/avaliacoes/${id}`)).data
}

export async function criarAvaliacao(entrada: CriarAvaliacaoEntrada): Promise<AvaliacaoResposta> {
  return (await http.post<AvaliacaoResposta>('/avaliacoes', entrada)).data
}

export async function editarAvaliacao(id: string, entrada: EditarAvaliacaoEntrada): Promise<AvaliacaoResposta> {
  return (await http.put<AvaliacaoResposta>(`/avaliacoes/${id}`, entrada)).data
}

export async function excluirAvaliacao(id: string): Promise<void> {
  await http.delete(`/avaliacoes/${id}`)
}

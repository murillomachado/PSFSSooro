import type { UsuarioRepository } from '../../usuarios/application/usuario-repository.ts'
import type { Avaliacao } from '../domain/avaliacao.ts'

/** A avaliação com os nomes do aluno e do professor, que a tela mostra. */
export interface AvaliacaoDetalhada {
  readonly avaliacao: Avaliacao
  readonly alunoNome: string
  readonly professorNome: string
}

async function nomesDe(usuarios: UsuarioRepository, avaliacoes: readonly Avaliacao[]): Promise<Map<string, string>> {
  const ids = [...new Set(avaliacoes.flatMap((avaliacao) => [avaliacao.alunoId, avaliacao.professorId]))]
  return new Map((await usuarios.buscarPorIds(ids)).map((usuario) => [usuario.id, usuario.nome]))
}

const paraDetalhe = (avaliacao: Avaliacao, nomes: ReadonlyMap<string, string>): AvaliacaoDetalhada => ({
  avaliacao,
  alunoNome: nomes.get(avaliacao.alunoId) ?? '',
  professorNome: nomes.get(avaliacao.professorId) ?? '',
})

export async function detalhar(
  usuarios: UsuarioRepository,
  avaliacoes: readonly Avaliacao[],
): Promise<AvaliacaoDetalhada[]> {
  const nomes = await nomesDe(usuarios, avaliacoes)
  return avaliacoes.map((avaliacao) => paraDetalhe(avaliacao, nomes))
}

export async function detalharUma(usuarios: UsuarioRepository, avaliacao: Avaliacao): Promise<AvaliacaoDetalhada> {
  return paraDetalhe(avaliacao, await nomesDe(usuarios, [avaliacao]))
}

import type { Perfil } from '@psfssooro/contracts'
import type { AvaliacaoRepository } from '../modules/avaliacoes/application/avaliacao-repository.ts'
import { criarAvaliacao } from '../modules/avaliacoes/domain/avaliacao.ts'
import type { UsuarioRepository } from '../modules/usuarios/application/usuario-repository.ts'
import type { HasherDeSenha, Relogio } from '../shared/security/portas.ts'

/** Senha de todos os usuários de demonstração. Não é segredo: está no README para a banca entrar. */
export const SENHA_DEMO = 'senha1234'

interface UsuarioDemo {
  readonly nome: string
  readonly usuario: string
  readonly perfil: Perfil
  readonly ativo: boolean
}

export const USUARIOS_DEMO: readonly UsuarioDemo[] = [
  { nome: 'Administrador', usuario: 'admin', perfil: 'ADMINISTRADOR', ativo: true },
  { nome: 'Paulo Ferreira', usuario: 'prof.paulo', perfil: 'PROFESSOR', ativo: true },
  { nome: 'Carla Mendes', usuario: 'prof.carla', perfil: 'PROFESSOR', ativo: true },
  { nome: 'Ana Souza', usuario: 'aluno.ana', perfil: 'ALUNO', ativo: true },
  { nome: 'Bruno Lima', usuario: 'aluno.bruno', perfil: 'ALUNO', ativo: true },
  { nome: 'Diego Inativo', usuario: 'aluno.inativo', perfil: 'ALUNO', ativo: false },
]

/** Avaliações de demonstração: [aluno, professor, data, altura em cm, peso em g]. Cobrem várias faixas de IMC. */
const AVALIACOES_DEMO: readonly (readonly [string, string, string, number, number])[] = [
  ['aluno.ana', 'prof.paulo', '2026-08-10', 165, 70_000],
  ['aluno.ana', 'prof.paulo', '2026-09-14', 165, 67_500],
  ['aluno.ana', 'prof.carla', '2026-10-19', 165, 65_000],
  ['aluno.bruno', 'prof.carla', '2026-09-01', 178, 95_000],
  ['aluno.bruno', 'prof.carla', '2026-10-20', 178, 88_000],
]

export interface DependenciasDoSeed {
  readonly usuarios: UsuarioRepository
  readonly avaliacoes: AvaliacaoRepository
  readonly hasher: HasherDeSenha
  readonly relogio: Relogio
  readonly gerarId: () => string
}

/** Cria os usuários de demonstração que ainda não existem. Pode rodar quantas vezes quiser. Devolve quantos criou. */
export async function semear({ usuarios, avaliacoes, hasher, relogio, gerarId }: DependenciasDoSeed): Promise<number> {
  const agora = relogio.agora().toISOString()
  const senhaHash = await hasher.gerar(SENHA_DEMO)
  let criados = 0
  for (const demo of USUARIOS_DEMO) {
    if ((await usuarios.buscarPorUsuario(demo.usuario)) !== undefined) continue
    await usuarios.salvar({ id: gerarId(), ...demo, senhaHash, criadoEm: agora, atualizadoEm: agora })
    criados += 1
  }
  await semearAvaliacoes({ usuarios, avaliacoes, hasher, relogio, gerarId })
  return criados
}

/** Só semeia se ainda não houver nenhuma avaliação, para nunca duplicar nem sobrescrever o que já foi registrado. */
async function semearAvaliacoes({ usuarios, avaliacoes, relogio, gerarId }: DependenciasDoSeed): Promise<void> {
  if ((await avaliacoes.listar({ pagina: 1, limite: 1 })).total > 0) return
  const agora = relogio.agora().toISOString()
  for (const [aluno, professor, dataAvaliacao, alturaCm, pesoG] of AVALIACOES_DEMO) {
    const alunoId = (await usuarios.buscarPorUsuario(aluno))?.id
    const professorId = (await usuarios.buscarPorUsuario(professor))?.id
    if (alunoId === undefined || professorId === undefined) continue
    const identidade = { id: gerarId(), criadoEm: agora, atualizadoEm: agora }
    await avaliacoes.salvar(criarAvaliacao(identidade, { alunoId, professorId, dataAvaliacao, alturaCm, pesoG }))
  }
}

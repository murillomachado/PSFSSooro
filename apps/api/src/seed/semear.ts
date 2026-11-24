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
  { nome: 'Michael Scott', usuario: 'michael.scott', perfil: 'ADMINISTRADOR', ativo: true },
  { nome: 'Dwight Schrute', usuario: 'dwight.schrute', perfil: 'PROFESSOR', ativo: true },
  { nome: 'Jim Halpert', usuario: 'jim.halpert', perfil: 'PROFESSOR', ativo: true },
  { nome: 'Pam Beesly', usuario: 'pam.beesly', perfil: 'ALUNO', ativo: true },
  { nome: 'Kevin Malone', usuario: 'kevin.malone', perfil: 'ALUNO', ativo: true },
  { nome: 'Stanley Hudson', usuario: 'stanley.hudson', perfil: 'ALUNO', ativo: true },
  { nome: 'Andy Bernard', usuario: 'andy.bernard', perfil: 'ALUNO', ativo: true },
  { nome: 'Angela Martin', usuario: 'angela.martin', perfil: 'ALUNO', ativo: true },
  { nome: 'Ryan Howard', usuario: 'ryan.howard', perfil: 'ALUNO', ativo: false },
]

const DWIGHT = 'dwight.schrute'
const JIM = 'jim.halpert'

interface HistoricoDemo {
  readonly aluno: string
  readonly alturaCm: number
  readonly dia: string
  /** Professor e peso (g) de cada mês, a partir de maio de 2026. */
  readonly mensais: readonly (readonly [string, number])[]
}

/** Seis avaliações mensais por aluno ativo, com tendências diferentes e mudanças de faixa do IMC. */
const HISTORICOS_DEMO: readonly HistoricoDemo[] = [
  {
    aluno: 'pam.beesly',
    alturaCm: 168,
    dia: '05',
    mensais: [
      [JIM, 67_000],
      [DWIGHT, 66_000],
      [JIM, 64_500],
      [DWIGHT, 63_500],
      [JIM, 62_500],
      [DWIGHT, 61_500],
    ],
  },
  {
    aluno: 'kevin.malone',
    alturaCm: 173,
    dia: '12',
    mensais: [
      [DWIGHT, 112_000],
      [DWIGHT, 109_000],
      [DWIGHT, 106_000],
      [DWIGHT, 104_000],
      [DWIGHT, 101_000],
      [JIM, 99_000],
    ],
  },
  {
    aluno: 'stanley.hudson',
    alturaCm: 180,
    dia: '19',
    mensais: [
      [JIM, 99_000],
      [JIM, 98_000],
      [JIM, 97_500],
      [JIM, 96_000],
      [JIM, 95_000],
      [JIM, 94_000],
    ],
  },
  {
    aluno: 'andy.bernard',
    alturaCm: 183,
    dia: '08',
    mensais: [
      [DWIGHT, 77_000],
      [DWIGHT, 79_000],
      [JIM, 80_500],
      [DWIGHT, 82_000],
      [DWIGHT, 84_000],
      [DWIGHT, 85_500],
    ],
  },
  {
    aluno: 'angela.martin',
    alturaCm: 155,
    dia: '26',
    mensais: [
      [DWIGHT, 46_500],
      [JIM, 46_000],
      [DWIGHT, 45_500],
      [JIM, 45_000],
      [DWIGHT, 44_500],
      [JIM, 44_000],
    ],
  },
]

const PRIMEIRO_MES = 5

/** Avaliações de demonstração: [aluno, professor, data, altura em cm, peso em g]. */
export const AVALIACOES_DEMO: readonly (readonly [string, string, string, number, number])[] = HISTORICOS_DEMO.flatMap(
  ({ aluno, alturaCm, dia, mensais }) =>
    mensais.map(([professor, pesoG], i) => {
      const mes = String(PRIMEIRO_MES + i).padStart(2, '0')
      return [aluno, professor, `2026-${mes}-${dia}`, alturaCm, pesoG] as const
    }),
)

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

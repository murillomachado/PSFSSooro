import { randomUUID } from 'node:crypto'
import { criarAvaliacao, type Avaliacao } from '../domain/avaliacao.ts'
import { MemoriaAvaliacaoRepository } from '../infra/memoria-avaliacao.repository.ts'
import { MemoriaUsuarioRepository } from '../../usuarios/infra/memoria-usuario.repository.ts'
import { AGORA, administrador, novoUsuario, repositorioCom } from '../../usuarios/testes/apoio.ts'

export { ADMIN, AGORA, relogioFixo } from '../../usuarios/testes/apoio.ts'

export const ANA = novoUsuario({ id: 'aluna-ana', nome: 'Ana Souza', usuario: 'aluno.ana' })
export const BRUNO = novoUsuario({ id: 'aluno-bruno', nome: 'Bruno Lima', usuario: 'aluno.bruno' })
export const PAULO = novoUsuario({ id: 'professor-1', nome: 'Paulo', usuario: 'prof.paulo', perfil: 'PROFESSOR' })
export const CARLA = novoUsuario({ id: 'professor-2', nome: 'Carla', usuario: 'prof.carla', perfil: 'PROFESSOR' })

/** Quem faz a requisição nos testes: o id é o mesmo do usuário gravado no repositório. */
export const comoAna = { id: ANA.id, perfil: 'ALUNO' } as const
export const comoBruno = { id: BRUNO.id, perfil: 'ALUNO' } as const
export const comoPaulo = { id: PAULO.id, perfil: 'PROFESSOR' } as const
export const comoCarla = { id: CARLA.id, perfil: 'PROFESSOR' } as const

export const DIA = '2026-11-20'

export function novaAvaliacao(parcial: Partial<Avaliacao> = {}): Avaliacao {
  const { id, criadoEm, atualizadoEm, ...dados } = {
    id: randomUUID(),
    alunoId: ANA.id,
    professorId: PAULO.id,
    dataAvaliacao: DIA,
    alturaCm: 175,
    pesoG: 72_000,
    criadoEm: AGORA,
    atualizadoEm: AGORA,
    ...parcial,
  }
  return criarAvaliacao({ id, criadoEm, atualizadoEm }, dados)
}

export interface Cenario {
  readonly usuarios: MemoriaUsuarioRepository
  readonly avaliacoes: MemoriaAvaliacaoRepository
}

/** Usuários padrão (admin, Paulo, Carla, Ana, Bruno) e, opcionalmente, avaliações já registradas. */
export async function cenario(...existentes: Avaliacao[]): Promise<Cenario> {
  const usuarios = await repositorioCom(administrador(), PAULO, CARLA, ANA, BRUNO)
  const avaliacoes = new MemoriaAvaliacaoRepository()
  for (const avaliacao of existentes) await avaliacoes.salvar(avaliacao)
  return { usuarios, avaliacoes }
}

import type { Perfil } from '@psfssooro/contracts'
import { EntradaInvalida, NaoEncontrado, RegraDeNegocio, SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { UsuarioRepository } from './usuario-repository.ts'

/** O perfil que o usuário terá, o responsável pedido (se algum) e o atual (na edição). */
export interface PedidoDeResponsavel {
  readonly perfil: Perfil
  readonly informado: string | undefined
  readonly atual?: string
}

/**
 * O professor responsável por um aluno (RN6). O professor que cadastra é o responsável; só o
 * administrador escolhe ou transfere. Quem não é aluno não tem responsável.
 */
export async function definirResponsavel(
  usuarios: UsuarioRepository,
  ator: Ator,
  { perfil, informado, atual }: PedidoDeResponsavel,
): Promise<string | undefined> {
  if (perfil !== 'ALUNO') return undefined
  if (ator.perfil !== 'ADMINISTRADOR') {
    if (informado !== undefined && informado !== ator.id) {
      throw new SemPermissao('Só o administrador escolhe o professor responsável.', 'RESPONSAVEL_NAO_PERMITIDO')
    }
    return atual ?? ator.id
  }
  const escolhido = informado ?? atual
  if (escolhido === undefined) {
    throw new EntradaInvalida([{ campo: 'professorId', mensagem: 'Escolha o professor responsável' }])
  }
  if (escolhido !== atual) await garantirProfessorAtivo(usuarios, escolhido)
  return escolhido
}

async function garantirProfessorAtivo(usuarios: UsuarioRepository, id: string): Promise<void> {
  const professor = await usuarios.buscarPorId(id)
  if (professor?.perfil !== 'PROFESSOR')
    throw new NaoEncontrado('Professor não encontrado.', 'PROFESSOR_NAO_ENCONTRADO')
  if (!professor.ativo) {
    throw new RegraDeNegocio('Um professor inativo não pode ser o responsável por alunos.', 'PROFESSOR_INATIVO')
  }
}

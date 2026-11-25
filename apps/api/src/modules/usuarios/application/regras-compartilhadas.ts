import { Conflito, NaoEncontrado } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import { atorEnxerga } from '../domain/politicas.ts'
import type { Usuario } from '../domain/usuario.ts'
import type { UsuarioRepository } from './usuario-repository.ts'

/**
 * Acha o usuário que o ator pode enxergar. Quem não existe e quem o ator não pode ver dão o mesmo
 * 404, para a resposta não confirmar que um usuário fora do alcance existe.
 */
export async function localizarVisivel(usuarios: UsuarioRepository, ator: Ator, id: string): Promise<Usuario> {
  const usuario = await usuarios.buscarPorId(id)
  if (usuario === undefined || !atorEnxerga(ator, usuario)) {
    throw new NaoEncontrado('Usuário não encontrado.', 'USUARIO_NAO_ENCONTRADO')
  }
  return usuario
}

/** O erro de nome de usuário repetido, o mesmo para o caso de uso e para os repositórios. */
export const usuarioJaExiste = (): Conflito =>
  new Conflito('Já existe um usuário com este nome de usuário.', 'USUARIO_JA_EXISTE')

/** O professor que ainda é responsável por alunos não pode deixar de ser professor (RN6): os alunos ficariam sem ninguém. */
export async function garantirSemAlunos(usuarios: UsuarioRepository, alvo: Usuario, acao: string): Promise<void> {
  if (alvo.perfil !== 'PROFESSOR' || (await usuarios.idsDosAlunosDe(alvo.id)).length === 0) return
  throw new Conflito(
    `Este professor é responsável por alunos e não pode ${acao}. Transfira os alunos para outro professor antes.`,
    'PROFESSOR_COM_ALUNOS',
  )
}

export async function garantirUsuarioLivre(usuarios: UsuarioRepository, usuario: string): Promise<void> {
  if ((await usuarios.buscarPorUsuario(usuario)) !== undefined) throw usuarioJaExiste()
}

import type { Perfil } from '@psfssooro/contracts'
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

export interface DependenciasDoSeed {
  readonly usuarios: UsuarioRepository
  readonly hasher: HasherDeSenha
  readonly relogio: Relogio
  readonly gerarId: () => string
}

/** Cria os usuários de demonstração que ainda não existem. Pode rodar quantas vezes quiser. Devolve quantos criou. */
export async function semear({ usuarios, hasher, relogio, gerarId }: DependenciasDoSeed): Promise<number> {
  const agora = relogio.agora().toISOString()
  const senhaHash = await hasher.gerar(SENHA_DEMO)
  let criados = 0
  for (const demo of USUARIOS_DEMO) {
    if ((await usuarios.buscarPorUsuario(demo.usuario)) !== undefined) continue
    await usuarios.salvar({ id: gerarId(), ...demo, senhaHash, criadoEm: agora, atualizadoEm: agora })
    criados += 1
  }
  return criados
}

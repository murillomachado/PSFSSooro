import type { CriarUsuarioEntrada } from '@psfssooro/contracts'
import { SemPermissao } from '../../../shared/errors/erros.ts'
import type { Ator } from '../../../shared/security/ator.ts'
import type { HasherDeSenha, Relogio } from '../../../shared/security/portas.ts'
import { atorGerencia } from '../domain/politicas.ts'
import type { Usuario } from '../domain/usuario.ts'
import { definirResponsavel } from './professor-responsavel.ts'
import { garantirUsuarioLivre } from './regras-compartilhadas.ts'
import type { UsuarioRepository } from './usuario-repository.ts'

export class CriarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: HasherDeSenha,
    private readonly relogio: Relogio,
    private readonly gerarId: () => string,
  ) {}

  async executar(ator: Ator, entrada: CriarUsuarioEntrada): Promise<Usuario> {
    if (!atorGerencia(ator, entrada.perfil)) {
      throw new SemPermissao('Você não pode cadastrar usuários com este perfil.', 'PERFIL_NAO_PERMITIDO')
    }
    const professorId = await definirResponsavel(this.usuarios, ator, {
      perfil: entrada.perfil,
      informado: entrada.professorId,
    })
    await garantirUsuarioLivre(this.usuarios, entrada.usuario)
    const agora = this.relogio.agora().toISOString()
    const usuario: Usuario = {
      id: this.gerarId(),
      nome: entrada.nome,
      usuario: entrada.usuario,
      senhaHash: await this.hasher.gerar(entrada.senha),
      perfil: entrada.perfil,
      ativo: true,
      ...(professorId === undefined ? {} : { professorId }),
      criadoEm: agora,
      atualizadoEm: agora,
    }
    await this.usuarios.salvar(usuario)
    return usuario
  }
}

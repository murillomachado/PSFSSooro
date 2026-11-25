'use client'

import type { Perfil, UsuarioResposta } from '@psfssooro/contracts'
import { Badge, Button } from '@chakra-ui/react'
import { BotaoDeEditar, BotaoDeExcluir } from '@/components/ui/AcoesDaLinha.tsx'
import { type Coluna, TabelaResponsiva } from '@/components/ui/TabelaResponsiva.tsx'
import { NOME_DO_PERFIL } from '../perfis.ts'

interface TabelaDeUsuariosProps {
  readonly usuarios: readonly UsuarioResposta[]
  readonly perfilDoAtor: Perfil
  /** O nome de cada professor pelo id, para a coluna do responsável (só o administrador vê). */
  readonly professores?: ReadonlyMap<string, string>
  readonly aoAlterarSituacao: (usuario: UsuarioResposta) => void
  readonly aoExcluir: (usuario: UsuarioResposta) => void
}

const COLUNAS: readonly Coluna<UsuarioResposta>[] = [
  { titulo: 'Nome', valor: (u) => u.nome },
  { titulo: 'Usuário', valor: (u) => u.usuario },
  { titulo: 'Perfil', valor: (u) => NOME_DO_PERFIL[u.perfil] },
  {
    titulo: 'Situação',
    valor: (u) => (
      <Badge colorPalette={u.ativo ? 'green' : 'gray'} variant="subtle">
        {u.ativo ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
  },
]

/** A coluna do professor responsável pelo aluno (RN6); quem não é aluno não tem. */
const colunaDoResponsavel = (professores: ReadonlyMap<string, string>): Coluna<UsuarioResposta> => ({
  titulo: 'Professor',
  valor: (u) => (u.professorId === null ? '—' : (professores.get(u.professorId) ?? '—')),
})

/** Só o administrador ativa, inativa e exclui (RF2, RN1); administrador e professor editam. */
export function TabelaDeUsuarios({
  usuarios,
  perfilDoAtor,
  professores,
  aoAlterarSituacao,
  aoExcluir,
}: Readonly<TabelaDeUsuariosProps>) {
  const ehAdmin = perfilDoAtor === 'ADMINISTRADOR'
  return (
    <TabelaResponsiva
      itens={usuarios}
      colunas={professores === undefined ? COLUNAS : [...COLUNAS, colunaDoResponsavel(professores)]}
      chave={(u) => u.id}
      vazio="Nenhum usuário encontrado."
      acoes={(usuario) => (
        <>
          <BotaoDeEditar href={`/usuarios/${usuario.id}/editar`} />
          {ehAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                aoAlterarSituacao(usuario)
              }}
            >
              {usuario.ativo ? 'Inativar' : 'Ativar'}
            </Button>
          )}
          {ehAdmin && (
            <BotaoDeExcluir
              aoClicar={() => {
                aoExcluir(usuario)
              }}
            />
          )}
        </>
      )}
    />
  )
}

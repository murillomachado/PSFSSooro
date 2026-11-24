'use client'

import type { Perfil, UsuarioResposta } from '@psfssooro/contracts'
import { Badge, Button } from '@chakra-ui/react'
import { BotaoDeEditar, BotaoDeExcluir } from '@/components/ui/AcoesDaLinha.tsx'
import { type Coluna, TabelaResponsiva } from '@/components/ui/TabelaResponsiva.tsx'
import { NOME_DO_PERFIL } from '../perfis.ts'

interface TabelaDeUsuariosProps {
  readonly usuarios: readonly UsuarioResposta[]
  readonly perfilDoAtor: Perfil
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

/** Só o administrador ativa, inativa e exclui (RF2, RN1); administrador e professor editam. */
export function TabelaDeUsuarios({
  usuarios,
  perfilDoAtor,
  aoAlterarSituacao,
  aoExcluir,
}: Readonly<TabelaDeUsuariosProps>) {
  const ehAdmin = perfilDoAtor === 'ADMINISTRADOR'
  return (
    <TabelaResponsiva
      itens={usuarios}
      colunas={COLUNAS}
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

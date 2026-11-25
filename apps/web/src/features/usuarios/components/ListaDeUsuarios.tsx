'use client'

import type { Perfil, UsuarioResposta } from '@psfssooro/contracts'
import { useCallback, useState } from 'react'
import { avisarSucesso } from '@/components/ui/Avisos.tsx'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { DialogoDeConfirmacao } from '@/components/ui/DialogoDeConfirmacao.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { Paginacao } from '@/components/ui/Paginacao.tsx'
import { mensagemDeErro } from '@/lib/http-client.ts'
import { usePaginaValida } from '@/lib/usePaginaValida.ts'
import { PRIMEIRA_PAGINA } from '../chaves.ts'
import {
  useAlterarSituacao,
  useExcluirUsuario,
  useListaDeUsuarios,
  useUsuariosParaEscolha,
} from '../hooks/useUsuarios.ts'
import type { FiltrosDaLista } from '../services/usuarios.service.ts'
import { FiltrosDeUsuarios } from './FiltrosDeUsuarios.tsx'
import { TabelaDeUsuarios } from './TabelaDeUsuarios.tsx'

export function ListaDeUsuarios({ perfilDoAtor }: Readonly<{ perfilDoAtor: Perfil }>) {
  const [filtros, definirFiltros] = useState<FiltrosDaLista>(PRIMEIRA_PAGINA)
  const [paraExcluir, definirParaExcluir] = useState<UsuarioResposta | undefined>(undefined)
  const lista = useListaDeUsuarios(filtros)
  const situacao = useAlterarSituacao()
  const exclusao = useExcluirUsuario()
  const ehAdmin = perfilDoAtor === 'ADMINISTRADOR'
  // O administrador vê e filtra o professor responsável de cada aluno (RN6).
  const professores = useUsuariosParaEscolha('PROFESSOR', false, ehAdmin).data?.itens
  const nomesDosProfessores = ehAdmin ? new Map((professores ?? []).map((p) => [p.id, p.nome])) : undefined

  usePaginaValida(
    lista.data,
    useCallback((pagina: number) => {
      definirFiltros((atuais) => ({ ...atuais, pagina }))
    }, []),
  )

  const confirmarExclusao = () => {
    if (paraExcluir === undefined) return
    exclusao.reset()
    situacao.reset()
    exclusao.mutate(paraExcluir.id, {
      onSuccess: () => {
        avisarSucesso('Usuário excluído')
      },
      onSettled: () => {
        definirParaExcluir(undefined)
      },
    })
  }
  const erro = [lista.error, situacao.error, exclusao.error].find((e) => e !== null)

  return (
    <>
      <FiltrosDeUsuarios
        mostrarPerfil={ehAdmin}
        professores={ehAdmin ? (professores ?? []).map((p) => ({ valor: p.id, texto: p.nome })) : undefined}
        aoFiltrar={(novos) => {
          definirFiltros({ ...novos, pagina: 1 })
        }}
      />
      {erro !== undefined && <MensagemDeErro mensagem={mensagemDeErro(erro)} />}
      {lista.data === undefined ? (
        lista.isPending && <Carregando />
      ) : (
        <>
          <TabelaDeUsuarios
            usuarios={lista.data.itens}
            perfilDoAtor={perfilDoAtor}
            professores={nomesDosProfessores}
            aoAlterarSituacao={(usuario) => {
              exclusao.reset()
              situacao.mutate(
                { id: usuario.id, ativo: !usuario.ativo },
                {
                  onSuccess: () => {
                    avisarSucesso(usuario.ativo ? `${usuario.nome} foi inativado` : `${usuario.nome} foi ativado`)
                  },
                },
              )
            }}
            aoExcluir={definirParaExcluir}
          />
          <Paginacao
            pagina={lista.data.pagina}
            limite={lista.data.limite}
            total={lista.data.total}
            aoMudar={(pagina) => {
              definirFiltros({ ...filtros, pagina })
            }}
          />
        </>
      )}
      <DialogoDeConfirmacao
        aberto={paraExcluir !== undefined}
        titulo="Excluir usuário"
        mensagem={`Excluir ${paraExcluir?.nome ?? ''}? Quem tem avaliações não pode ser excluído; nesse caso, inative.`}
        rotuloDoBotao="Excluir"
        carregando={exclusao.isPending}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => {
          definirParaExcluir(undefined)
        }}
      />
    </>
  )
}

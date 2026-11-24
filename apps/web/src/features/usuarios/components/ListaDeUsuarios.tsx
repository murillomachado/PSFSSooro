'use client'

import type { Perfil, UsuarioResposta } from '@psfssooro/contracts'
import { useEffect, useState } from 'react'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { DialogoDeConfirmacao } from '@/components/ui/DialogoDeConfirmacao.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { Paginacao } from '@/components/ui/Paginacao.tsx'
import { mensagemDeErro } from '@/lib/http-client.ts'
import { useAlterarSituacao, useExcluirUsuario, useListaDeUsuarios } from '../hooks/useUsuarios.ts'
import type { FiltrosDaLista } from '../services/usuarios.service.ts'
import { FiltrosDeUsuarios } from './FiltrosDeUsuarios.tsx'
import { TabelaDeUsuarios } from './TabelaDeUsuarios.tsx'

export function ListaDeUsuarios({ perfilDoAtor }: Readonly<{ perfilDoAtor: Perfil }>) {
  const [filtros, definirFiltros] = useState<FiltrosDaLista>({ pagina: 1 })
  const [paraExcluir, definirParaExcluir] = useState<UsuarioResposta | undefined>(undefined)
  const lista = useListaDeUsuarios(filtros)
  const situacao = useAlterarSituacao()
  const exclusao = useExcluirUsuario()

  // Excluir o último item de uma página deixa a página pedida sem itens: volta para a última que existe.
  const { data } = lista
  useEffect(() => {
    if (data !== undefined && data.itens.length === 0 && data.pagina > 1) {
      const ultima = Math.max(1, Math.ceil(data.total / data.limite))
      definirFiltros((atuais) => ({ ...atuais, pagina: Math.min(atuais.pagina, ultima) }))
    }
  }, [data])

  const confirmarExclusao = () => {
    if (paraExcluir === undefined) return
    exclusao.reset()
    situacao.reset()
    exclusao.mutate(paraExcluir.id, {
      onSettled: () => {
        definirParaExcluir(undefined)
      },
    })
  }
  const erro = [lista.error, situacao.error, exclusao.error].find((e) => e !== null)

  return (
    <>
      <FiltrosDeUsuarios
        mostrarPerfil={perfilDoAtor === 'ADMINISTRADOR'}
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
            aoAlterarSituacao={(usuario) => {
              exclusao.reset()
              situacao.mutate({ id: usuario.id, ativo: !usuario.ativo })
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

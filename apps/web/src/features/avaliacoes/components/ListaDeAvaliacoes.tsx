'use client'

import type { AvaliacaoResposta } from '@psfssooro/contracts'
import { useCallback, useState } from 'react'
import { avisarSucesso } from '@/components/ui/Avisos.tsx'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { DialogoDeConfirmacao } from '@/components/ui/DialogoDeConfirmacao.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { Paginacao } from '@/components/ui/Paginacao.tsx'
import { Flex, Icon, Text } from '@chakra-ui/react'
import { LuChartLine } from 'react-icons/lu'
import { useUsuariosParaEscolha } from '@/features/usuarios/hooks/useUsuarios.ts'
import { mensagemDeErro } from '@/lib/http-client.ts'
import { usePaginaValida } from '@/lib/usePaginaValida.ts'
import type { Ator } from '../ator.ts'
import { PRIMEIRA_PAGINA } from '../chaves.ts'
import { GraficoDeEvolucao } from '../evolucao/GraficoDeEvolucao.tsx'
import { useExcluirAvaliacao, useListaDeAvaliacoes } from '../hooks/useAvaliacoes.ts'
import type { FiltrosDeAvaliacoes } from '../services/avaliacoes.service.ts'
import { FiltrosDeAvaliacoes as Filtros } from './FiltrosDeAvaliacoes.tsx'
import { comoOpcoes, type Opcao } from './FormularioDeAvaliacao.tsx'
import { TabelaDeAvaliacoes } from './TabelaDeAvaliacoes.tsx'

function opcoesDoFiltroDeProfessor(
  ator: Ator,
  professores: readonly { id: string; nome: string }[] | undefined,
): Opcao[] {
  if (ator.perfil === 'ADMINISTRADOR') return comoOpcoes(professores)
  return ator.perfil === 'PROFESSOR' ? [{ valor: ator.id, texto: 'Somente as minhas' }] : []
}

/** Para professor e administrador, o gráfico aparece quando a lista é filtrada por um aluno. */
function ConviteAoGrafico() {
  return (
    <Flex align="center" gap="2" mb="5" color="fg.muted" fontSize="sm">
      <Icon as={LuChartLine} />
      <Text>Filtre por um aluno para ver o gráfico da evolução do IMC dele.</Text>
    </Flex>
  )
}

export function ListaDeAvaliacoes({ ator }: Readonly<{ ator: Ator }>) {
  const [filtros, definirFiltros] = useState<FiltrosDeAvaliacoes>(PRIMEIRA_PAGINA)
  const [paraExcluir, definirParaExcluir] = useState<AvaliacaoResposta | undefined>(undefined)
  const lista = useListaDeAvaliacoes(filtros)
  const exclusao = useExcluirAvaliacao()
  const ehAdmin = ator.perfil === 'ADMINISTRADOR'
  const alunos = useUsuariosParaEscolha('ALUNO', false, ator.perfil !== 'ALUNO')
  const professores = useUsuariosParaEscolha('PROFESSOR', false, ehAdmin)
  usePaginaValida(
    lista.data,
    useCallback((pagina: number) => {
      definirFiltros((atuais) => ({ ...atuais, pagina }))
    }, []),
  )

  // O professor não lista professores: o filtro dele é "só as que eu realizei".
  const opcoesDeProfessor = opcoesDoFiltroDeProfessor(ator, professores.data?.itens)
  const erro = [lista.error, exclusao.error].find((e) => e !== null)
  // O aluno vê sempre a própria evolução (RN7).
  const alunoDoGrafico = ator.perfil === 'ALUNO' ? ator.id : filtros.alunoId

  const confirmarExclusao = () => {
    if (paraExcluir === undefined) return
    exclusao.reset()
    exclusao.mutate(paraExcluir.id, {
      onSuccess: () => {
        avisarSucesso('Avaliação excluída')
      },
      onSettled: () => {
        definirParaExcluir(undefined)
      },
    })
  }

  return (
    <>
      <Filtros
        alunos={comoOpcoes(alunos.data?.itens)}
        professores={opcoesDeProfessor}
        aoFiltrar={(novos) => {
          definirFiltros({ ...novos, pagina: 1 })
        }}
      />
      {alunoDoGrafico === undefined ? <ConviteAoGrafico /> : <GraficoDeEvolucao alunoId={alunoDoGrafico} />}
      {erro !== undefined && <MensagemDeErro mensagem={mensagemDeErro(erro)} />}
      {lista.data === undefined ? (
        lista.isPending && <Carregando />
      ) : (
        <>
          <TabelaDeAvaliacoes avaliacoes={lista.data.itens} ator={ator} aoExcluir={definirParaExcluir} />
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
        titulo="Excluir avaliação"
        mensagem={`Excluir a avaliação de ${paraExcluir?.aluno.nome ?? ''}? Essa ação não tem volta.`}
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

'use client'

import type { AvaliacaoResposta } from '@psfssooro/contracts'
import { Badge } from '@chakra-ui/react'
import { BotaoDeEditar, BotaoDeExcluir } from '@/components/ui/AcoesDaLinha.tsx'
import { type Coluna, TabelaResponsiva } from '@/components/ui/TabelaResponsiva.tsx'
import { corDaFaixa, formatarAltura, formatarData, formatarImc, formatarPeso } from '../apresentacao.ts'
import type { Ator } from '../ator.ts'

interface TabelaDeAvaliacoesProps {
  readonly avaliacoes: readonly AvaliacaoResposta[]
  readonly ator: Ator
  readonly aoExcluir: (avaliacao: AvaliacaoResposta) => void
}

/** O administrador edita todas e exclui (RN2); o professor edita só as que realizou (RN5); o aluno só consulta. */
const podeEditar = (ator: Ator, a: AvaliacaoResposta): boolean =>
  ator.perfil === 'ADMINISTRADOR' || (ator.perfil === 'PROFESSOR' && a.professor.id === ator.id)

const COLUNAS: readonly Coluna<AvaliacaoResposta>[] = [
  { titulo: 'Data', valor: (a) => formatarData(a.dataAvaliacao) },
  { titulo: 'Aluno', valor: (a) => a.aluno.nome },
  { titulo: 'Professor', valor: (a) => a.professor.nome },
  { titulo: 'Altura', valor: (a) => formatarAltura(a.alturaM), numerica: true },
  { titulo: 'Peso', valor: (a) => formatarPeso(a.pesoKg), numerica: true },
  { titulo: 'IMC', valor: (a) => formatarImc(a.imc), numerica: true },
  {
    titulo: 'Classificação',
    valor: (a) => (
      <Badge colorPalette={corDaFaixa(a.classificacao.codigo)} variant="subtle">
        {a.classificacao.descricao}
      </Badge>
    ),
  },
]

export function TabelaDeAvaliacoes({ avaliacoes, ator, aoExcluir }: Readonly<TabelaDeAvaliacoesProps>) {
  const temAcoes = ator.perfil !== 'ALUNO'
  return (
    <TabelaResponsiva
      itens={avaliacoes}
      colunas={COLUNAS}
      chave={(a) => a.id}
      vazio="Nenhuma avaliação encontrada."
      {...(temAcoes && {
        acoes: (a: AvaliacaoResposta) => (
          <>
            {podeEditar(ator, a) && <BotaoDeEditar href={`/avaliacoes/${a.id}/editar`} />}
            {ator.perfil === 'ADMINISTRADOR' && (
              <BotaoDeExcluir
                aoClicar={() => {
                  aoExcluir(a)
                }}
              />
            )}
          </>
        ),
      })}
    />
  )
}

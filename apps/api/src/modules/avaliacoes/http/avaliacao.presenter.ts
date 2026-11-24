import type { AvaliacaoResposta, PaginaDeAvaliacoes } from '@psfssooro/contracts'
import type { PaginaDe } from '../../../shared/paginacao.ts'
import type { AvaliacaoDetalhada } from '../application/detalhes.ts'
import { descreverFaixa } from '../domain/imc.ts'
import { emMetros, emQuilos } from '../domain/medidas.ts'

/** Converte o que o domínio guarda (inteiros) nas unidades da API: metros, quilos e IMC com uma casa. */
export function paraResposta({ avaliacao, alunoNome, professorNome }: AvaliacaoDetalhada): AvaliacaoResposta {
  return {
    id: avaliacao.id,
    aluno: { id: avaliacao.alunoId, nome: alunoNome },
    professor: { id: avaliacao.professorId, nome: professorNome },
    dataAvaliacao: avaliacao.dataAvaliacao,
    alturaM: emMetros(avaliacao.alturaCm),
    pesoKg: emQuilos(avaliacao.pesoG),
    imc: avaliacao.imcEmDecimos / 10,
    classificacao: { codigo: avaliacao.classificacao, descricao: descreverFaixa(avaliacao.classificacao) },
    criadoEm: avaliacao.criadoEm,
    atualizadoEm: avaliacao.atualizadoEm,
  }
}

export function paginaParaResposta(pagina: PaginaDe<AvaliacaoDetalhada>): PaginaDeAvaliacoes {
  return { ...pagina, itens: pagina.itens.map(paraResposta) }
}

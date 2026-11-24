import type { Avaliacao } from '../domain/avaliacao.ts'
import { AvaliacaoEntity } from './avaliacao.entity.ts'

export function paraDominio(entidade: AvaliacaoEntity): Avaliacao {
  return {
    id: entidade.id,
    alunoId: entidade.alunoId,
    professorId: entidade.professorId,
    dataAvaliacao: entidade.dataAvaliacao,
    alturaCm: entidade.alturaCm,
    pesoG: entidade.pesoG,
    imcEmDecimos: entidade.imcEmDecimos,
    classificacao: entidade.classificacao,
    criadoEm: entidade.criadoEm,
    atualizadoEm: entidade.atualizadoEm,
  }
}

export function paraPersistencia(avaliacao: Avaliacao): AvaliacaoEntity {
  return Object.assign(new AvaliacaoEntity(), avaliacao)
}

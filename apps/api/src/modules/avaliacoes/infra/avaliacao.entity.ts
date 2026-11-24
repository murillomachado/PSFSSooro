import { Column, Entity, PrimaryColumn } from 'typeorm'

/** A tabela `avaliacoes`. Só persistência: nunca sai de infra/. Altura em centímetros, peso em gramas, IMC em décimos. */
@Entity('avaliacoes')
export class AvaliacaoEntity {
  @PrimaryColumn({ type: 'varchar' })
  id!: string

  @Column({ type: 'varchar', name: 'aluno_id' })
  alunoId!: string

  @Column({ type: 'varchar', name: 'professor_id' })
  professorId!: string

  @Column({ type: 'varchar', name: 'data_avaliacao' })
  dataAvaliacao!: string

  @Column({ type: 'integer', name: 'altura_cm' })
  alturaCm!: number

  @Column({ type: 'integer', name: 'peso_g' })
  pesoG!: number

  @Column({ type: 'integer', name: 'imc_decimos' })
  imcEmDecimos!: number

  @Column({ type: 'varchar' })
  classificacao!: string

  @Column({ type: 'varchar', name: 'criado_em' })
  criadoEm!: string

  @Column({ type: 'varchar', name: 'atualizado_em' })
  atualizadoEm!: string
}

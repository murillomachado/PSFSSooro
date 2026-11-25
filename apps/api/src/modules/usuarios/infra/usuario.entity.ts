import { Column, Entity, PrimaryColumn } from 'typeorm'

/**
 * A tabela `usuarios`. Esta classe é só persistência e nunca sai de infra/: o resto da API
 * trabalha com o tipo Usuario do domínio, convertido pelo mapper. Toda coluna declara o `type`,
 * porque o tsx não emite os metadados de tipo que o TypeORM usaria para adivinhar.
 */
@Entity('usuarios')
export class UsuarioEntity {
  @PrimaryColumn({ type: 'varchar' })
  id!: string

  @Column({ type: 'varchar' })
  nome!: string

  @Column({ type: 'varchar' })
  usuario!: string

  @Column({ type: 'varchar', name: 'senha_hash' })
  senhaHash!: string

  @Column({ type: 'varchar' })
  perfil!: string

  @Column({ type: 'boolean', default: true })
  ativo!: boolean

  @Column({ type: 'varchar', name: 'professor_id', nullable: true })
  professorId!: string | null

  @Column({ type: 'varchar', name: 'criado_em' })
  criadoEm!: string

  @Column({ type: 'varchar', name: 'atualizado_em' })
  atualizadoEm!: string
}

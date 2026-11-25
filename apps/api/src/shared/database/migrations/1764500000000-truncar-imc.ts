import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Faixas como estavam quando esta migration foi escrita. Uma migration é uma foto do banco naquele
 * momento: ela não lê o catálogo do domínio, que pode ganhar faixas depois.
 */
const CLASSIFICAR = `CASE
  WHEN imc_decimos >= 400 THEN 'OBESIDADE_III'
  WHEN imc_decimos >= 350 THEN 'OBESIDADE_II'
  WHEN imc_decimos >= 300 THEN 'OBESIDADE_I'
  WHEN imc_decimos >= 250 THEN 'SOBREPESO'
  WHEN imc_decimos >= 185 THEN 'PESO_NORMAL'
  ELSE 'ABAIXO_DO_PESO'
END`

/** As avaliações já gravadas passam ao IMC truncado e à faixa do valor exato (D5). */
export class TruncarImc1764500000000 implements MigrationInterface {
  name = 'TruncarImc1764500000000'

  async up(consulta: QueryRunner): Promise<void> {
    // No SQLite, a divisão entre inteiros já descarta as casas: é o truncamento.
    await consulta.query('UPDATE avaliacoes SET imc_decimos = (peso_g * 100) / (altura_cm * altura_cm)')
    await consulta.query(`UPDATE avaliacoes SET classificacao = ${CLASSIFICAR}`)
  }

  async down(consulta: QueryRunner): Promise<void> {
    // A regra anterior: arredondar para uma casa, com a metade para cima.
    await consulta.query(
      'UPDATE avaliacoes SET imc_decimos = (2 * peso_g * 100 + altura_cm * altura_cm) / (2 * altura_cm * altura_cm)',
    )
    await consulta.query(`UPDATE avaliacoes SET classificacao = ${CLASSIFICAR}`)
  }
}

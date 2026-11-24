import { describe, expect, it } from 'vitest'
import { corDaFaixa, formatarAltura, formatarData, formatarImc, formatarPeso, hoje } from './apresentacao.ts'

describe('apresentação das avaliações', () => {
  it('formata data, IMC, altura e peso no padrão brasileiro', () => {
    expect(formatarData('2026-11-20')).toBe('20/11/2026')
    expect(formatarImc(23.5)).toBe('23,5')
    expect(formatarImc(31)).toBe('31,0')
    expect(formatarAltura(1.75)).toBe('1,75 m')
    expect(formatarPeso(72.4)).toBe('72,4 kg')
    expect(formatarPeso(72)).toBe('72 kg')
  })

  it('dá uma cor a cada faixa do IMC e cinza ao que não conhece', () => {
    expect(corDaFaixa('PESO_NORMAL')).toBe('green')
    expect(corDaFaixa('OBESIDADE_III')).toBe('red')
    expect(corDaFaixa('OUTRA')).toBe('gray')
  })

  it('hoje vem em AAAA-MM-DD', () => {
    expect(hoje()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

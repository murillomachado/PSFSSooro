import { describe, expect, it } from 'vitest'
import { FAIXAS_IMC, calcularImcEmDecimos, classificar } from './imc.ts'
import { emCentimetros, emGramas, emMetros, emQuilos } from './medidas.ts'

describe('calcularImcEmDecimos', () => {
  it('calcula o IMC em décimos, em inteiros: 70 kg com 1,75 m dá 22,9', () => {
    expect(calcularImcEmDecimos(175, 70_000)).toBe(229)
  })

  it('arredonda para uma casa antes de classificar: 80 kg com 1,79 m (24,968) vira 25,0', () => {
    expect(calcularImcEmDecimos(179, 80_000)).toBe(250)
  })

  it('arredonda metade para cima, sem erro de ponto flutuante', () => {
    // 100 cm e 18,05 kg: 18,05 exato, que fica entre 18,0 e 18,1 e sobe para 18,1.
    expect(calcularImcEmDecimos(100, 18_050)).toBe(181)
    expect(calcularImcEmDecimos(100, 18_049)).toBe(180)
  })
})

describe('classificar: as fronteiras da tabela da especificação', () => {
  // Com 1,00 m, o IMC em décimos é o peso em gramas dividido por 100: o teste fica exato e legível.
  const classificacaoDe = (pesoEmGramas: number): string =>
    classificar(calcularImcEmDecimos(100, pesoEmGramas)).descricao

  it.each([
    [18_400, 'Abaixo do peso'],
    [18_500, 'Peso normal'],
    [24_900, 'Peso normal'],
    [25_000, 'Sobrepeso'],
    [29_900, 'Sobrepeso'],
    [30_000, 'Obesidade grau I'],
    [34_900, 'Obesidade grau I'],
    [35_000, 'Obesidade grau II'],
    [39_900, 'Obesidade grau II'],
    [40_000, 'Obesidade grau III'],
    [55_000, 'Obesidade grau III'],
  ])('IMC de %d g por metro quadrado: %s', (pesoEmGramas, esperada) => {
    expect(classificacaoDe(pesoEmGramas)).toBe(esperada)
  })

  it('o caso arredondado (24,968 vira 25,0) é Sobrepeso, e 70 kg com 1,75 m é Peso normal', () => {
    expect(classificar(calcularImcEmDecimos(179, 80_000)).codigo).toBe('SOBREPESO')
    expect(classificar(calcularImcEmDecimos(175, 70_000)).codigo).toBe('PESO_NORMAL')
  })

  it('uma faixa nova é uma linha nova no catálogo: nenhuma função muda', () => {
    const comMagreza = [
      { codigo: 'MAGREZA_GRAVE', descricao: 'Magreza grave', minimoEmDecimos: 0 },
      { codigo: 'ABAIXO_DO_PESO', descricao: 'Abaixo do peso', minimoEmDecimos: 160 },
      ...FAIXAS_IMC.slice(1),
    ]
    expect(classificar(150, comMagreza).codigo).toBe('MAGREZA_GRAVE')
    expect(classificar(170, comMagreza).codigo).toBe('ABAIXO_DO_PESO')
    expect(classificar(250, comMagreza).codigo).toBe('SOBREPESO')
  })
})

describe('catálogo FAIXAS_IMC', () => {
  it('cobre todo o intervalo, sem buracos: começa em zero e cada faixa começa onde a anterior termina', () => {
    expect(FAIXAS_IMC[0]?.minimoEmDecimos).toBe(0)
    const minimos = FAIXAS_IMC.map((faixa) => faixa.minimoEmDecimos)
    expect(minimos).toEqual(minimos.toSorted((a, b) => a - b))
    expect(new Set(minimos).size).toBe(minimos.length)
  })

  it('tem as seis faixas da especificação', () => {
    expect(FAIXAS_IMC.map((faixa) => faixa.descricao)).toEqual([
      'Abaixo do peso',
      'Peso normal',
      'Sobrepeso',
      'Obesidade grau I',
      'Obesidade grau II',
      'Obesidade grau III',
    ])
  })
})

describe('medidas', () => {
  it('converte metros e quilos para inteiros (centímetros e gramas) sem perder as casas', () => {
    expect(emCentimetros(1.75)).toBe(175)
    expect(emCentimetros(1.79)).toBe(179)
    expect(emGramas(72.4)).toBe(72_400)
    expect(emGramas(70.05)).toBe(70_050)
  })

  it('volta de inteiros para metros e quilos', () => {
    expect(emMetros(175)).toBeCloseTo(1.75, 10)
    expect(emQuilos(72_400)).toBeCloseTo(72.4, 10)
  })
})

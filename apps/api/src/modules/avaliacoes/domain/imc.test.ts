import { describe, expect, it } from 'vitest'
import { FAIXAS_IMC, calcularImcEmDecimos, classificar } from './imc.ts'
import { emCentimetros, emGramas, emMetros, emQuilos } from './medidas.ts'

describe('calcularImcEmDecimos', () => {
  it('calcula o IMC em décimos, em inteiros: 70 kg com 1,75 m (22,857) dá 22,8', () => {
    expect(calcularImcEmDecimos(175, 70_000)).toBe(228)
  })

  it('trunca na primeira casa, sem arredondar: 80 kg com 1,79 m (24,968) fica 24,9', () => {
    expect(calcularImcEmDecimos(179, 80_000)).toBe(249)
  })

  it('trunca sem erro de ponto flutuante', () => {
    // 100 cm: o IMC exato é o peso em kg. 18,099 fica 18,0; 18,100 é 18,1.
    expect(calcularImcEmDecimos(100, 18_099)).toBe(180)
    expect(calcularImcEmDecimos(100, 18_100)).toBe(181)
  })
})

describe('classificar: as fronteiras da tabela da especificação', () => {
  // Com 1,00 m, o IMC em décimos é o peso em gramas dividido por 100: o teste fica exato e legível.
  const classificacaoDe = (pesoEmGramas: number): string =>
    classificar(calcularImcEmDecimos(100, pesoEmGramas)).descricao

  it.each([
    [18_400, 'Abaixo do peso'],
    [18_499, 'Abaixo do peso'],
    [18_500, 'Peso normal'],
    [24_900, 'Peso normal'],
    [24_999, 'Peso normal'],
    [25_000, 'Sobrepeso'],
    [29_999, 'Sobrepeso'],
    [29_900, 'Sobrepeso'],
    [30_000, 'Obesidade grau I'],
    [34_900, 'Obesidade grau I'],
    [35_000, 'Obesidade grau II'],
    [39_900, 'Obesidade grau II'],
    [39_999, 'Obesidade grau II'],
    [40_000, 'Obesidade grau III'],
    [55_000, 'Obesidade grau III'],
  ])('IMC de %d g por metro quadrado: %s', (pesoEmGramas, esperada) => {
    expect(classificacaoDe(pesoEmGramas)).toBe(esperada)
  })

  it('o que cai entre as linhas da tabela fica na faixa de baixo: 24,968 é Peso normal, 18,48 é Abaixo do peso', () => {
    expect(classificar(calcularImcEmDecimos(179, 80_000)).codigo).toBe('PESO_NORMAL')
    expect(classificar(calcularImcEmDecimos(100, 18_480)).codigo).toBe('ABAIXO_DO_PESO')
  })

  it('o IMC exibido e a classificação sempre concordam com o IMC exato', () => {
    // Faixa pelo valor exato, em inteiros: IMC >= mínimo  <=>  gramas × 100 >= mínimo em décimos × cm².
    const faixaExata = (alturaCm: number, pesoG: number): string | undefined =>
      FAIXAS_IMC.findLast((faixa) => pesoG * 100 >= faixa.minimoEmDecimos * alturaCm * alturaCm)?.codigo
    for (let alturaCm = 140; alturaCm <= 210; alturaCm += 1) {
      for (let pesoG = 35_000; pesoG <= 160_000; pesoG += 97) {
        expect(classificar(calcularImcEmDecimos(alturaCm, pesoG)).codigo).toBe(faixaExata(alturaCm, pesoG))
      }
    }
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

export interface FaixaImc {
  readonly codigo: string
  readonly descricao: string
  /** Onde a faixa começa, em décimos de IMC (185 = 18,5). Ela vai até onde a próxima começa. */
  readonly minimoEmDecimos: number
}

/**
 * A tabela de classificação da especificação. Cada faixa declara só onde começa e termina onde a
 * próxima começa, então não sobra buraco entre elas. Faixa nova é uma linha nova aqui: nenhuma função muda.
 */
export const FAIXAS_IMC: readonly FaixaImc[] = [
  { codigo: 'ABAIXO_DO_PESO', descricao: 'Abaixo do peso', minimoEmDecimos: 0 },
  { codigo: 'PESO_NORMAL', descricao: 'Peso normal', minimoEmDecimos: 185 },
  { codigo: 'SOBREPESO', descricao: 'Sobrepeso', minimoEmDecimos: 250 },
  { codigo: 'OBESIDADE_I', descricao: 'Obesidade grau I', minimoEmDecimos: 300 },
  { codigo: 'OBESIDADE_II', descricao: 'Obesidade grau II', minimoEmDecimos: 350 },
  { codigo: 'OBESIDADE_III', descricao: 'Obesidade grau III', minimoEmDecimos: 400 },
]

/**
 * IMC truncado na primeira casa, em décimos (22,96 vira 229). A conta é toda em inteiros, para ser
 * exata: IMC × 10 = gramas × 100 ÷ cm², sem as casas seguintes. Truncar, e não arredondar, resolve o
 * que a tabela da especificação deixa entre uma linha e outra (24,95 não está em 18,5–24,9 nem em
 * 25–29,9): como as faixas começam em múltiplos de 0,1, o valor truncado cai sempre na mesma faixa
 * que o IMC exato, e o número exibido nunca contradiz a classificação (24,96 é 24,9 e Peso normal).
 */
export function calcularImcEmDecimos(alturaCm: number, pesoG: number): number {
  return Math.floor((pesoG * 100) / (alturaCm * alturaCm))
}

/** A faixa de um IMC em décimos: a última cujo início não passa dele. O catálogo vem ordenado e começa em zero. */
export function classificar(imcEmDecimos: number, faixas: readonly FaixaImc[] = FAIXAS_IMC): FaixaImc {
  const faixa = faixas.findLast((candidata) => imcEmDecimos >= candidata.minimoEmDecimos)
  if (faixa === undefined) throw new RangeError(`Nenhuma faixa de IMC para ${imcEmDecimos} décimos.`)
  return faixa
}

/** A descrição de uma faixa já gravada. Se o catálogo mudou e o código sumiu, devolve o próprio código. */
export function descreverFaixa(codigo: string, faixas: readonly FaixaImc[] = FAIXAS_IMC): string {
  return faixas.find((faixa) => faixa.codigo === codigo)?.descricao ?? codigo
}

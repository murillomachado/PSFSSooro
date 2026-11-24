const NUMERO = (casas: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

/** 2026-11-20 vira 20/11/2026, sem passar por Date (que mudaria o dia conforme o fuso). */
export function formatarData(dia: string): string {
  const [ano, mes, diaDoMes] = dia.split('-')
  return `${diaDoMes}/${mes}/${ano}`
}

export const formatarImc = (imc: number): string => NUMERO(1).format(imc)
export const formatarAltura = (metros: number): string => `${NUMERO(2).format(metros)} m`
export const formatarPeso = (quilos: number): string => `${new Intl.NumberFormat('pt-BR').format(quilos)} kg`

/** A cor da etiqueta de cada faixa do IMC: do azul (abaixo do peso) ao vermelho (obesidade). */
const COR_DA_FAIXA = new Map([
  ['ABAIXO_DO_PESO', 'blue'],
  ['PESO_NORMAL', 'green'],
  ['SOBREPESO', 'yellow'],
  ['OBESIDADE_I', 'orange'],
  ['OBESIDADE_II', 'red'],
  ['OBESIDADE_III', 'red'],
])

export const corDaFaixa = (codigo: string): string => COR_DA_FAIXA.get(codigo) ?? 'gray'

/** A data de hoje no fuso do navegador, em AAAA-MM-DD, para o padrão e o limite do campo de data. */
export function hoje(): string {
  const agora = new Date()
  const doisDigitos = (n: number): string => String(n).padStart(2, '0')
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`
}

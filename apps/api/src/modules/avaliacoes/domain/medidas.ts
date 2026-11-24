// A API fala em metros e quilos; o domínio e o banco guardam inteiros (centímetros e gramas), porque o
// SQLite guarda decimal como ponto flutuante e o IMC precisa de uma conta exata. A conversão é aqui.

export const emCentimetros = (metros: number): number => Math.round(metros * 100)
export const emGramas = (quilos: number): number => Math.round(quilos * 1000)
export const emMetros = (centimetros: number): number => centimetros / 100
export const emQuilos = (gramas: number): number => gramas / 1000

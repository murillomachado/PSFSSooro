'use client'

import { useMediaQuery } from '@chakra-ui/react'

/** Abaixo de 768px (o `md` do Chakra), as listas viram cartões. Antes de medir a tela, vale a versão larga. */
export function useTelaPequena(): boolean {
  const [pequena] = useMediaQuery(['(max-width: 47.99em)'], { fallback: [false] })
  return pequena ?? false
}

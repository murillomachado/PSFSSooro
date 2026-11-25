'use client'

import createCache, { type EmotionCache } from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { useServerInsertedHTML } from 'next/navigation'
import { type ReactNode, useState } from 'react'

interface Registro {
  readonly cache: EmotionCache
  /** Os nomes dos estilos gerados desde a última entrega, que ainda não foram para o HTML. */
  readonly retirarPendentes: () => string[]
}

function criarRegistro(): Registro {
  const cache = createCache({ key: 'css' })
  cache.compat = true
  const inserirOriginal = cache.insert.bind(cache)
  let pendentes: string[] = []
  cache.insert = (seletor, serializado, folha, deveGuardar) => {
    if (cache.inserted[serializado.name] === undefined) pendentes.push(serializado.name)
    return inserirOriginal(seletor, serializado, folha, deveGuardar)
  }
  const retirarPendentes = (): string[] => {
    const lista = pendentes
    pendentes = []
    return lista
  }
  return { cache, retirarPendentes }
}

/**
 * Os estilos do Chakra (Emotion) gerados no servidor vão para o <head>, e não soltos no meio do
 * <body>. Sem isso, o Emotion os move do <body> para o <head> no navegador enquanto o React confere
 * o HTML do servidor, o React acha um nó fora do lugar e refaz a página inteira (erro de hidratação).
 */
export function RegistroDeEstilos({ children }: { readonly children: ReactNode }) {
  const [{ cache, retirarPendentes }] = useState(criarRegistro)

  useServerInsertedHTML(() => {
    const nomes = retirarPendentes()
    if (nomes.length === 0) return null
    const novos = new Set(nomes)
    // Na ordem em que o Emotion os gerou, que é a ordem em que precisam aparecer.
    const estilos = Object.entries(cache.inserted)
      .filter(([nome, css]) => novos.has(nome) && typeof css === 'string')
      .map(([, css]) => css)
    return (
      <style
        key={nomes.join(' ')}
        data-emotion={`${cache.key} ${nomes.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: estilos.join('') }}
      />
    )
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}

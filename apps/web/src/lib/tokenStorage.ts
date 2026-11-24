const CHAVE = 'psfssooro.token'

// O Node 26 tem um `localStorage` global que não funciona no servidor do Next: por isso o teste de `window`.
const navegador = (): Storage | undefined => (typeof window === 'undefined' ? undefined : window.localStorage)

/** Guarda o token da sessão no navegador. O resto do app não toca no localStorage. */
export const tokenStorage = {
  obter: (): string | undefined => navegador()?.getItem(CHAVE) ?? undefined,
  salvar: (token: string): void => {
    navegador()?.setItem(CHAVE, token)
  },
  limpar: (): void => {
    navegador()?.removeItem(CHAVE)
  },
}

// O jsdom não mede a tela: não tem matchMedia, que o Chakra usa para saber o tamanho dela, nem
// ResizeObserver, que posiciona menus e dicas. Nos testes de componente, a tela é a de computador.
if (typeof window !== 'undefined') {
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      value: (media: string) => ({
        media,
        matches: false,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })
  }
  if (typeof window.ResizeObserver !== 'function') {
    window.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  }
}

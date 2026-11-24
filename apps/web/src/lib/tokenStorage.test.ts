// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { tokenStorage } from './tokenStorage.ts'

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('guarda, devolve e apaga o token', () => {
    expect(tokenStorage.obter()).toBeUndefined()
    tokenStorage.salvar('abc')
    expect(tokenStorage.obter()).toBe('abc')
    tokenStorage.limpar()
    expect(tokenStorage.obter()).toBeUndefined()
  })
})

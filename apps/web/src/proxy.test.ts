import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { USUARIO_EXEMPLO } from '@/testes/renderizar.tsx'
import { proxy } from './proxy.ts'

/** A API responde quem é o dono do cookie (ou 401, sem perfil). */
function apiResponde(perfil: 'ADMINISTRADOR' | 'PROFESSOR' | 'ALUNO' | undefined) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        perfil === undefined
          ? new Response('{}', { status: 401 })
          : new Response(JSON.stringify({ ...USUARIO_EXEMPLO, perfil }), { status: 200 }),
      ),
    ),
  )
}

async function abrir(caminho: string, comCookie = true): Promise<string | undefined> {
  const req = new NextRequest(`http://localhost:3000${caminho}`, {
    headers: comCookie ? { cookie: 'sessao=um-token' } : {},
  })
  const resposta = await proxy(req)
  const destino = resposta.headers.get('location')
  return destino === null ? undefined : new URL(destino).pathname
}

describe('proxy: as páginas são protegidas no servidor, antes de carregar', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sem cookie, toda página interna vai para o login, sem nem perguntar à API', async () => {
    apiResponde('ADMINISTRADOR')
    expect(await abrir('/avaliacoes', false)).toBe('/login')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('com um cookie que a API recusa, também vai para o login; e o login abre normalmente', async () => {
    apiResponde(undefined)
    expect(await abrir('/inicio')).toBe('/login')
    expect(await abrir('/login')).toBeUndefined()
  })

  it('logado, o login leva ao início e as páginas do perfil abrem', async () => {
    apiResponde('PROFESSOR')
    expect(await abrir('/login')).toBe('/inicio')
    expect(await abrir('/usuarios')).toBeUndefined()
    expect(await abrir('/avaliacoes/nova')).toBeUndefined()
  })

  it('o aluno que abre uma tela da equipe volta ao início (RN7)', async () => {
    apiResponde('ALUNO')
    expect(await abrir('/usuarios')).toBe('/inicio')
    expect(await abrir('/usuarios/novo')).toBe('/inicio')
    expect(await abrir('/avaliacoes/nova')).toBe('/inicio')
    expect(await abrir('/avaliacoes/abc/editar')).toBe('/inicio')
    expect(await abrir('/avaliacoes')).toBeUndefined()
  })

  it('se a API não responder, trata como sem sessão', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('fora do ar'))),
    )
    expect(await abrir('/inicio')).toBe('/login')
  })
})

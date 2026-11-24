// @vitest-environment jsdom
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { aoPerderASessaoFazer, http, mensagemDeErro } from './http-client.ts'

const PROBLEMA = {
  type: 'about:blank',
  title: 'Não autenticado',
  status: 401,
  detail: 'Usuário ou senha inválidos.',
  codigo: 'CREDENCIAIS_INVALIDAS',
}

function responderCom(status: number, dados: unknown): AxiosAdapter {
  return (config: InternalAxiosRequestConfig) => {
    const resposta = { data: dados, status, statusText: '', headers: {}, config } as AxiosResponse
    if (status < 400) return Promise.resolve(resposta)
    return Promise.reject(new AxiosError('falhou', 'ERR_BAD_REQUEST', config, undefined, resposta))
  }
}

describe('http-client', () => {
  afterEach(() => {
    aoPerderASessaoFazer(undefined)
  })

  it('envia o cookie da sessão em toda chamada e não guarda token no navegador', async () => {
    let comCookie: unknown
    let cabecalho: unknown
    await http.get('/auth/me', {
      adapter: (config) => {
        comCookie = config.withCredentials
        cabecalho = config.headers.Authorization
        return responderCom(200, {})(config)
      },
    })
    expect(comCookie).toBe(true)
    expect(cabecalho).toBeUndefined()
    expect(window.localStorage).toHaveLength(0)
  })

  it('perde a sessão num 401 fora do login: avisa quem cuida da sessão', async () => {
    const aviso = vi.fn()
    aoPerderASessaoFazer(aviso)
    await expect(http.get('/usuarios', { adapter: responderCom(401, PROBLEMA) })).rejects.toThrow()
    expect(aviso).toHaveBeenCalledOnce()
  })

  it('no login, um 401 é senha errada: não derruba a sessão', async () => {
    const aviso = vi.fn()
    aoPerderASessaoFazer(aviso)
    await expect(http.post('/auth/login', {}, { adapter: responderCom(401, PROBLEMA) })).rejects.toThrow()
    expect(aviso).not.toHaveBeenCalled()
  })

  it('traduz o erro em mensagem: a da API, a de falta de conexão e uma genérica', async () => {
    const erroDaApi = await http.get('/x', { adapter: responderCom(401, PROBLEMA) }).catch((erro: unknown) => erro)
    expect(mensagemDeErro(erroDaApi)).toBe('Usuário ou senha inválidos.')
    expect(mensagemDeErro(new AxiosError('Network Error', 'ERR_NETWORK'))).toMatch(/servidor/)
    expect(mensagemDeErro(new Error('x'))).toBe('Algo deu errado. Tente de novo.')
  })
})

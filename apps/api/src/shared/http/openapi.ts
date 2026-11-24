import { z } from 'zod'

export type Esquema = Record<string, unknown>
export type Caminhos = Record<string, Record<string, Esquema>>

/**
 * O JSON Schema de um schema do contracts, do lado da entrada (o que o cliente envia). Assim a
 * documentação sai das mesmas regras que validam a requisição e não fica desatualizada.
 */
export function esquema(schema: z.ZodType): Esquema {
  const { $schema: _versao, ...resto } = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })
  return resto
}

/** As propriedades de um schema de objeto viram parâmetros da URL (`path`) ou da consulta (`query`). */
function parametros(schema: z.ZodType, local: 'path' | 'query'): Esquema[] {
  const objeto = esquema(schema) as { properties?: Record<string, Esquema>; required?: string[] }
  return Object.entries(objeto.properties ?? {}).map(([nome, propriedade]) => ({
    name: nome,
    in: local,
    required: local === 'path' || (objeto.required ?? []).includes(nome),
    schema: propriedade,
  }))
}

const ERROS = new Map([
  [400, 'Dados inválidos (com a lista de campos)'],
  [401, 'Sem token, token inválido ou usuário inativo'],
  [403, 'O perfil não tem permissão, ou o usuário está inativo'],
  [404, 'Não encontrado'],
  [409, 'Conflito com o estado atual'],
  [422, 'Regra de negócio não atendida'],
])

const PROBLEMA = { content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problema' } } } }

export interface DescricaoDaOperacao {
  readonly resumo: string
  readonly tag: string
  /** Quem pode chamar; vazio quando a rota é pública. */
  readonly perfis: string
  readonly sucesso: { readonly status: number; readonly descricao: string; readonly schema?: z.ZodType }
  readonly erros: readonly number[]
  readonly corpo?: z.ZodType
  readonly caminho?: z.ZodType
  readonly consulta?: z.ZodType
}

/** Uma operação do OpenAPI com o token, os parâmetros, o corpo e as respostas de erro padronizadas (RFC 9457). */
export function operacao(d: DescricaoDaOperacao): Esquema {
  const respostas: Record<string, Esquema> = {
    [String(d.sucesso.status)]: {
      description: d.sucesso.descricao,
      ...(d.sucesso.schema === undefined
        ? {}
        : { content: { 'application/json': { schema: esquema(d.sucesso.schema) } } }),
    },
  }
  for (const status of d.erros) respostas[String(status)] = { description: ERROS.get(status) ?? 'Erro', ...PROBLEMA }
  return {
    summary: d.resumo,
    tags: [d.tag],
    ...(d.perfis === '' ? {} : { description: `Perfis: ${d.perfis}.`, security: [{ bearer: [] }] }),
    parameters: [
      ...(d.caminho === undefined ? [] : parametros(d.caminho, 'path')),
      ...(d.consulta === undefined ? [] : parametros(d.consulta, 'query')),
    ],
    ...(d.corpo === undefined
      ? {}
      : { requestBody: { required: true, content: { 'application/json': { schema: esquema(d.corpo) } } } }),
    responses: respostas,
  }
}

/** Campo que falhou na validação de uma entrada. */
export interface CampoInvalido {
  readonly campo: string
  readonly mensagem: string
}

/**
 * Erro previsto pelas regras do sistema. Os casos de uso lançam estes erros sem saber que existe HTTP:
 * quem traduz o erro para uma resposta é o tratador central (shared/http/tratar-erros.ts).
 */
export class ErroDeDominio extends Error {
  readonly status: number
  readonly codigo: string
  readonly titulo: string

  constructor(status: number, codigo: string, titulo: string, detalhe: string) {
    super(detalhe)
    this.name = new.target.name
    this.status = status
    this.codigo = codigo
    this.titulo = titulo
  }
}

export class EntradaInvalida extends ErroDeDominio {
  readonly campos: readonly CampoInvalido[]

  constructor(campos: readonly CampoInvalido[]) {
    super(400, 'ENTRADA_INVALIDA', 'Dados inválidos', 'Um ou mais campos são inválidos.')
    this.campos = campos
  }
}

export class NaoAutenticado extends ErroDeDominio {
  constructor(detalhe: string, codigo = 'NAO_AUTENTICADO') {
    super(401, codigo, 'Não autenticado', detalhe)
  }
}

export class SemPermissao extends ErroDeDominio {
  constructor(detalhe: string, codigo = 'SEM_PERMISSAO') {
    super(403, codigo, 'Sem permissão', detalhe)
  }
}

export class NaoEncontrado extends ErroDeDominio {
  constructor(detalhe: string, codigo = 'NAO_ENCONTRADO') {
    super(404, codigo, 'Não encontrado', detalhe)
  }
}

export class Conflito extends ErroDeDominio {
  constructor(detalhe: string, codigo = 'CONFLITO') {
    super(409, codigo, 'Conflito', detalhe)
  }
}

export class RegraDeNegocio extends ErroDeDominio {
  constructor(detalhe: string, codigo = 'REGRA_DE_NEGOCIO') {
    super(422, codigo, 'Regra de negócio violada', detalhe)
  }
}

export class MuitasTentativas extends ErroDeDominio {
  /** Quanto falta para poder tentar de novo, para o cabeçalho Retry-After. */
  readonly segundosParaTentarDeNovo: number

  constructor(detalhe: string, segundosParaTentarDeNovo: number) {
    super(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas', detalhe)
    this.segundosParaTentarDeNovo = segundosParaTentarDeNovo
  }
}

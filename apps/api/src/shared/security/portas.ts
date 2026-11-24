// Interfaces que os casos de uso conhecem. As implementações (scrypt, JWT, relógio do sistema)
// são entregues pelo container, e nos testes entram versões simples no lugar.

export interface HasherDeSenha {
  gerar(senha: string): Promise<string>
  conferir(senha: string, hash: string): Promise<boolean>
}

/** Usado só no login. Separado do verificador para quem só confere token não depender de gerar token. */
export interface GeradorDeToken {
  gerar(usuarioId: string): string
}

/** Usado só pelo middleware de autenticação. Devolve o id do usuário, ou undefined se o token não vale. */
export interface VerificadorDeToken {
  verificar(token: string): string | undefined
}

export interface Relogio {
  agora(): Date
}

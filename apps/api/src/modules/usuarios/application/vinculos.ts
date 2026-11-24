/**
 * O que o módulo de usuários precisa saber do módulo de avaliações: se um usuário aparece em alguma.
 * É uma interface minúscula, entregue pelo container, para os dois módulos não dependerem um do outro.
 */
export interface VinculosDoUsuario {
  possuiAvaliacoes(usuarioId: string): Promise<boolean>
}

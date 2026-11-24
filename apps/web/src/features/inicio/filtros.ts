import type { FiltrosDeAvaliacoes } from '@/features/avaliacoes/services/avaliacoes.service.ts'
import type { FiltrosDaLista } from '@/features/usuarios/services/usuarios.service.ts'

/** As consultas dos indicadores da tela inicial: o painel (navegador) e o servidor usam as mesmas. */
export const filtrosDoPainel = {
  usuarios: { pagina: 1, limite: 1 } satisfies FiltrosDaLista,
  alunosAtivos: { pagina: 1, limite: 1, perfil: 'ALUNO', ativo: true } satisfies FiltrosDaLista,
  avaliacoes: { pagina: 1 } satisfies FiltrosDeAvaliacoes,
  feitasPor: (professorId: string): FiltrosDeAvaliacoes => ({ pagina: 1, professorId }),
}

'use client'

import { useUsuariosParaEscolha } from '@/features/usuarios/hooks/useUsuarios.ts'
import { comoOpcoes, FormularioDeAvaliacao } from './FormularioDeAvaliacao.tsx'

type Props = Omit<Parameters<typeof FormularioDeAvaliacao>[0], 'alunos' | 'professores'>

/**
 * O formulário de avaliação com as listas de aluno e professor já carregadas. Só alunos e professores
 * ativos entram (RN9); o professor não carrega a lista de professores, porque o avaliador é ele.
 */
export function FormularioComOpcoes(props: Readonly<Props>) {
  const alunos = useUsuariosParaEscolha('ALUNO', true)
  const professores = useUsuariosParaEscolha('PROFESSOR', true, props.perfilDoAtor === 'ADMINISTRADOR')
  return (
    <FormularioDeAvaliacao
      {...props}
      alunos={comoOpcoes(alunos.data?.itens)}
      professores={comoOpcoes(professores.data?.itens)}
    />
  )
}

'use client'

import type { Opcao } from '@/components/ui/CampoDeSelecao.tsx'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { useUsuariosParaEscolha } from '../hooks/useUsuarios.ts'
import { FormularioDeUsuario } from './FormularioDeUsuario.tsx'

type Props = Omit<Parameters<typeof FormularioDeUsuario>[0], 'professores'> & { readonly ehAdmin: boolean }

/**
 * O formulário de usuário com a lista de professores para o responsável pelo aluno (RN6). Só o
 * administrador escolhe, entre os professores ativos; o atual continua na lista, mesmo que esteja inativo.
 */
export function FormularioDeUsuarioComOpcoes({ ehAdmin, ...props }: Readonly<Props>) {
  const professores = useUsuariosParaEscolha('PROFESSOR', true, ehAdmin)
  if (!ehAdmin) return <FormularioDeUsuario {...props} />
  // Espera a lista, para o responsável atual já vir selecionado ao abrir a edição.
  if (professores.isPending) return <Carregando />
  const opcoes: Opcao[] = (professores.data?.itens ?? []).map((p) => ({ valor: p.id, texto: p.nome }))
  const atual = props.usuario?.professorId
  if (atual != null && !opcoes.some((opcao) => opcao.valor === atual)) {
    opcoes.push({ valor: atual, texto: 'Professor atual (inativo)' })
  }
  return <FormularioDeUsuario {...props} professores={opcoes} />
}

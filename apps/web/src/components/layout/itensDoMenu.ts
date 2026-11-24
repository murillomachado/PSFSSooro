import type { Perfil } from '@psfssooro/contracts'
import type { IconType } from 'react-icons'
import { LuClipboardList, LuHouse, LuUsers } from 'react-icons/lu'

export interface ItemDoMenu {
  readonly href: string
  readonly rotulo: string
  readonly icone: IconType
}

/** O menu de cada perfil: o aluno vê só as próprias avaliações (RN7); o professor, só alunos (RN4). */
export function itensDoMenu(perfil: Perfil): ItemDoMenu[] {
  const itens: ItemDoMenu[] = [
    { href: '/inicio', rotulo: 'Início', icone: LuHouse },
    {
      href: '/avaliacoes',
      rotulo: perfil === 'ALUNO' ? 'Minhas avaliações' : 'Avaliações',
      icone: LuClipboardList,
    },
  ]
  if (perfil !== 'ALUNO') {
    itens.push({ href: '/usuarios', rotulo: perfil === 'ADMINISTRADOR' ? 'Usuários' : 'Alunos', icone: LuUsers })
  }
  return itens
}

/** O item fica ativo na própria página e nas de dentro dela (/avaliacoes/nova, por exemplo). */
export const itemAtivo = (href: string, caminho: string): boolean => caminho === href || caminho.startsWith(`${href}/`)

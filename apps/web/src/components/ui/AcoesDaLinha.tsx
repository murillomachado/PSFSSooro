import { IconButton } from '@chakra-ui/react'
import Link from 'next/link'
import { LuPencil, LuTrash2 } from 'react-icons/lu'

/** Ícone de editar; o nome acessível continua "Editar", para leitores de tela e para os testes. */
export function BotaoDeEditar({ href }: { readonly href: string }) {
  return (
    <IconButton asChild size="sm" variant="ghost" aria-label="Editar" title="Editar">
      <Link href={href}>
        <LuPencil />
      </Link>
    </IconButton>
  )
}

export function BotaoDeExcluir({ aoClicar }: { readonly aoClicar: () => void }) {
  return (
    <IconButton size="sm" variant="ghost" colorPalette="red" aria-label="Excluir" title="Excluir" onClick={aoClicar}>
      <LuTrash2 />
    </IconButton>
  )
}

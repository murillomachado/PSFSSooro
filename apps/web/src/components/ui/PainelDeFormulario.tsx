import { Button, Card } from '@chakra-ui/react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { LuArrowLeft } from 'react-icons/lu'
import { CabecalhoDePagina } from './CabecalhoDePagina.tsx'

interface PainelDeFormularioProps {
  readonly titulo: string
  readonly descricao: string
  /** A lista de onde a pessoa veio. */
  readonly voltarPara: string
  readonly children: ReactNode
}

/** As telas de cadastro e de edição: cabeçalho com "Voltar" e o formulário num painel de largura confortável. */
export function PainelDeFormulario({ titulo, descricao, voltarPara, children }: Readonly<PainelDeFormularioProps>) {
  return (
    <>
      <CabecalhoDePagina
        titulo={titulo}
        descricao={descricao}
        acao={
          <Button asChild variant="ghost" alignSelf="flex-start">
            <Link href={voltarPara}>
              <LuArrowLeft />
              Voltar
            </Link>
          </Button>
        }
      />
      <Card.Root maxW="2xl">
        <Card.Body>{children}</Card.Body>
      </Card.Root>
    </>
  )
}

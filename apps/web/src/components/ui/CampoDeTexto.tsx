import { Field, Input } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

interface CampoDeTextoProps extends ComponentProps<typeof Input> {
  readonly rotulo: string
  readonly erro: string | undefined
}

/** Campo de formulário com rótulo e mensagem de erro, reaproveitado em todos os formulários. */
export function CampoDeTexto({ rotulo, erro, ...entrada }: Readonly<CampoDeTextoProps>) {
  return (
    <Field.Root invalid={erro !== undefined}>
      <Field.Label>{rotulo}</Field.Label>
      <Input {...entrada} />
      {erro !== undefined && <Field.ErrorText>{erro}</Field.ErrorText>}
    </Field.Root>
  )
}

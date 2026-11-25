import { Field, NativeSelect } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

export interface Opcao {
  readonly valor: string
  readonly texto: string
}

interface CampoDeSelecaoProps extends ComponentProps<typeof NativeSelect.Field> {
  readonly rotulo: string
  readonly opcoes: readonly Opcao[]
  readonly erro?: string
}

/** Lista de escolha com rótulo e erro, no mesmo estilo do CampoDeTexto. */
export function CampoDeSelecao({ rotulo, opcoes, erro, ...campo }: Readonly<CampoDeSelecaoProps>) {
  return (
    <Field.Root invalid={erro !== undefined}>
      <Field.Label>{rotulo}</Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field {...campo}>
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.texto}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      {erro !== undefined && <Field.ErrorText>{erro}</Field.ErrorText>}
    </Field.Root>
  )
}

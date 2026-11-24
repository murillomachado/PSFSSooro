import { Alert } from '@chakra-ui/react'

/** Aviso de erro vindo da API, no topo de um formulário ou de uma lista. */
export function MensagemDeErro({ mensagem }: { readonly mensagem: string }) {
  return (
    <Alert.Root status="error" role="alert">
      <Alert.Indicator />
      <Alert.Title>{mensagem}</Alert.Title>
    </Alert.Root>
  )
}

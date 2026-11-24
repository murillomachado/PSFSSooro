import { Button, Dialog, Portal } from '@chakra-ui/react'

interface DialogoDeConfirmacaoProps {
  readonly aberto: boolean
  readonly titulo: string
  readonly mensagem: string
  readonly rotuloDoBotao: string
  readonly carregando: boolean
  readonly aoConfirmar: () => void
  readonly aoCancelar: () => void
}

/** Pede a confirmação antes de uma ação sem volta, como excluir. */
export function DialogoDeConfirmacao(props: Readonly<DialogoDeConfirmacaoProps>) {
  return (
    <Dialog.Root
      open={props.aberto}
      onOpenChange={(estado) => {
        if (!estado.open) props.aoCancelar()
      }}
      role="alertdialog"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{props.titulo}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{props.mensagem}</Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={props.aoCancelar}>
                Cancelar
              </Button>
              <Button colorPalette="red" loading={props.carregando} onClick={props.aoConfirmar}>
                {props.rotuloDoBotao}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

'use client'

import { createToaster, Portal, Stack, Toast, Toaster } from '@chakra-ui/react'

/** Avisos rápidos no canto da tela, como "Avaliação registrada". */
export const avisos = createToaster({ placement: 'bottom-end', pauseOnPageIdle: true })

export const avisarSucesso = (titulo: string): void => {
  avisos.create({ title: titulo, type: 'success', duration: 4000 })
}

export function Avisos() {
  return (
    <Portal>
      <Toaster toaster={avisos} insetInline={{ mdDown: '4' }}>
        {(aviso) => (
          <Toast.Root width={{ md: 'sm' }}>
            <Toast.Indicator />
            <Stack gap="1" flex="1" maxWidth="100%">
              {aviso.title !== undefined && <Toast.Title>{aviso.title}</Toast.Title>}
              {aviso.description !== undefined && <Toast.Description>{aviso.description}</Toast.Description>}
            </Stack>
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  )
}

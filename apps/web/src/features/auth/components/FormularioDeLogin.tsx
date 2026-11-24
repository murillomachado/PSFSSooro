'use client'

import { type LoginEntrada, loginSchema } from '@psfssooro/contracts'
import { Button, Stack } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CampoDeTexto } from '@/components/ui/CampoDeTexto.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { mensagemDeErro } from '@/lib/http-client.ts'
import { useEntrar } from '../hooks/useSessao.ts'

export function FormularioDeLogin() {
  const { mutate, isPending, error } = useEntrar()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginEntrada>({ resolver: zodResolver(loginSchema) })

  return (
    <form
      onSubmit={(evento) => {
        void handleSubmit((dados) => {
          mutate(dados)
        })(evento)
      }}
      noValidate
    >
      <Stack gap="4">
        {error !== null && <MensagemDeErro mensagem={mensagemDeErro(error)} />}
        <CampoDeTexto
          rotulo="Usuário"
          autoComplete="username"
          erro={errors.usuario?.message}
          {...register('usuario')}
        />
        <CampoDeTexto
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          erro={errors.senha?.message}
          {...register('senha')}
        />
        <Button type="submit" loading={isPending}>
          Entrar
        </Button>
      </Stack>
    </form>
  )
}

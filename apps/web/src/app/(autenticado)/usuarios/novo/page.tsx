'use client'

import type { CriarUsuarioEntrada } from '@psfssooro/contracts'
import { Heading } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { RotaDePerfil } from '@/components/ui/RotaDePerfil.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { FormularioDeUsuario } from '@/features/usuarios/components/FormularioDeUsuario.tsx'
import { useCriarUsuario } from '@/features/usuarios/hooks/useUsuarios.ts'
import { PERFIS_QUE_PODE_CADASTRAR } from '@/features/usuarios/perfis.ts'
import { mensagemDeErro } from '@/lib/http-client.ts'

export default function PaginaDeNovoUsuario() {
  const { usuario } = useSessao()
  const roteador = useRouter()
  const { mutate, isPending, error } = useCriarUsuario()

  return (
    <RotaDePerfil perfis={['ADMINISTRADOR', 'PROFESSOR']}>
      <Heading size="lg" mb="4">
        Novo cadastro
      </Heading>
      {usuario !== undefined && (
        <FormularioDeUsuario
          perfisPermitidos={PERFIS_QUE_PODE_CADASTRAR[usuario.perfil]}
          enviando={isPending}
          erro={error === null ? undefined : mensagemDeErro(error)}
          aoEnviar={(dados) => {
            mutate(dados as CriarUsuarioEntrada, {
              onSuccess: () => {
                roteador.push('/usuarios')
              },
            })
          }}
        />
      )}
    </RotaDePerfil>
  )
}

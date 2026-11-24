'use client'

import { Heading } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { RotaDePerfil } from '@/components/ui/RotaDePerfil.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { FormularioComOpcoes } from '@/features/avaliacoes/components/FormularioComOpcoes.tsx'
import { useCriarAvaliacao } from '@/features/avaliacoes/hooks/useAvaliacoes.ts'
import { mensagemDeErro } from '@/lib/http-client.ts'

export default function PaginaDeNovaAvaliacao() {
  const { usuario } = useSessao()
  const roteador = useRouter()
  const { mutate, isPending, error } = useCriarAvaliacao()

  return (
    <RotaDePerfil perfis={['ADMINISTRADOR', 'PROFESSOR']}>
      <Heading size="lg" mb="4">
        Nova avaliação
      </Heading>
      {usuario !== undefined && (
        <FormularioComOpcoes
          perfilDoAtor={usuario.perfil}
          enviando={isPending}
          erro={error === null ? undefined : mensagemDeErro(error)}
          aoEnviar={(dados) => {
            mutate(dados, {
              onSuccess: () => {
                roteador.push('/avaliacoes')
              },
            })
          }}
        />
      )}
    </RotaDePerfil>
  )
}

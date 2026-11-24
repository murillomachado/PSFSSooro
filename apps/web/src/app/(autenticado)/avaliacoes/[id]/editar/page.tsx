'use client'

import { Heading } from '@chakra-ui/react'
import { useParams, useRouter } from 'next/navigation'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { RotaDePerfil } from '@/components/ui/RotaDePerfil.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { FormularioComOpcoes } from '@/features/avaliacoes/components/FormularioComOpcoes.tsx'
import { useAvaliacao, useEditarAvaliacao } from '@/features/avaliacoes/hooks/useAvaliacoes.ts'
import { mensagemDeErro } from '@/lib/http-client.ts'

export default function PaginaDeEdicaoDeAvaliacao() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useSessao()
  const roteador = useRouter()
  const alvo = useAvaliacao(id)
  const edicao = useEditarAvaliacao(id)

  return (
    <RotaDePerfil perfis={['ADMINISTRADOR', 'PROFESSOR']}>
      <Heading size="lg" mb="4">
        Editar avaliação
      </Heading>
      {alvo.isError && <MensagemDeErro mensagem={mensagemDeErro(alvo.error)} />}
      {alvo.isPending && <Carregando />}
      {alvo.data !== undefined && usuario !== undefined && (
        <FormularioComOpcoes
          avaliacao={alvo.data}
          perfilDoAtor={usuario.perfil}
          enviando={edicao.isPending}
          erro={edicao.error === null ? undefined : mensagemDeErro(edicao.error)}
          aoEnviar={(dados) => {
            edicao.mutate(dados, {
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

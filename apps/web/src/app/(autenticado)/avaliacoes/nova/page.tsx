'use client'

import { useRouter } from 'next/navigation'
import { avisarSucesso } from '@/components/ui/Avisos.tsx'
import { PainelDeFormulario } from '@/components/ui/PainelDeFormulario.tsx'
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
      <PainelDeFormulario
        titulo="Nova avaliação"
        descricao="Informe altura e peso: o IMC e a classificação são calculados na hora."
        voltarPara="/avaliacoes"
      >
        {usuario !== undefined && (
          <FormularioComOpcoes
            perfilDoAtor={usuario.perfil}
            enviando={isPending}
            erro={error === null ? undefined : mensagemDeErro(error)}
            aoEnviar={(dados) => {
              mutate(dados, {
                onSuccess: () => {
                  avisarSucesso('Avaliação registrada')
                  roteador.push('/avaliacoes')
                },
              })
            }}
          />
        )}
      </PainelDeFormulario>
    </RotaDePerfil>
  )
}

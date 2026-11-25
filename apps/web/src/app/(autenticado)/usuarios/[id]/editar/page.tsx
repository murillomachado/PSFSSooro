'use client'

import { useParams, useRouter } from 'next/navigation'
import { Carregando } from '@/components/ui/Carregando.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { avisarSucesso } from '@/components/ui/Avisos.tsx'
import { PainelDeFormulario } from '@/components/ui/PainelDeFormulario.tsx'
import { RotaDePerfil } from '@/components/ui/RotaDePerfil.tsx'
import { useSessao } from '@/features/auth/hooks/useSessao.ts'
import { FormularioDeUsuarioComOpcoes } from '@/features/usuarios/components/FormularioDeUsuarioComOpcoes.tsx'
import { useEditarUsuario, useUsuario } from '@/features/usuarios/hooks/useUsuarios.ts'
import { PERFIS_QUE_PODE_CADASTRAR } from '@/features/usuarios/perfis.ts'
import { mensagemDeErro } from '@/lib/http-client.ts'

export default function PaginaDeEdicaoDeUsuario() {
  const { id } = useParams<{ id: string }>()
  const { usuario: ator } = useSessao()
  const roteador = useRouter()
  const alvo = useUsuario(id)
  const edicao = useEditarUsuario(id)

  return (
    <RotaDePerfil perfis={['ADMINISTRADOR', 'PROFESSOR']}>
      <PainelDeFormulario titulo="Editar cadastro" descricao="Corrija os dados do usuário." voltarPara="/usuarios">
        {alvo.isError && <MensagemDeErro mensagem={mensagemDeErro(alvo.error)} />}
        {alvo.isPending && <Carregando />}
        {alvo.data !== undefined && ator !== undefined && (
          <FormularioDeUsuarioComOpcoes
            ehAdmin={ator.perfil === 'ADMINISTRADOR'}
            usuario={alvo.data}
            perfisPermitidos={PERFIS_QUE_PODE_CADASTRAR[ator.perfil]}
            enviando={edicao.isPending}
            erro={edicao.error === null ? undefined : mensagemDeErro(edicao.error)}
            aoEnviar={(dados) => {
              edicao.mutate(dados, {
                onSuccess: () => {
                  avisarSucesso('Cadastro atualizado')
                  roteador.push('/usuarios')
                },
              })
            }}
          />
        )}
      </PainelDeFormulario>
    </RotaDePerfil>
  )
}

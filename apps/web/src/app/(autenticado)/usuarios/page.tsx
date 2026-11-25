import { Precarregado } from '@/components/ui/Precarregado.tsx'
import { sessaoNoServidor } from '@/features/auth/servidor.ts'
import { PRIMEIRA_PAGINA } from '@/features/usuarios/chaves.ts'
import { TelaDeUsuarios } from '@/features/usuarios/components/TelaDeUsuarios.tsx'
import { precarregarEscolha, precarregarUsuarios } from '@/features/usuarios/precarregar.ts'
import { clienteDaRequisicao } from '@/lib/servidor.ts'

export default async function PaginaDeUsuarios() {
  const [usuario, cliente] = await Promise.all([sessaoNoServidor(), clienteDaRequisicao()])
  return (
    <Precarregado
      preparar={async (consultas) => {
        // A lista e, para o administrador, os professores da coluna e do filtro de responsável.
        await Promise.all([
          precarregarUsuarios(consultas, cliente, PRIMEIRA_PAGINA),
          usuario?.perfil === 'ADMINISTRADOR' ? precarregarEscolha(consultas, cliente, 'PROFESSOR') : undefined,
        ])
      }}
    >
      <TelaDeUsuarios />
    </Precarregado>
  )
}

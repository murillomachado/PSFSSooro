import { Precarregado } from '@/components/ui/Precarregado.tsx'
import { sessaoNoServidor } from '@/features/auth/servidor.ts'
import { TelaInicial } from '@/features/inicio/components/TelaInicial.tsx'
import { precarregarInicio } from '@/features/inicio/precarregar.ts'
import { clienteDaRequisicao } from '@/lib/servidor.ts'

export default async function PaginaInicial() {
  const [usuario, cliente] = await Promise.all([sessaoNoServidor(), clienteDaRequisicao()])
  return (
    <Precarregado
      preparar={async (consultas) => {
        if (usuario !== undefined) await precarregarInicio(consultas, cliente, usuario)
      }}
    >
      <TelaInicial />
    </Precarregado>
  )
}

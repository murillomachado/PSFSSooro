import { Precarregado } from '@/components/ui/Precarregado.tsx'
import { PRIMEIRA_PAGINA } from '@/features/usuarios/chaves.ts'
import { TelaDeUsuarios } from '@/features/usuarios/components/TelaDeUsuarios.tsx'
import { precarregarUsuarios } from '@/features/usuarios/precarregar.ts'
import { clienteDaRequisicao } from '@/lib/servidor.ts'

export default async function PaginaDeUsuarios() {
  const cliente = await clienteDaRequisicao()
  return (
    <Precarregado preparar={(consultas) => precarregarUsuarios(consultas, cliente, PRIMEIRA_PAGINA)}>
      <TelaDeUsuarios />
    </Precarregado>
  )
}

import { Precarregado } from '@/components/ui/Precarregado.tsx'
import { sessaoNoServidor } from '@/features/auth/servidor.ts'
import { PRIMEIRA_PAGINA } from '@/features/avaliacoes/chaves.ts'
import { TelaDeAvaliacoes } from '@/features/avaliacoes/components/TelaDeAvaliacoes.tsx'
import { precarregarAvaliacoes, precarregarEvolucao } from '@/features/avaliacoes/precarregar.ts'
import { precarregarEscolha } from '@/features/usuarios/precarregar.ts'
import { clienteDaRequisicao } from '@/lib/servidor.ts'

export default async function PaginaDeAvaliacoes() {
  const [usuario, cliente] = await Promise.all([sessaoNoServidor(), clienteDaRequisicao()])
  return (
    <Precarregado
      preparar={async (consultas) => {
        if (usuario === undefined) return
        // O que a lista pede ao abrir: a primeira página e, conforme o perfil, o gráfico ou os filtros.
        await Promise.all([
          precarregarAvaliacoes(consultas, cliente, PRIMEIRA_PAGINA),
          usuario.perfil === 'ALUNO'
            ? precarregarEvolucao(consultas, cliente, usuario.id)
            : precarregarEscolha(consultas, cliente, 'ALUNO'),
          usuario.perfil === 'ADMINISTRADOR' ? precarregarEscolha(consultas, cliente, 'PROFESSOR') : undefined,
        ])
      }}
    >
      <TelaDeAvaliacoes />
    </Precarregado>
  )
}

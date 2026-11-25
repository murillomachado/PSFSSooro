'use client'

import {
  type CriarUsuarioEntrada,
  criarUsuarioSchema,
  type EditarUsuarioEntrada,
  editarUsuarioSchema,
  type Perfil,
  type UsuarioResposta,
} from '@psfssooro/contracts'
import { Button, Stack } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Resolver, useForm, useWatch } from 'react-hook-form'
import { CampoDeSelecao, type Opcao } from '@/components/ui/CampoDeSelecao.tsx'
import { CampoDeTexto } from '@/components/ui/CampoDeTexto.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { OPCOES_DE_PERFIL } from '../perfis.ts'

interface Valores {
  nome: string
  usuario: string
  senha?: string
  perfil: Perfil
  professorId?: string
}

interface FormularioDeUsuarioProps {
  /** Com usuário, o formulário edita; sem, cadastra. É o mesmo formulário nos dois casos. */
  readonly usuario?: UsuarioResposta
  readonly perfisPermitidos: readonly Perfil[]
  /**
   * Os professores que podem ser o responsável por um aluno (RN6). Só o administrador escolhe: para o
   * professor, a lista não vem, e o responsável é ele mesmo (a API define).
   */
  readonly professores?: readonly Opcao[]
  readonly enviando: boolean
  readonly erro: string | undefined
  readonly aoEnviar: (dados: CriarUsuarioEntrada | EditarUsuarioEntrada) => void
}

const MENSAGEM_DO_RESPONSAVEL = 'Escolha o professor responsável'

/**
 * Na edição, senha em branco significa "manter a atual". O responsável só vale para alunos e, quando o
 * administrador escolhe, é obrigatório: o formulário avisa antes de a API recusar.
 */
function resolverDoFormulario(edicao: boolean, escolheResponsavel: boolean): Resolver<Valores> {
  const schema = (edicao ? editarUsuarioSchema : criarUsuarioSchema).superRefine((valores, contexto) => {
    if (escolheResponsavel && valores.perfil === 'ALUNO' && valores.professorId === undefined) {
      contexto.addIssue({ code: 'custom', path: ['professorId'], message: MENSAGEM_DO_RESPONSAVEL })
    }
  })
  const validar = zodResolver(schema) as Resolver<Valores>
  return (valores, contexto, opcoes) => validar(paraEnvio(valores, edicao, escolheResponsavel), contexto, opcoes)
}

/** O que vai para a API: sem senha em branco na edição, e com o responsável só quando ele se aplica. */
function paraEnvio(valores: Valores, edicao: boolean, escolheResponsavel: boolean): Valores {
  const { senha, professorId, ...resto } = valores
  const comResponsavel = escolheResponsavel && valores.perfil === 'ALUNO' && professorId !== ''
  return {
    ...resto,
    ...(edicao && senha === '' ? {} : { senha }),
    ...(comResponsavel ? { professorId } : {}),
  }
}

export function FormularioDeUsuario({
  usuario,
  perfisPermitidos,
  professores,
  enviando,
  erro,
  aoEnviar,
}: Readonly<FormularioDeUsuarioProps>) {
  const edicao = usuario !== undefined
  const escolheResponsavel = professores !== undefined
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Valores>({
    resolver: resolverDoFormulario(edicao, escolheResponsavel),
    defaultValues: {
      nome: usuario?.nome ?? '',
      usuario: usuario?.usuario ?? '',
      senha: '',
      perfil: usuario?.perfil ?? perfisPermitidos[0],
      professorId: usuario?.professorId ?? '',
    },
  })
  const perfil = useWatch({ control, name: 'perfil' })
  const opcoesDePerfil = OPCOES_DE_PERFIL.filter((opcao) => perfisPermitidos.some((p) => p === opcao.valor))

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        void handleSubmit((valores) => {
          aoEnviar(paraEnvio(valores, edicao, escolheResponsavel))
        })(evento)
      }}
    >
      <Stack gap="4">
        {erro !== undefined && <MensagemDeErro mensagem={erro} />}
        <CampoDeTexto rotulo="Nome" erro={errors.nome?.message} {...register('nome')} />
        <CampoDeTexto
          rotulo="Usuário (login)"
          autoComplete="off"
          erro={errors.usuario?.message}
          {...register('usuario')}
        />
        <CampoDeTexto
          rotulo={edicao ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
          type="password"
          autoComplete="new-password"
          erro={errors.senha?.message}
          {...register('senha')}
        />
        {perfisPermitidos.length > 1 && (
          <CampoDeSelecao
            rotulo="Perfil"
            opcoes={opcoesDePerfil}
            erro={errors.perfil?.message}
            {...register('perfil')}
          />
        )}
        {escolheResponsavel && perfil === 'ALUNO' && (
          <CampoDeSelecao
            rotulo="Professor responsável"
            opcoes={[{ valor: '', texto: 'Selecione…' }, ...professores]}
            erro={errors.professorId?.message}
            {...register('professorId')}
          />
        )}
        <Button type="submit" loading={enviando} alignSelf={{ sm: 'flex-end' }}>
          {edicao ? 'Salvar alterações' : 'Cadastrar'}
        </Button>
      </Stack>
    </form>
  )
}

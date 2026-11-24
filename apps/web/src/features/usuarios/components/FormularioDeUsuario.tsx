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
import { type Resolver, useForm } from 'react-hook-form'
import { CampoDeSelecao } from '@/components/ui/CampoDeSelecao.tsx'
import { CampoDeTexto } from '@/components/ui/CampoDeTexto.tsx'
import { MensagemDeErro } from '@/components/ui/MensagemDeErro.tsx'
import { OPCOES_DE_PERFIL } from '../perfis.ts'

interface Valores {
  nome: string
  usuario: string
  senha?: string
  perfil: Perfil
}

interface FormularioDeUsuarioProps {
  /** Com usuário, o formulário edita; sem, cadastra. É o mesmo formulário nos dois casos. */
  readonly usuario?: UsuarioResposta
  readonly perfisPermitidos: readonly Perfil[]
  readonly enviando: boolean
  readonly erro: string | undefined
  readonly aoEnviar: (dados: CriarUsuarioEntrada | EditarUsuarioEntrada) => void
}

/** Na edição, senha em branco significa "manter a atual": o campo some do que vai para a API. */
function resolverDoFormulario(edicao: boolean): Resolver<Valores> {
  const validar = zodResolver(edicao ? editarUsuarioSchema : criarUsuarioSchema) as Resolver<Valores>
  return (valores, contexto, opcoes) =>
    validar({ ...valores, senha: edicao && valores.senha === '' ? undefined : valores.senha }, contexto, opcoes)
}

export function FormularioDeUsuario({
  usuario,
  perfisPermitidos,
  enviando,
  erro,
  aoEnviar,
}: Readonly<FormularioDeUsuarioProps>) {
  const edicao = usuario !== undefined
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({
    resolver: resolverDoFormulario(edicao),
    defaultValues: {
      nome: usuario?.nome ?? '',
      usuario: usuario?.usuario ?? '',
      senha: '',
      perfil: usuario?.perfil ?? perfisPermitidos[0],
    },
  })
  const opcoesDePerfil = OPCOES_DE_PERFIL.filter((opcao) => perfisPermitidos.some((perfil) => perfil === opcao.valor))

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        void handleSubmit(({ senha, ...resto }) => {
          aoEnviar(senha === '' ? resto : { ...resto, senha })
        })(evento)
      }}
    >
      <Stack gap="4" maxW="md">
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
        <Button type="submit" loading={enviando}>
          {edicao ? 'Salvar alterações' : 'Cadastrar'}
        </Button>
      </Stack>
    </form>
  )
}

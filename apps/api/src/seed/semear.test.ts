import { describe, expect, it } from 'vitest'
import { MemoriaAvaliacaoRepository } from '../modules/avaliacoes/infra/memoria-avaliacao.repository.ts'
import { hasherFalso, relogioFixo, repositorioCom } from '../modules/usuarios/testes/apoio.ts'
import { SENHA_DEMO, USUARIOS_DEMO, semear } from './semear.ts'

describe('semear', () => {
  const montar = async () => {
    const usuarios = await repositorioCom()
    let proximoId = 0
    const avaliacoes = new MemoriaAvaliacaoRepository()
    const dependencias = {
      usuarios,
      avaliacoes,
      hasher: hasherFalso,
      relogio: relogioFixo(),
      gerarId: () => `id-${++proximoId}`,
    }
    return { usuarios, avaliacoes, dependencias }
  }

  it('cria um usuário de cada perfil, mais um inativo, todos com a senha de demonstração', async () => {
    const { usuarios, dependencias } = await montar()
    expect(await semear(dependencias)).toBe(USUARIOS_DEMO.length)
    const pagina = await usuarios.listar({ perfis: ['ADMINISTRADOR', 'PROFESSOR', 'ALUNO'], pagina: 1, limite: 50 })
    expect(pagina.itens.map((usuario) => usuario.perfil).toSorted((a, b) => a.localeCompare(b))).toEqual([
      'ADMINISTRADOR',
      'ALUNO',
      'ALUNO',
      'ALUNO',
      'ALUNO',
      'ALUNO',
      'ALUNO',
      'PROFESSOR',
      'PROFESSOR',
    ])
    expect(pagina.itens.filter((usuario) => !usuario.ativo).map((usuario) => usuario.usuario)).toEqual(['ryan.howard'])
    expect(pagina.itens.every((usuario) => usuario.senhaHash === `hash(${SENHA_DEMO})`)).toBe(true)
  })

  it('cada aluno tem um professor responsável, com alunos para os dois professores (RN6)', async () => {
    const { usuarios, dependencias } = await montar()
    await semear(dependencias)
    const alunosDe = async (professor: string) => {
      const id = (await usuarios.buscarPorUsuario(professor))?.id ?? ''
      const pagina = await usuarios.listar({ perfis: ['ALUNO'], professorId: id, pagina: 1, limite: 50 })
      return pagina.itens.map((aluno) => aluno.usuario)
    }
    expect(await alunosDe('dwight.schrute')).toEqual(['andy.bernard', 'angela.martin', 'kevin.malone'])
    expect(await alunosDe('jim.halpert')).toEqual(['pam.beesly', 'ryan.howard', 'stanley.hudson'])
  })

  it('num banco semeado antes do vínculo, só preenche o professor responsável que faltava', async () => {
    const { usuarios, dependencias } = await montar()
    await semear(dependencias)
    const pam = await usuarios.buscarPorUsuario('pam.beesly')
    if (pam === undefined) throw new Error('a semente não criou a aluna')
    await usuarios.salvar({ ...pam, professorId: undefined })
    expect(await semear(dependencias)).toBe(0)
    const jim = await usuarios.buscarPorUsuario('jim.halpert')
    expect(await usuarios.buscarPorUsuario('pam.beesly')).toEqual({ ...pam, professorId: jim?.id })
  })

  it('pode rodar mais de uma vez sem duplicar nem sobrescrever', async () => {
    const { usuarios, dependencias } = await montar()
    await semear(dependencias)
    const admin = await usuarios.buscarPorUsuario('michael.scott')
    expect(await semear(dependencias)).toBe(0)
    expect(await usuarios.buscarPorUsuario('michael.scott')).toEqual(admin)
  })

  it('cria avaliações de demonstração só uma vez, para o aluno ver o histórico e os professores filtrarem', async () => {
    const { avaliacoes, dependencias } = await montar()
    await semear(dependencias)
    const primeira = await avaliacoes.listar({ pagina: 1, limite: 50 })
    expect(primeira.total).toBe(30)
    expect(new Set(primeira.itens.map((a) => a.classificacao))).toEqual(
      new Set(['ABAIXO_DO_PESO', 'PESO_NORMAL', 'SOBREPESO', 'OBESIDADE_I', 'OBESIDADE_II']),
    )
    await semear(dependencias)
    expect((await avaliacoes.listar({ pagina: 1, limite: 50 })).total).toBe(30)
  })
})

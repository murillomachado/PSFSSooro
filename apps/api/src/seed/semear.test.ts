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

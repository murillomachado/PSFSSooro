import { randomUUID } from 'node:crypto'
import { carregarEnv } from '../config/env.ts'
import { TypeOrmUsuarioRepository } from '../modules/usuarios/infra/typeorm-usuario.repository.ts'
import { semear } from '../seed/semear.ts'
import { criarBanco } from '../shared/database/data-source.ts'
import { HasherScrypt } from '../shared/security/hasher-scrypt.ts'
import { relogioDoSistema } from '../shared/security/relogio.ts'

const banco = criarBanco(carregarEnv().caminhoDoBanco)
await banco.initialize()
const criados = await semear({
  usuarios: new TypeOrmUsuarioRepository(banco),
  hasher: new HasherScrypt(),
  relogio: relogioDoSistema,
  gerarId: randomUUID,
})
console.log(criados === 0 ? 'Os usuários de demonstração já existem.' : `Usuários de demonstração criados: ${criados}.`)
await banco.destroy()

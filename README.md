# PSFSSooro

Sistema web para uma academia acompanhar a evolução do IMC dos alunos, com três perfis de acesso: administrador, professor e aluno. Alunos e professores são cadastrados, os professores registram avaliações de IMC e as avaliações podem ser consultadas para acompanhar a evolução.

Monorepo pnpm: `apps/api` (Express 5, TypeORM 1, SQLite), `apps/web` (Next.js 16, Chakra UI 3) e `packages/contracts` (schemas zod compartilhados pelos dois).

> **Em construção.** A tabela de requisitos mostra o que já funciona. Ela é atualizada em cada PR.

## Como executar

Requisitos: **Node.js 26.13.1** (o `.nvmrc`; com nvm ou fnm basta entrar na pasta) e **pnpm 12.23.0** (`npm i -g pnpm@12.23.0`, porque o Node 26 não traz mais o Corepack).

```bash
pnpm install                                  # dependências, hooks do Git e build do pacote contracts
cp apps/api/.env.example apps/api/.env        # variáveis de ambiente da API (já funcionam como estão)
pnpm --filter @psfssooro/api db:migrate       # cria o banco SQLite com as migrations
pnpm --filter @psfssooro/api db:seed          # cria os usuários de demonstração (pode rodar de novo)
pnpm --filter @psfssooro/api dev              # API em http://localhost:3333
```

Em outro terminal, a Web (abre em http://localhost:3000 e fala com a API em `NEXT_PUBLIC_API_URL`, por padrão `http://localhost:3333/api`):

```bash
pnpm --filter @psfssooro/web dev
```

O Docker entra aqui na próxima etapa. Para rodar todos os gates de qualidade: `pnpm verify`.

### Usuários de demonstração

Todos com a senha `senha1234`.

| Usuário                    | Perfil        | Situação                       |
| -------------------------- | ------------- | ------------------------------ |
| `admin`                    | Administrador | ativo                          |
| `prof.paulo`, `prof.carla` | Professor     | ativo                          |
| `aluno.ana`, `aluno.bruno` | Aluno         | ativo                          |
| `aluno.inativo`            | Aluno         | **inativo**, para testar a RN8 |

## Como testar os requisitos

Situação: ✅ funcionando · 🔶 parcial · ⏳ pendente. "✅ API" quer dizer que a API já cumpre o requisito e a tela chega nas próximas etapas. Enquanto isso, a coluna "Como ver" aponta para os passos de [Testando a API](#testando-a-api).

### Requisitos funcionais

| Código | O que a especificação pede                                         | Como ver                                                                                                                               | Situação |
| ------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| RF1    | Cadastrar usuários com perfil administrador, aluno ou professor    | Entre como `admin`, abra **Usuários** > **Novo cadastro** e crie os três perfis; **Editar** usa o mesmo formulário                     | ✅       |
| RF2    | Ativar ou inativar um usuário                                      | Como `admin`, em **Usuários**, **Inativar** / **Ativar** muda a situação na hora                                                       | ✅       |
| RF3    | Cadastrar avaliações de IMC, calculadas a partir de altura e peso  | Passo 7: o professor registra uma avaliação; altura e peso viram IMC                                                                   | ✅ API   |
| RF4    | Gravar a classificação do IMC conforme a tabela                    | Passo 7: a resposta traz a classificação (código e descrição)                                                                          | ✅ API   |
| RF5    | Consultar as avaliações, com filtro por aluno ou por professor     | Passo 8: lista com filtro por aluno, professor e período                                                                               | ✅ API   |
| RF6    | Autenticar com usuário e senha (administrador, professor ou aluno) | Na tela de login (http://localhost:3000), entre como `admin`, `prof.paulo` ou `aluno.ana`; senha errada mostra o erro. Na API: passo 1 | ✅       |

### Regras de negócio

| Código | O que a especificação pede                                                                    | Como ver                                                                                                                      | Situação |
| ------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| RN1    | Administrador cadastra, edita e exclui usuários de qualquer perfil (exclui só sem avaliações) | Como `admin`: cadastra, edita e **Excluir** (com confirmação). Excluir quem tem avaliações (ex.: `aluno.ana`) mostra o motivo | ✅       |
| RN2    | Administrador cadastra, edita e exclui avaliações                                             | Passo 9: o administrador edita e exclui qualquer avaliação                                                                    | ✅ API   |
| RN3    | Administrador consulta as avaliações de qualquer aluno                                        | Passo 8: o administrador lista as avaliações de qualquer aluno                                                                | ✅ API   |
| RN4    | Professor cadastra e edita alunos                                                             | Como `prof.paulo`, o menu é **Alunos**: lista só alunos e cadastra/edita aluno, sem escolher perfil nem inativar/excluir      | ✅       |
| RN5    | Professor cadastra e edita avaliações                                                         | Passos 7 e 9: o professor registra e edita as suas (403 nas dos colegas)                                                      | ✅ API   |
| RN6    | Professor consulta as avaliações de seus alunos                                               | Passo 8: o professor lista as avaliações dos alunos                                                                           | ✅ API   |
| RN7    | Aluno consulta apenas as próprias avaliações                                                  | Passo 8: como `aluno.ana`, só aparecem as dela                                                                                | ✅ API   |
| RN8    | Usuário inativo não acessa o sistema                                                          | Passo 5: o usuário inativado perde o acesso na hora. `aluno.inativo` recebe 403                                               | ✅ API   |
| RN9    | Usuário inativo não pode ter novas avaliações                                                 | Passo 7: avaliar `aluno.inativo` devolve 422                                                                                  | ✅ API   |

### Exigências técnicas

| Exigência                                                                                      | Onde está                                                         | Situação |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| Monorepo no GitHub, Conventional Commits                                                       | este repositório; commitlint no commit e no CI                    | ✅       |
| Versões fixas (sem `^` nem `~`), Node em `engines` e `.nvmrc`, pnpm em `packageManager`        | `pnpm check-versions`, também no CI                               | ✅       |
| TypeScript 6 com `strict: true`                                                                | `tsconfig.base.json`                                              | ✅       |
| Back-end: Express, TypeORM com migrations, SQLite, JWT, validação com zod, erros centralizados | `apps/api`: `src/shared/database`, `src/shared/http`, `contracts` | ✅       |
| Back-end em camadas, SOLID, middlewares de autenticação e autorização, `.env.example`          | módulos `auth`, `usuarios` e `avaliacoes`                         | 🔶       |
| Front-end: Next (App Router), Chakra, TanStack Query, React Hook Form, Axios, sem `any`        | `apps/web`: Next, Chakra, TanStack Query, React Hook Form, Axios  | 🔶       |
| Componentes reutilizáveis, mesmo formulário para cadastro e edição, estados de carregamento    | `apps/web`                                                        | ⏳       |
| Testes e Docker (diferenciais)                                                                 | testes em cada PR (`pnpm test`); Docker a seguir                  | 🔶       |

## Testando a API

Enquanto a tela não chega, estes passos exercitam os requisitos com `curl`, em um terminal bash (Linux, macOS, WSL ou Git Bash). Com a API no ar (veja [Como executar](#como-executar)):

```bash
API=http://localhost:3333/api
JSON='Content-Type: application/json'
pegar_token() { curl -s -X POST $API/auth/login -H "$JSON" -d "{\"usuario\":\"$1\",\"senha\":\"senha1234\"}" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).token"; }

# 1. Entrar (RF6)
TOKEN=$(pegar_token admin)

# 2. Listar os usuários (só administrador e professor)
curl -s $API/usuarios -H "Authorization: Bearer $TOKEN"

# 3. Cadastrar (RF1): um professor, e o id vem na resposta
curl -s -X POST $API/usuarios -H "Authorization: Bearer $TOKEN" -H "$JSON" \
  -d '{"nome":"Marta Lopes","usuario":"prof.marta","senha":"senha1234","perfil":"PROFESSOR"}'

# 4. Editar (RF1): troque ID pelo id da resposta anterior
curl -s -X PUT $API/usuarios/ID -H "Authorization: Bearer $TOKEN" -H "$JSON" -d '{"nome":"Marta Lopes Silva"}'

# 5. Inativar (RF2) e ver que a pessoa perde o acesso (RN8); {"ativo":true} reativa
curl -s -X PATCH $API/usuarios/ID/situacao -H "Authorization: Bearer $TOKEN" -H "$JSON" -d '{"ativo":false}'
curl -s -i -X POST $API/auth/login -H "$JSON" -d '{"usuario":"prof.marta","senha":"senha1234"}'   # 403

# 6. Professor (RN4): só vê alunos, cadastra aluno, mas não cadastra professor
PROF=$(pegar_token prof.paulo)
curl -s $API/usuarios -H "Authorization: Bearer $PROF"
curl -s -i -X POST $API/usuarios -H "Authorization: Bearer $PROF" -H "$JSON" \
  -d '{"nome":"Outro Prof","usuario":"prof.outro","senha":"senha1234","perfil":"PROFESSOR"}'     # 403

# 7. Registrar uma avaliação (RF3, RF4, RN5, RN9): o professor é o avaliador; o IMC vem calculado
ANA=$(curl -s "$API/usuarios?busca=ana" -H "Authorization: Bearer $PROF" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).itens[0].id")
curl -s -X POST $API/avaliacoes -H "Authorization: Bearer $PROF" -H "$JSON" \
  -d "{\"alunoId\":\"$ANA\",\"dataAvaliacao\":\"2026-11-20\",\"alturaM\":1.75,\"pesoKg\":72}"   # imc 23.5, PESO_NORMAL

# 8. Consultar (RF5, RN3, RN6, RN7): filtros alunoId, professorId, de e ate; o aluno só vê as próprias
curl -s "$API/avaliacoes?alunoId=$ANA&de=2026-09-01" -H "Authorization: Bearer $TOKEN"
curl -s $API/avaliacoes -H "Authorization: Bearer $(pegar_token aluno.ana)"

# 9. Editar e excluir (RN2, RN5): troque AV pelo id de uma avaliação; o IMC é recalculado
curl -s -X PUT $API/avaliacoes/AV -H "Authorization: Bearer $PROF" -H "$JSON" -d '{"pesoKg":90}'
curl -s -i -X DELETE $API/avaliacoes/AV -H "Authorization: Bearer $TOKEN"                              # 204; professor leva 403

# 10. Excluir usuário (RN1): só sem avaliações
curl -s -i -X DELETE $API/usuarios/$ANA -H "Authorization: Bearer $TOKEN"                              # 409: tem avaliações
```

Todo erro volta no formato `application/problem+json` (RFC 9457), com `status`, `codigo` e, nos erros de validação, a lista de `campos`.

## Decisões

Onde a especificação deixa margem, a interpretação adotada está em [docs/decisoes.md](docs/decisoes.md).

## Qualidade

`pnpm verify` roda os mesmos gates do CI: versões fixas, tipos, lint, formatação, duplicação (até 2%), testes com cobertura (80% de linhas, funções e statements; 70% de branches) e build. No lint: complexidade cognitiva até 15, função até 50 linhas úteis (componente até 150), até 4 parâmetros, arquivo até 250 linhas, nenhum `any` e fronteiras entre camadas e entre apps. O CI roda em toda PR, e o check `quality-gates-ok` precisa estar verde para o merge.

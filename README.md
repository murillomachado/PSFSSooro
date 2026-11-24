# SooroFit

**SooroFit**: sistema web para uma academia acompanhar a evolução do IMC dos alunos, com três perfis de acesso: administrador, professor e aluno. Alunos e professores são cadastrados, os professores registram avaliações de IMC e as avaliações podem ser consultadas para acompanhar a evolução. A interface é responsiva (no celular, as listas viram cartões) e tem tema claro e escuro, no botão da barra superior.

Monorepo pnpm: `apps/api` (Express 5, TypeORM 1, SQLite), `apps/web` (Next.js 16, Chakra UI 3), `apps/e2e` (testes de ponta a ponta com Playwright) e `packages/contracts` (schemas zod compartilhados pela API e pela Web).

## Como executar

### Com Docker (o caminho mais curto)

Com o Docker instalado (Docker Desktop, ou Docker Engine com o Compose v2) e as portas 3000 e 3333 livres, uma linha sobe a API, a Web e o banco, já com as migrations aplicadas e os usuários de demonstração:

```bash
docker compose up --build
```

O primeiro build leva de um a dois minutos. Quando as linhas de `web-1` mostrarem `Ready`, abra **http://localhost:3000** e entre com um dos [usuários de demonstração](#usuários-de-demonstração) (a API fica em http://localhost:3333). O banco fica no volume `banco` e sobrevive a reinícios; `docker compose down -v` para tudo e apaga o banco. O `JWT_SECRET` do compose é de demonstração.

### Sem Docker

Requisitos: **Node.js 26.13.1** (o `.nvmrc`; com nvm ou fnm basta entrar na pasta) e **pnpm 12.23.0** (`npm i -g pnpm@12.23.0`, porque o Node 26 não traz mais o Corepack).

```bash
pnpm install                                  # dependências, hooks do Git e build do pacote contracts
cp apps/api/.env.example apps/api/.env        # variáveis de ambiente da API (já funcionam como estão)
pnpm --filter @psfssooro/api db:migrate       # cria o banco SQLite com as migrations
pnpm --filter @psfssooro/api db:seed          # cria os usuários de demonstração (pode rodar de novo)
pnpm --filter @psfssooro/api dev              # API em http://localhost:3333
```

Em outro terminal, na mesma pasta, a Web, que abre em http://localhost:3000. Ela fala com a API em `NEXT_PUBLIC_API_URL`, que já vale `http://localhost:3333/api` sem configuração; para mudar, copie `apps/web/.env.example` para `apps/web/.env.local`:

```bash
pnpm --filter @psfssooro/web dev
```

Abra **http://localhost:3000** e entre com um dos usuários abaixo.

Para rodar todos os gates de qualidade: `pnpm verify`. Os testes de ponta a ponta (sobem a API e a Web sozinhos, com um banco novo) rodam com `pnpm test:e2e`, com as portas 3000 e 3333 livres (pare antes o Docker ou os servidores de `dev`); na primeira vez, instale o navegador: `pnpm --filter @psfssooro/e2e exec playwright install chromium`.

### Usuários de demonstração

Todos com a senha `senha1234`. O menu muda conforme o perfil: o administrador vê **Usuários** e **Avaliações**; o professor, **Alunos** e **Avaliações**; o aluno, **Minhas avaliações**.

| Usuário                                                                         | Perfil        | Situação                                                    |
| ------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------- |
| `michael.scott`                                                                 | Administrador | ativo                                                       |
| `dwight.schrute`, `jim.halpert`                                                 | Professor     | ativo                                                       |
| `pam.beesly`, `kevin.malone`, `stanley.hudson`, `andy.bernard`, `angela.martin` | Aluno         | ativo, com seis avaliações mensais (maio a outubro de 2026) |
| `ryan.howard`                                                                   | Aluno         | **inativo**, para testar a RN8                              |

## Como testar os requisitos

Situação: ✅ funcionando. Todos os requisitos funcionam na tela e na API. A coluna "Como ver" diz o caminho na tela; os passos de [Testando a API](#testando-a-api) mostram o mesmo pela API.

### Requisitos funcionais

| Código | O que a especificação pede                                         | Como ver                                                                                                                                            | Situação |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| RF1    | Cadastrar usuários com perfil administrador, aluno ou professor    | Entre como `michael.scott`, abra **Usuários** > **Novo cadastro** e crie os três perfis; **Editar** usa o mesmo formulário                          | ✅       |
| RF2    | Ativar ou inativar um usuário                                      | Como `michael.scott`, em **Usuários**, **Inativar** / **Ativar** muda a situação na hora                                                            | ✅       |
| RF3    | Cadastrar avaliações de IMC, calculadas a partir de altura e peso  | Como `dwight.schrute`: **Avaliações** > **Nova avaliação**; informe aluno, data, altura (m) e peso (kg)                                             | ✅       |
| RF4    | Gravar a classificação do IMC conforme a tabela                    | Na lista, a coluna **Classificação** mostra a faixa do IMC (etiqueta colorida) calculada pela API                                                   | ✅       |
| RF5    | Consultar as avaliações, com filtro por aluno ou por professor     | **Avaliações**: filtros por aluno, professor (administrador; o professor tem "somente as minhas") e período                                         | ✅       |
| RF6    | Autenticar com usuário e senha (administrador, professor ou aluno) | Na tela de login (http://localhost:3000), entre como `michael.scott`, `dwight.schrute` ou `pam.beesly`; senha errada mostra o erro. Na API: passo 1 | ✅       |

### Regras de negócio

| Código | O que a especificação pede                                                                    | Como ver                                                                                                                               | Situação |
| ------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| RN1    | Administrador cadastra, edita e exclui usuários de qualquer perfil (exclui só sem avaliações) | Como `michael.scott`: cadastra, edita e **Excluir** (com confirmação). Excluir quem tem avaliações (ex.: `pam.beesly`) mostra o motivo | ✅       |
| RN2    | Administrador cadastra, edita e exclui avaliações                                             | Como `michael.scott`: registra (escolhendo o professor), **Editar** qualquer avaliação e **Excluir** com confirmação                   | ✅       |
| RN3    | Administrador consulta as avaliações de qualquer aluno                                        | Como `michael.scott`, **Avaliações** lista as de todos os alunos; filtre por aluno                                                     | ✅       |
| RN4    | Professor cadastra e edita alunos                                                             | Como `dwight.schrute`, o menu é **Alunos**: lista só alunos e cadastra/edita aluno, sem escolher perfil nem inativar/excluir           | ✅       |
| RN5    | Professor cadastra e edita avaliações                                                         | Como `dwight.schrute`: registra e **Editar** só as próprias; nas de `jim.halpert` não há botão (e a API devolve 403)                   | ✅       |
| RN6    | Professor consulta as avaliações de seus alunos                                               | Como `dwight.schrute`, **Avaliações** lista as avaliações de todos os alunos                                                           | ✅       |
| RN7    | Aluno consulta apenas as próprias avaliações                                                  | Como `pam.beesly`, **Minhas avaliações** mostra só as dela, sem ações                                                                  | ✅       |
| RN8    | Usuário inativo não acessa o sistema                                                          | Na tela de login, `ryan.howard` vê "Este usuário está inativo". Quem é inativado perde o acesso na hora (passo 5 da API: 403)          | ✅       |
| RN9    | Usuário inativo não pode ter novas avaliações                                                 | No formulário só aparecem alunos e professores ativos; `ryan.howard` não pode ser escolhido (a API também recusa, 422)                 | ✅       |

### Exigências técnicas

| Exigência                                                                                      | Onde está                                                                                                                                                                                                                              | Situação |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Monorepo no GitHub, Conventional Commits                                                       | este repositório; commitlint no commit e no CI                                                                                                                                                                                         | ✅       |
| Versões fixas (sem `^` nem `~`), Node em `engines` e `.nvmrc`, pnpm em `packageManager`        | `pnpm check-versions`, também no CI                                                                                                                                                                                                    | ✅       |
| TypeScript 6 com `strict: true`                                                                | `tsconfig.base.json`                                                                                                                                                                                                                   | ✅       |
| Back-end: Express, TypeORM com migrations, SQLite, JWT, validação com zod, erros centralizados | `apps/api`: `src/shared/database`, `src/shared/http`, `contracts`                                                                                                                                                                      | ✅       |
| Back-end em camadas, SOLID, middlewares de autenticação e autorização, `.env.example`          | `apps/api/src/modules/*` (`domain`, `application`, `infra`, `http`), middlewares em `src/shared/http`, `.env.example`                                                                                                                  | ✅       |
| Front-end: Next (App Router), Chakra, TanStack Query, React Hook Form, Axios, sem `any`        | `apps/web`: Next, Chakra, TanStack Query, React Hook Form, Axios                                                                                                                                                                       | ✅       |
| Componentes reutilizáveis, mesmo formulário para cadastro e edição, estados de carregamento    | `apps/web/src/components/ui` (como `TabelaResponsiva`, `BarraDeFiltros` e `PainelDeFormulario`) e `components/layout`; `FormularioDeUsuario` e `FormularioDeAvaliacao` servem a cadastro e edição; `Carregando` e botões com `loading` | ✅       |
| Testes e Docker (diferenciais)                                                                 | `pnpm test` (unidade e integração), `pnpm test:e2e` (Playwright), `docker compose up --build`                                                                                                                                          | ✅       |

## Testando a API

Estes passos exercitam os mesmos requisitos direto na API, com `curl`, em um terminal bash (Linux, macOS, WSL ou Git Bash). Precisam do `curl` e do Node.js (usado só para ler o JSON das respostas). Com a API no ar (veja [Como executar](#como-executar)), rode os comandos na ordem, no mesmo terminal:

```bash
API=http://localhost:3333/api
JSON='Content-Type: application/json'
pegar_token() { curl -s -X POST $API/auth/login -H "$JSON" -d "{\"usuario\":\"$1\",\"senha\":\"senha1234\"}" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).token"; }

# 1. Entrar (RF6)
TOKEN=$(pegar_token michael.scott)

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
PROF=$(pegar_token dwight.schrute)
curl -s $API/usuarios -H "Authorization: Bearer $PROF"
curl -s -i -X POST $API/usuarios -H "Authorization: Bearer $PROF" -H "$JSON" \
  -d '{"nome":"Outro Prof","usuario":"prof.outro","senha":"senha1234","perfil":"PROFESSOR"}'     # 403

# 7. Registrar uma avaliação (RF3, RF4, RN5, RN9): o professor é o avaliador; o IMC vem calculado
PAM=$(curl -s "$API/usuarios?busca=pam" -H "Authorization: Bearer $PROF" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).itens[0].id")
curl -s -X POST $API/avaliacoes -H "Authorization: Bearer $PROF" -H "$JSON" \
  -d "{\"alunoId\":\"$PAM\",\"dataAvaliacao\":\"2026-11-20\",\"alturaM\":1.75,\"pesoKg\":72}"   # imc 23.5, PESO_NORMAL

# 8. Consultar (RF5, RN3, RN6, RN7): filtros alunoId, professorId, de e ate; o aluno só vê as próprias
curl -s "$API/avaliacoes?alunoId=$PAM&de=2026-09-01" -H "Authorization: Bearer $TOKEN"
curl -s $API/avaliacoes -H "Authorization: Bearer $(pegar_token pam.beesly)"

# 9. Editar e excluir (RN2, RN5): troque AV pelo id de uma avaliação; o IMC é recalculado
curl -s -X PUT $API/avaliacoes/AV -H "Authorization: Bearer $PROF" -H "$JSON" -d '{"pesoKg":90}'
curl -s -i -X DELETE $API/avaliacoes/AV -H "Authorization: Bearer $TOKEN"                              # 204; professor leva 403

# 10. Excluir usuário (RN1): só sem avaliações
curl -s -i -X DELETE $API/usuarios/$PAM -H "Authorization: Bearer $TOKEN"                              # 409: tem avaliações
```

Todo erro volta no formato `application/problem+json` (RFC 9457), com `status`, `codigo` e, nos erros de validação, a lista de `campos`.

## Decisões

Onde a especificação deixa margem, a interpretação adotada está em [docs/decisoes.md](docs/decisoes.md).

## Qualidade

`pnpm verify` roda os mesmos gates do CI: versões fixas, tipos, lint, formatação, duplicação (até 2%), testes com cobertura (80% de linhas, funções e statements; 70% de branches) e build. No lint: complexidade cognitiva até 15, função até 50 linhas úteis (componente até 150), até 4 parâmetros, arquivo até 250 linhas, nenhum `any` e fronteiras entre camadas e entre apps. O CI roda em toda PR, e o check `quality-gates-ok` precisa estar verde para o merge.

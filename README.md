# PSFSSooro

Sistema web para uma academia acompanhar a evolução do IMC dos alunos, com três perfis de acesso: administrador, professor e aluno. Alunos e professores são cadastrados, os professores registram avaliações de IMC e as avaliações podem ser consultadas para acompanhar a evolução.

Monorepo pnpm: `apps/api` (Express 5, TypeORM 1, SQLite), `apps/web` (Next.js 16, Chakra UI 3) e `packages/contracts` (schemas zod compartilhados pelos dois).

> **Em construção.** A tabela abaixo mostra o que já funciona. Ela é atualizada em cada PR.

## Como executar

Requisitos: **Node.js 26.13.1** (o `.nvmrc`; com nvm ou fnm basta entrar na pasta) e **pnpm 12.23.0** (`npm i -g pnpm@12.23.0`, porque o Node 26 não traz mais o Corepack).

```bash
pnpm install
pnpm verify   # tipos, lint, formatação, duplicação, testes com cobertura e build
```

O passo a passo da API, da Web, das migrations e do Docker entra aqui conforme cada parte é entregue.

## Como testar os requisitos

Situação: ✅ funcionando · ⏳ pendente. A coluna "Como ver" traz o usuário de demonstração e o caminho na tela.

### Requisitos funcionais

| Código | O que a especificação pede                                         | Como ver | Situação |
| ------ | ------------------------------------------------------------------ | -------- | -------- |
| RF1    | Cadastrar usuários com perfil administrador, aluno ou professor    | —        | ⏳       |
| RF2    | Ativar ou inativar um usuário                                      | —        | ⏳       |
| RF3    | Cadastrar avaliações de IMC, calculadas a partir de altura e peso  | —        | ⏳       |
| RF4    | Gravar a classificação do IMC conforme a tabela                    | —        | ⏳       |
| RF5    | Consultar as avaliações, com filtro por aluno ou por professor     | —        | ⏳       |
| RF6    | Autenticar com usuário e senha (administrador, professor ou aluno) | —        | ⏳       |

### Regras de negócio

| Código | O que a especificação pede                                                                    | Como ver | Situação |
| ------ | --------------------------------------------------------------------------------------------- | -------- | -------- |
| RN1    | Administrador cadastra, edita e exclui usuários de qualquer perfil (exclui só sem avaliações) | —        | ⏳       |
| RN2    | Administrador cadastra, edita e exclui avaliações                                             | —        | ⏳       |
| RN3    | Administrador consulta as avaliações de qualquer aluno                                        | —        | ⏳       |
| RN4    | Professor cadastra e edita alunos                                                             | —        | ⏳       |
| RN5    | Professor cadastra e edita avaliações                                                         | —        | ⏳       |
| RN6    | Professor consulta as avaliações de seus alunos                                               | —        | ⏳       |
| RN7    | Aluno consulta apenas as próprias avaliações                                                  | —        | ⏳       |
| RN8    | Usuário inativo não acessa o sistema                                                          | —        | ⏳       |
| RN9    | Usuário inativo não pode ter novas avaliações                                                 | —        | ⏳       |

### Exigências técnicas

| Exigência                                                                                      | Onde está                                      | Situação |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| Monorepo no GitHub, Conventional Commits                                                       | este repositório; commitlint no commit e no CI | ✅       |
| Versões fixas (sem `^` nem `~`), Node em `engines` e `.nvmrc`, pnpm em `packageManager`        | `pnpm check-versions`, também no CI            | ✅       |
| TypeScript 6 com `strict: true`                                                                | `tsconfig.base.json`                           | ✅       |
| Back-end: Express, TypeORM com migrations, SQLite, JWT, validação com zod, erros centralizados | `apps/api`                                     | ⏳       |
| Back-end em camadas, SOLID, middlewares de autenticação e autorização, `.env.example`          | `apps/api`                                     | ⏳       |
| Front-end: Next (App Router), Chakra, TanStack Query, React Hook Form, Axios, sem `any`        | `apps/web`                                     | ⏳       |
| Componentes reutilizáveis, mesmo formulário para cadastro e edição, estados de carregamento    | `apps/web`                                     | ⏳       |
| Testes e Docker (diferenciais)                                                                 | testes em cada PR; Docker a seguir             | ⏳       |

## Decisões

Onde a especificação deixa margem, a interpretação adotada está em [docs/decisoes.md](docs/decisoes.md).

## Qualidade

`pnpm verify` roda os mesmos gates do CI: versões fixas, tipos, lint, formatação, duplicação (até 2%), testes com cobertura (80% de linhas, funções e statements; 70% de branches) e build. No lint: complexidade cognitiva até 15, função até 50 linhas úteis (componente até 150), até 4 parâmetros, arquivo até 250 linhas, nenhum `any` e fronteiras entre camadas e entre apps. O CI roda em toda PR, e o check `quality-gates-ok` precisa estar verde para o merge.

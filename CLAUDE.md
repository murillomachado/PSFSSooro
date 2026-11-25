# Regras para agentes de IA neste repositório

Leia antes de qualquer trabalho. O objetivo é **passar no teste técnico**: o avaliador precisa conseguir rodar o sistema e conferir, requisito por requisito, que o que a especificação pede funciona. A tabela "Como testar os requisitos" do [README](README.md) é a fonte de verdade do que está pronto.

## Regras de objetividade

1. **Só o que a especificação pede.** Antes de qualquer trabalho: "a especificação pede isso, ou é indispensável ao que ela pede?" Se não, não se faz. Proibido: verificadores e gates novos, testes de configuração, de CI ou de documentação, ADRs, documentos de processo.
2. **Prioridade:** (1) requisitos obrigatórios (RF1–RF6, RN1–RN9 e os padrões da seção 6), (2) diferenciais pedidos (testes e Docker), (3) extras. Nada do nível 3 antes de o nível 1 estar inteiro funcionando.
3. **Cada PR entrega um pedaço de requisito que o avaliador consegue ver funcionando**, e atualiza a tabela do README (usuário de demonstração, caminho na tela, resultado esperado). PRs por módulo, e não por tarefa miúda.
4. **Testes automatizados só de comportamento do produto.** TDD como método: o teste vem antes do código. Sem ritual de commit vermelho.
5. **Uma rodada de revisão por PR**, e só entram achados que quebrem um requisito, a segurança ou um limite da especificação. O resto é ignorado ou vira uma linha nas pendências.
6. **Descrição de PR com até 15 linhas:** o quê, por quê e como ver funcionando.
7. **Em dúvida entre mais um polimento e o próximo requisito, faça o requisito.**

## Regras do repositório

- **Agente nunca faz merge.** Abra a PR, explique o que mudou e pare: o dono do repositório aprova e faz o squash merge.
- **Commits em Conventional Commits** (escopos: `api`, `web`, `contracts`, `e2e`, `docs`, `ci`, `deps`, `repo`), **sem linha de coautoria e sem rodapé de IA** em commits e PRs. O título da PR segue o mesmo padrão, porque vira o commit da `main`.
- **Toda dependência entra com a versão exata:** `pnpm add pacote@1.2.3`. Sem versão, o pnpm instala o `latest`, que já está fora das séries exigidas (TypeScript 7, better-sqlite3 13). Não use `catalog` nem `overrides`.
- **Nenhum limite do lint é afrouxado para passar.**
- Nomes do domínio em português (`Usuario`, `Avaliacao`, `RegistrarAvaliacao`); termos técnicos consagrados em inglês (`Repository`, `Controller`). Union de literais em vez de `enum`.
- Comandos: `pnpm install`, `pnpm verify` (tudo, antes de qualquer push), `pnpm test`, `pnpm format`.

## Arquitetura

- `apps/api`: módulos `auth`, `usuarios` e `avaliacoes`, cada um com `domain/` (regras, sem HTTP nem ORM), `application/` (casos de uso e as interfaces que eles precisam), `infra/` (entidade do TypeORM, mapper e repositório) e `http/` (controller e rotas). `container.ts` é a única raiz de composição; middlewares `autenticar`, `autorizar(...perfis)`, `validar` e `tratarErros` (RFC 9457).
- `apps/web`: `features/*/{services,hooks}`, `components/ui` (componentes reutilizáveis), `lib/http-client.ts` (único lugar que importa o Axios; a sessão viaja num cookie httpOnly) e `src/proxy.ts` (confere a sessão e o perfil no servidor antes de cada página). As páginas internas são componentes do servidor que preenchem o cache (`features/*/precarregar.ts`, com as chaves de `features/*/chaves.ts`) e entregam a tela de cliente (`features/*/components/Tela*.tsx`).
- O lint barra as violações de fronteira. As decisões e as armadilhas conhecidas estão em [docs/decisoes.md](docs/decisoes.md).

## Armadilhas já conhecidas

- TypeORM 1: um `where` com `undefined` lança erro. Toda coluna declara `type`; `emitDecoratorMetadata` fica desligado.
- O tsx aplica o tsconfig só aos arquivos do `include`. No servidor do Next, o Node 26 tem um `localStorage` global que não funciona: teste `typeof window`.
- ESLint flat config: uma regra repetida num bloco mais específico substitui a anterior, inclusive as opções.
- Regex: o lint barra regex com risco de backtracking e `new RegExp` com texto variável. O BOM entra no código como `0xfeff`, nunca como o caractere.
- Windows: `.gitattributes` força LF.
- Chakra/Emotion no SSR: os estilos passam pelo `RegistroDeEstilos` (`apps/web/src/app`), que os põe no `<head>`. Sem ele, toda página com dados do servidor dá erro de hidratação (React #418) só no build de produção; o E2E de hidratação pega.

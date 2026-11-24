# Decisões

Onde a especificação deixa margem, a interpretação adotada. Cada linha diz o que foi decidido e o porquê.

## Interpretação dos requisitos

| Nº  | Tema                | Decisão                                                                                                                                                                                                                                 |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Alunos do professor | Não há vínculo entre aluno e professor: todo professor atende todos os alunos e vê todas as avaliações. A especificação não pede vínculo, e um aluno pode ser avaliado por professores diferentes ao longo do tempo.                    |
| D2  | Ativar e inativar   | Só o administrador muda a situação de um usuário. Ninguém inativa a si mesmo, e o último administrador ativo não pode ser inativado. O professor cadastra e edita os dados de alunos (a especificação pede), mas não ativa nem inativa. |
| D3  | Edição de avaliação | O professor edita só as avaliações que realizou, porque é o responsável pela medida; vê as dos outros. Editar a de outro responde 403. O administrador edita todas.                                                                     |
| D4  | Avaliador           | Toda avaliação tem um professor avaliador: o próprio professor que registra, ou o escolhido pelo administrador.                                                                                                                         |
| D5  | IMC e faixas        | O IMC é arredondado para uma casa antes de classificar, e cada faixa vai até onde começa a próxima (sem buracos; 40,0 é grau III). O cálculo usa inteiros (gramas e centímetros) para o arredondamento ser exato.                       |
| D6  | Usuários inativos   | Login recusado. O middleware relê o usuário a cada requisição, então quem foi inativado perde o acesso na hora. Não se registra avaliação para aluno nem professor inativo (422).                                                       |
| D7  | Exclusão de usuário | Só o administrador, e só sem avaliações vinculadas (409, sugerindo inativar). A chave estrangeira com `RESTRICT` garante a regra também no banco.                                                                                       |
| D8  | Troca de perfil     | O perfil só muda enquanto o usuário não tem avaliações, para o histórico continuar coerente.                                                                                                                                            |
| D9  | Login e senha       | Nome de usuário único (sem diferenciar maiúsculas), senha de pelo menos 8 caracteres guardada com scrypt (do próprio Node). Usuário inexistente e senha errada recebem a mesma resposta.                                                |
| D10 | Data da avaliação   | Informada no formulário (hoje por padrão), nunca futura (o "hoje" é a data em UTC). A evolução se ordena por ela, e não pela data do cadastro.                                                                                          |
| D11 | Medidas             | Altura em metros e peso em quilos (até duas casas), com limites de sanidade num schema compartilhado. No banco, inteiros (centímetros, gramas e décimos de IMC), porque o SQLite guarda decimal como ponto flutuante.                   |
| D12 | Sessão              | JWT no header `Authorization`, guardado atrás de uma abstração `tokenStorage` sobre o localStorage, com validade de 8 horas e sem refresh token. A guarda de rota da tela melhora a experiência; quem protege os dados é a API.         |

A API responde **404** para o que o perfil não pode ver e **403** para o que ele vê mas não pode mudar.

## Decisões técnicas

Cada uma foi testada num protótipo antes de entrar no projeto.

- **TypeORM com decorators e domínio separado.** O TypeORM 1.1 não aceita os decorators padrão do TypeScript 6 (erro `TS1240`); exige `experimentalDecorators`. Os decorators são o caminho principal da documentação e o mais reconhecível por quem mantém o projeto. O domínio fica sem nenhum import do ORM, e a entidade do banco, com um mapper, fica em `infra/`. `emitDecoratorMetadata` fica desligado, e toda coluna declara o `type`, porque o tsx não emite os metadados. O Vitest precisa de `oxc: { decorator: { legacy: true } }`.
- **`packages/contracts` compilado.** O Node 26 executa `.ts` só fora de `node_modules`, e é lá que o pacote fica na imagem Docker. Por isso o `contracts` é compilado com `tsc -b`, e os apps consomem o `dist`.
- **ESLint 10.** O ESLint 9 saiu de suporte em 06/08/2026. Três plugins do `eslint-config-next` ainda declaram suporte só até o 9, mas funcionam no 10; a exceção é registrada em `peerDependencyRules` quando a Web entra.
- **Versões fixas.** A última estável de cada série exigida, conferida no registro do npm em 23/11/2026. O `latest` do npm já é o TypeScript 7 e o better-sqlite3 13, fora das séries, por isso toda instalação leva a versão explícita e o `pnpm check-versions` confere.
- **pnpm 12.** As configurações ficam no `pnpm-workspace.yaml`; os scripts de instalação são bloqueados por padrão (`allowBuilds`), e versões publicadas há menos de um dia são recusadas.

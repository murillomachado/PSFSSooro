// @ts-check
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import security from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'
import tseslint from 'typescript-eslint'

// Limites de qualidade: complexidade cognitiva até 15, função de até 50 linhas úteis (componente
// .tsx até 150), até 4 parâmetros por função e arquivo de até 250 linhas úteis. A especificação
// (seção 6) considera insuficiente concentrar responsabilidades em poucos arquivos grandes.
const LINHAS_UTEIS = { skipBlankLines: true, skipComments: true }

// Fronteiras entre camadas e entre apps (seção 6 da especificação). No flat config, uma regra
// repetida num bloco mais específico SUBSTITUI a anterior; por isso cada bloco recebe a lista
// completa. Tudo usa `patterns`, porque `paths` só pega o nome exato ('typeorm/index.js' passaria).
const BANCO = ['typeorm', 'better-sqlite3']
const BANCO_E_HTTP = [...BANCO, 'express', 'jsonwebtoken']
const FRONT = [
  'react',
  'react-dom',
  'next',
  '@chakra-ui/react',
  '@emotion/react',
  '@tanstack/react-query',
  'react-hook-form',
  '@psfssooro/web',
]

/** Proíbe cada módulo e qualquer subcaminho dele. @param {string[]} modulos @param {string} message */
const proibir = (modulos, message) => [{ group: modulos.flatMap((m) => [m, `${m}/**`]), message }]

/** @param {{ group: string[], message: string }[]} patterns @returns {import('eslint').Linter.RuleEntry} */
const restringirImports = (patterns) => ['error', { patterns }]

const API_SEM_FRONT = proibir(FRONT, 'A API não depende do front-end.')
const API_SEM_BANCO_FORA_DA_INFRA = proibir(
  BANCO,
  'Na API, o banco só é acessado em modules/*/infra/ e em shared/database/: a entidade do TypeORM nunca sai de lá.',
)
const NUCLEO_SEM_BANCO_E_HTTP = proibir(
  BANCO_E_HTTP,
  'Domínio e casos de uso não importam banco nem HTTP: dependem de interfaces, e a implementação vem do container.',
)
const NUCLEO_SEM_CAMADAS_DE_FORA = [
  {
    group: ['**/infra', '**/infra/**', '**/http', '**/http/**'],
    message: 'Domínio e casos de uso não conhecem as camadas infra/ e http/.',
  },
]
const WEB_SEM_BACK = proibir([...BANCO_E_HTTP, '@psfssooro/api'], 'A Web conversa com a API só por HTTP.')
const AXIOS_SO_NO_CLIENT = proibir(['axios'], 'Use o http-client: telas e services não importam o Axios.')
const CONTRACTS_SEM_DEPENDENCIAS = proibir(
  [...BANCO_E_HTTP, ...FRONT, 'axios', '@psfssooro/api'],
  'O contracts só descreve as mensagens entre Web e API e depende apenas do zod.',
)

// O recomendado do eslint-plugin-security vem como aviso. Aqui, achado de segurança barra o merge.
const SEGURANCA_COMO_ERRO = Object.fromEntries(
  Object.keys(security.configs.recommended.rules ?? {}).map((nome) => [nome, /** @type {const} */ ('error')]),
)

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/dist/', '**/.next/', '**/coverage/']),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
  },
  { files: ['**/*.js', '**/*.mjs'], extends: [tseslint.configs.disableTypeChecked] },
  sonarjs.configs.recommended,
  { plugins: { security }, rules: SEGURANCA_COMO_ERRO },

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Número dentro de template string (`${total} itens`) não tem risco.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // `const { campo: _, ...resto } = obj` remove um campo; `_param` marca um parâmetro que a
      // assinatura exige e o código não usa (o middleware de erro do Express precisa de 4 parâmetros).
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      // Duplica a regra do typescript-eslint acima, sem a opção de rest.
      'sonarjs/no-unused-vars': 'off',
    },
  },
  {
    // Estas regras procuram entrada de usuário chegando a um caminho de arquivo ou a uma chave
    // de objeto. Ficam ligadas no código de produto; em testes e scripts, vêm do repositório.
    files: ['scripts/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: { 'security/detect-object-injection': 'off', 'security/detect-non-literal-fs-filename': 'off' },
  },

  {
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      'max-lines-per-function': ['error', { max: 50, ...LINHAS_UTEIS, IIFEs: true }],
      'max-lines': ['error', { max: 250, ...LINHAS_UTEIS }],
      'max-params': ['error', { max: 4 }],
    },
  },
  {
    // Repete todas as opções: no flat config, as opções do bloco anterior não são herdadas.
    files: ['**/*.tsx'],
    rules: { 'max-lines-per-function': ['error', { max: 150, ...LINHAS_UTEIS, IIFEs: true }] },
  },

  {
    files: ['apps/api/**'],
    rules: { 'no-restricted-imports': restringirImports([...API_SEM_FRONT, ...API_SEM_BANCO_FORA_DA_INFRA]) },
  },
  {
    // A infraestrutura dos módulos e shared/database são os únicos lugares da API que falam com o banco.
    files: ['apps/api/src/modules/*/infra/**', 'apps/api/src/shared/database/**'],
    rules: { 'no-restricted-imports': restringirImports(API_SEM_FRONT) },
  },
  {
    files: ['apps/api/src/modules/*/domain/**', 'apps/api/src/modules/*/application/**'],
    rules: {
      'no-restricted-imports': restringirImports([
        ...API_SEM_FRONT,
        ...NUCLEO_SEM_BANCO_E_HTTP,
        ...NUCLEO_SEM_CAMADAS_DE_FORA,
      ]),
    },
  },
  {
    files: ['apps/web/**'],
    rules: { 'no-restricted-imports': restringirImports([...WEB_SEM_BACK, ...AXIOS_SO_NO_CLIENT]) },
  },
  {
    // Os testes montam respostas de erro do Axios (AxiosError); telas e services seguem sem importá-lo.
    files: ['apps/web/**/*.test.ts', 'apps/web/**/*.test.tsx'],
    rules: { 'no-restricted-imports': restringirImports(WEB_SEM_BACK) },
  },
  {
    files: ['apps/web/src/lib/http-client.ts'],
    rules: { 'no-restricted-imports': restringirImports(WEB_SEM_BACK) },
  },
  {
    files: ['packages/contracts/**'],
    rules: { 'no-restricted-imports': restringirImports(CONTRACTS_SEM_DEPENDENCIAS) },
  },

  {
    // Testes descrevem cenários, e um describe com vários casos é longo por natureza.
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { 'sonarjs/cognitive-complexity': 'off', 'max-lines-per-function': 'off' },
  },
])

// Confere as regras de versão da seção 5.1 da especificação em todo package.json do repositório:
// versão exata (sem ^ nem ~), série exigida, pnpm 12 no packageManager e Node 26 igual ao .nvmrc.
// Uso: pnpm check-versions
import { existsSync, globSync, readFileSync } from 'node:fs'
import path from 'node:path'

const SERIES_EXIGIDAS = new Map([
  ['typescript', 6],
  ['express', 5],
  ['typeorm', 1],
  ['better-sqlite3', 12],
  ['jsonwebtoken', 9],
  ['zod', 4],
  ['react', 19],
  ['react-dom', 19],
  ['next', 16],
  ['@chakra-ui/react', 3],
  ['@emotion/react', 11],
  ['@tanstack/react-query', 5],
  ['react-hook-form', 7],
  ['@hookform/resolvers', 7],
  ['axios', 1],
])
const SECOES = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const
const PASTAS_IGNORADAS = ['node_modules', '.next', 'dist', 'coverage']
const CHAVES_PROIBIDAS_NO_WORKSPACE = ['catalog', 'catalogs', 'overrides']
const VERSAO_EXATA = /^(\d+)\.\d+\.\d+$/

type Secao = Readonly<Record<string, unknown>> | null
interface Manifesto {
  packageManager?: string
  engines?: { node?: string }
  dependencies?: Secao
  devDependencies?: Secao
  optionalDependencies?: Secao
  peerDependencies?: Secao
}

const raiz = path.resolve(import.meta.dirname, '..')
const lerTexto = (relativo: string): string | undefined => {
  const arquivo = path.join(raiz, relativo)
  return existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : undefined
}

function serieDe(versao: string): number | undefined {
  const encontrada = VERSAO_EXATA.exec(versao)?.[1]
  return encontrada === undefined ? undefined : Number(encontrada)
}

function problemaDaVersao(nome: string, versao: unknown): string | undefined {
  if (typeof versao !== 'string') return 'precisa ter a versão escrita como texto'
  if (versao.startsWith('workspace:')) return undefined
  const serie = serieDe(versao)
  if (serie === undefined) return `usa "${versao}"; declare a versão exata (sem ^, ~, * ou tags)`
  const exigida = SERIES_EXIGIDAS.get(nome)
  if (exigida !== undefined && serie !== exigida) return `está na série ${serie}; a especificação exige a ${exigida}`
  return undefined
}

function problemasDasDependencias(arquivo: string, manifesto: Manifesto): string[] {
  return SECOES.flatMap((secao) => Object.entries(manifesto[secao] ?? {})).flatMap(([nome, versao]) => {
    const problema = problemaDaVersao(nome, versao)
    return problema === undefined ? [] : [`${arquivo}: "${nome}" ${problema}`]
  })
}

function problemasDaRaiz(manifesto: Manifesto): string[] {
  const problemas: string[] = []
  if (!/^pnpm@12\.\d+\.\d+/.test(manifesto.packageManager ?? '')) {
    problemas.push('package.json: "packageManager" precisa ser o pnpm 12.x.y, com versão fixa')
  }
  const node = manifesto.engines?.node ?? ''
  const nvmrc = (lerTexto('.nvmrc') ?? '').trim().replace(/^v/i, '')
  if (serieDe(node) !== 26) problemas.push('package.json: "engines.node" precisa ser o Node 26, com versão fixa')
  else if (node !== nvmrc) problemas.push(`.nvmrc ("${nvmrc}") precisa ser igual a engines.node ("${node}")`)
  return problemas
}

function problemasDoWorkspace(): string[] {
  const linhas = (lerTexto('pnpm-workspace.yaml') ?? '').split('\n')
  return CHAVES_PROIBIDAS_NO_WORKSPACE.filter((chave) => linhas.some((linha) => linha.startsWith(`${chave}:`))).map(
    (chave) => `pnpm-workspace.yaml: "${chave}" fixa versões fora dos package.json, onde este gate não confere`,
  )
}

const arquivos = globSync('**/package.json', {
  cwd: raiz,
  exclude: (caminho) => caminho.split(/[\\/]/).some((parte) => PASTAS_IGNORADAS.includes(parte)),
})
const problemas = [
  ...arquivos.flatMap((arquivo) => {
    const manifesto = JSON.parse(readFileSync(path.join(raiz, arquivo), 'utf8')) as Manifesto
    const doArquivo = problemasDasDependencias(arquivo.replaceAll('\\', '/'), manifesto)
    return arquivo === 'package.json' ? [...problemasDaRaiz(manifesto), ...doArquivo] : doArquivo
  }),
  ...problemasDoWorkspace(),
]

if (problemas.length === 0) {
  console.log(`check-versions: ${arquivos.length} package.json conferidos, nenhuma violação.`)
} else {
  console.log(`check-versions: ${problemas.length} problema(s):`)
  for (const problema of problemas) console.log(`  - ${problema}`)
  process.exitCode = 1
}

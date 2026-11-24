import { type Perfil, usuarioRespostaSchema } from '@psfssooro/contracts'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * De dentro do servidor da Web, a API pode ter outro endereço (no Docker, `http://api:3333/api`);
 * o NEXT_PUBLIC_API_URL é o que o navegador usa.
 */
const API = process.env.API_URL_INTERNA ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api'
const COOKIE_DA_SESSAO = 'sessao'
const EQUIPE: readonly Perfil[] = ['ADMINISTRADOR', 'PROFESSOR']

/** As páginas que nem todo perfil abre. As demais exigem só estar logado. */
const RESTRITAS: readonly { readonly caminho: RegExp; readonly perfis: readonly Perfil[] }[] = [
  { caminho: /^\/usuarios(\/|$)/, perfis: EQUIPE },
  { caminho: /^\/avaliacoes\/nova$/, perfis: EQUIPE },
  { caminho: /^\/avaliacoes\/[^/]+\/editar$/, perfis: EQUIPE },
]

/** Quem é o dono do cookie, segundo a API; undefined se não há sessão válida (ou a API não respondeu). */
async function perfilDaSessao(cookie: string): Promise<Perfil | undefined> {
  try {
    const resposta = await fetch(`${API}/auth/me`, {
      headers: { Cookie: `${COOKIE_DA_SESSAO}=${cookie}` },
      cache: 'no-store',
    })
    if (!resposta.ok) return undefined
    const usuario = usuarioRespostaSchema.safeParse(await resposta.json())
    return usuario.success ? usuario.data.perfil : undefined
  } catch {
    return undefined
  }
}

const irPara = (destino: string, req: NextRequest) => NextResponse.redirect(new URL(destino, req.url))

/**
 * Roda no servidor antes de cada página: sem sessão, vai para o login; com sessão, o login leva ao
 * início; e quem não tem o perfil da página também volta ao início. A API continua conferindo tudo
 * (403/404): isto só evita mostrar uma tela que a pessoa não pode usar.
 */
export async function proxy(req: NextRequest): Promise<NextResponse> {
  const caminho = req.nextUrl.pathname
  const cookie = req.cookies.get(COOKIE_DA_SESSAO)?.value
  const perfil = cookie === undefined ? undefined : await perfilDaSessao(cookie)

  if (caminho === '/login') return perfil === undefined ? NextResponse.next() : irPara('/inicio', req)
  if (perfil === undefined) return irPara('/login', req)
  const restrita = RESTRITAS.find((regra) => regra.caminho.test(caminho))
  if (restrita !== undefined && !restrita.perfis.includes(perfil)) return irPara('/inicio', req)
  return NextResponse.next()
}

export const config = {
  // Todas as páginas, menos os arquivos do próprio Next e os estáticos (com extensão).
  matcher: ['/((?!_next/|.*\\..*).*)'],
}

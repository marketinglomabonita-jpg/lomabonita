import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isManagedPath, IS_DEMO } from '@/core/config/site'

/**
 * Middleware:
 *  1. Compuerta secreta: /admin, /cocina y /login responden 404 salvo que la peticion
 *     traiga la cookie panel_access (que solo se obtiene entrando por la direccion
 *     secreta /<ADMIN_PANEL_SLUG>). Fail-closed: sin env, todo sigue cerrado.
 *  2. RESILIENCIA: solo las rutas gestionadas (/admin, /cocina) consultan Supabase.
 *     La web publica y el login pasan directo sin tocar la base de datos, asi una
 *     caida o pausa de Supabase NUNCA tumba el sitio publico (antes el 504 global).
 *  3. En rutas gestionadas se refresca la sesion (patron @supabase/ssr) y se protege:
 *     getUser() va con timeout y, si Supabase no responde o no hay sesion, fail-closed
 *     -> redirige a /login (jamas se expone el panel sin autenticar).
 *  4. /admin, /cocina y /login van SIEMPRE noindex; en modo demo, todo el sitio.
 */

const PANEL_COOKIE = 'panel_access'

/** Tiempo maximo que esperamos a Supabase en el middleware antes de fail-closed. */
const SUPABASE_TIMEOUT_MS = 3000

function isLoginPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/login/')
}

/** Rechaza con 'timeout' si la promesa no resuelve dentro de ms. */
function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const slug = process.env.ADMIN_PANEL_SLUG
  const panelKey = process.env.ADMIN_PANEL_KEY

  // 1. Entrada por la direccion secreta: fija la cookie de acceso y manda al login.
  if (slug && panelKey && (pathname === `/${slug}` || pathname === `/${slug}/`)) {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.set(PANEL_COOKIE, panelKey, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 180, // 180 dias
    })
    return res
  }

  const esGestionada = isManagedPath(pathname)
  const esLogin = isLoginPath(pathname)

  // 2. Compuerta: sin la cookie correcta, el panel y el login no existen (404).
  //    No consulta Supabase: se corta aqui antes de crear el cliente.
  //    Fail-closed: si falta panelKey en el env, la cookie nunca es valida.
  if (esGestionada || esLogin) {
    const hasAccess = !!panelKey && request.cookies.get(PANEL_COOKIE)?.value === panelKey
    if (!hasAccess) {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  // 3. Web publica y login: NO se toca Supabase. Pasa directo (resiliencia: una
  //    caida de la base de datos no puede afectar nada fuera del panel). Solo se
  //    marca noindex donde corresponde.
  if (!esGestionada) {
    const res = NextResponse.next({ request })
    if (IS_DEMO || esLogin) {
      res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    }
    return res
  }

  // 4. Ruta gestionada: refrescar sesion de Supabase y proteger el acceso.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() con timeout. Si Supabase no responde (pausado/lento/caido) o no hay
  // sesion, fail-closed: al login. El panel jamas queda accesible sin autenticar.
  let user = null
  try {
    const {
      data: { user: u },
    } = await conTimeout(supabase.auth.getUser(), SUPABASE_TIMEOUT_MS)
    user = u
  } catch {
    user = null
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Panel siempre noindex.
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = {
  // Todo menos assets estaticos y el optimizador de imagenes.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)'],
}

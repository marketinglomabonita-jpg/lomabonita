import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isManagedPath, IS_DEMO } from '@/core/config/site'

/**
 * Middleware:
 *  1. Compuerta secreta: /admin, /cocina y /login responden 404 salvo que la peticion
 *     traiga la cookie panel_access (que solo se obtiene entrando por la direccion
 *     secreta /<ADMIN_PANEL_SLUG>). Fail-closed: sin env, todo sigue cerrado.
 *  2. Refresca la sesion de Supabase en cada request (patron @supabase/ssr).
 *  3. Protege las rutas gestionadas (/admin, /cocina): sin sesion -> redirige a /login.
 *  4. /admin, /cocina y /login van SIEMPRE noindex; en modo demo, todo el sitio.
 */

const PANEL_COOKIE = 'panel_access'

function isLoginPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/login/')
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

  // 2. Compuerta: sin la cookie correcta, el panel y el login no existen (404).
  //    No consulta Supabase: se corta aqui antes de crear el cliente.
  //    Fail-closed: si falta panelKey en el env, la cookie nunca es valida.
  if (isManagedPath(pathname) || isLoginPath(pathname)) {
    const hasAccess = !!panelKey && request.cookies.get(PANEL_COOKIE)?.value === panelKey
    if (!hasAccess) {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Ruta gestionada sin sesion -> al login (ya paso la compuerta de cookie).
  if (isManagedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 4. Panel y login nunca indexables (siempre); en demo, todo el sitio.
  if (IS_DEMO || isManagedPath(pathname) || isLoginPath(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

export const config = {
  // Todo menos assets estaticos y el optimizador de imagenes.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)'],
}

import { cookies } from 'next/headers'

/**
 * Manifest de la PWA del panel. Ruta dedicada (y no app/manifest.ts) para que
 * el sitio público NO se vuelva instalable: este archivo solo lo referencia el
 * layout de /admin vía un <link rel="manifest" crossOrigin="use-credentials">.
 *
 * start_url según la cookie de acceso (la misma compuerta secreta del panel):
 *  - Con cookie válida (staff que instala DESDE el panel): el `start_url` es la
 *    dirección secreta `/<slug>`, que al abrir la app vuelve a fijar la cookie y
 *    manda al login. Así el ícono instalado funciona aunque el contexto
 *    standalone no comparta la cookie del navegador (iOS, o Android tras limpiar
 *    datos). El slug queda guardado SOLO en el dispositivo del dueño.
 *  - Sin cookie (fetch público): `start_url` genérico `/admin/calendario` y el
 *    slug NO se expone. La compuerta 404 del middleware sigue protegiendo todo.
 *
 * El fetch del manifest es same-origin con credenciales, así que la cookie viaja.
 *
 * Colores de marca medidos de globals.css: verde selva (--primary) y crema de fondo.
 */
export async function GET() {
  const slug = process.env.ADMIN_PANEL_SLUG
  const panelKey = process.env.ADMIN_PANEL_KEY
  const tieneAcceso =
    !!panelKey && (await cookies()).get('panel_access')?.value === panelKey

  // Con acceso, arrancar por la dirección secreta (fija la cookie y va al login);
  // si no, un destino genérico que no revela el slug.
  const startUrl = tieneAcceso && slug ? `/${slug}` : '/admin/calendario'

  const manifest = {
    name: 'Loma Bonita · Panel',
    short_name: 'LB Panel',
    description: 'Panel interno de gestión — Finca Hotel Loma Bonita',
    start_url: startUrl,
    // Scope en la raíz: el start_url puede ser la dirección secreta (fuera de
    // /admin). El manifest solo lo enlaza el panel, así que el sitio público no
    // se vuelve instalable por esto.
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf8f5',
    theme_color: '#1f5138',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      // Varía por cookie y no debe cachearse compartido (start_url personalizado).
      'Cache-Control': 'private, no-store',
    },
  })
}
